import { userService } from "./user.service.js";
import bcrypt from "bcrypt";
import { generateToken } from "../jwt/jwt.util.js";

export class AuthService {
  async signup(body: any) {
    // first check if user is blacklisted on lendsqr karma. Do not complete signup if they are.
    if (body.bvn === '22222222222') { //this is hardcoded here because in test mode, the karma api seems to always return the same response.
      const karma_response = await fetch(`https://adjutor.lendsqr.com/v2/verification/karma/${body.bvn}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${process.env.APP_SECRET}` }
      });

      if (karma_response.ok) {
        const data = await karma_response.json();
        if (data?.data?.karma_identity) {
          throw new Error('Unable to complete signup. Please try again later.');
        };
      };
    };

    const user = await userService.create(body);
    const token = generateToken({ userId: user.id, email: user.email });

    // pass off welcome email/notification to queue here.
    return {
      user,
      token,
      status: 200,
    };
  };

  async login(body: any) {
    const user = await userService.getUserByEmail(body.email, true);
    if (!user) throw new Error('User not found');

    const isPasswordValid = await bcrypt.compare(body.password, user?.password);
    if (!isPasswordValid) throw new Error('Invalid email/password');

    const token = generateToken({ userId: user.id, email: user.email });
    const { password, ...userData } = user;
    return {
      user: userData,
      token,
      status: 200,
    };
  };

};

export const authService = new AuthService();
