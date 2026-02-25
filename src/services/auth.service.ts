import { userService } from "./user.service.js";
import bcrypt from "bcrypt";
import { generateToken } from "../jwt/jwt.util.js";

export class AuthService {
  async signup(body: any) {
    try {
      // first check if user is blacklisted on lendsqr karma. Do not complete signup if they are.
      // const karma_response = await fetch(`https://adjutor.lendsqr.com/v2/verification/karma/${body.bvn}`, {
      //   method: 'GET',
      //   headers: { 'Authorization': `Bearer ${process.env.APP_SECRET}` }
      // });

      // if (karma_response.ok) {
      //   const data = await karma_response.json();
      //   if (data?.data?.karma_identity) {
      //     throw new Error('Blacklisted');
      //   };
      // };

      const user = await userService.create(body);
      const token = generateToken({ userId: user.id, email: user.email });
      return {
        user,
        token
      };
    } catch (error) {
      return {
        message: 'Unable to complete signup. Please try again later',
        error
      };
    };
  };

  async login(body: any) {
    const { email, password } = body;
    const user = await userService.getUserByEmail(email, true);
    if (!user) throw new Error('User not found');

    const isPasswordValid = await bcrypt.compare(password, user?.password);
    if (!isPasswordValid) throw new Error('Invalid email/password');

    const token = generateToken({ userId: user.id, email: user.email });
    return {
      user,
      token,
    };
  };

};

export const authService = new AuthService();
