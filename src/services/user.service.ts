import db from "../database/db.js";
import { WalletService } from "./wallet.service.js";

export class UserService {

  async create(body: any) {
    return await db.transaction(async (trx) => {
      const [userId, email] = await trx('users').insert(body);
      console.log('userId', userId);

      await trx('wallets').insert({
        user_id: userId,
        balance: 0,
        is_disabled: false,
      });

      return { userId, email };
    });
  };

  async getProfile(userId: string) {
    return {
      id: userId,
      name: 'Demo User',
      email: 'user@example.com',
      createdAt: new Date().toISOString()
    };
  }
}

export const userService = new UserService();
