import { create } from "node:domain";
import { userService } from "./user.service.js";
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

      const createUser = await userService.create(body);
      return {
        createUser,
        token: 'faux-jwt-token'
      };
    } catch (error) {
      return {
        message: 'Unable to complete signup. Please try again later',
        error
      };
    };
  };

  async login(body: any) {
    return {
      id: body.id,
      name: 'Demo User',
      email: 'user@example.com',
      createdAt: new Date().toISOString()
    };
  };
};

export const authService = new AuthService();
