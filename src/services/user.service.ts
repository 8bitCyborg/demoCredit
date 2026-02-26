import db from "../database/db.js";
import { walletService } from "./wallet.service.js";
import bcrypt from 'bcrypt';

export class UserService {

  async create(body: any) {
    const saltRounds = Number(process.env.SALT_ROUNDS);
    if (!saltRounds) throw new Error("Unable to create user");
    const hashedPassword = await bcrypt.hash(body.password, saltRounds);
    const { password, ...signupData } = body;

    return await db.transaction(async (trx) => {
      //using a transaction here so if wallet creation fails after user creation, we roll back and they can try again.
      //to avoid users without a wallet.
      const [userId] = await trx('users').insert({
        ...signupData,
        password: hashedPassword,
      });
      if (!userId) {
        throw new Error("Failed to retrieve User ID after insertion");
      };
      await walletService.createWallet(userId, trx);
      const user = await this.getUserById(userId, trx);
      return user;
    });
  };

  async getUserById(id: number, trx?: any) {
    const query = trx || db;
    const user = await query('users')
      .where({ id })
      .whereNull('deleted_at')
      .select('id', 'first_name', 'last_name', 'email', 'created_at')
      .first();
    return user;
  };

  async getUserByEmail(email: string, withPassword: boolean = false) {
    const columns = ['id', 'first_name', 'last_name', 'email', 'created_at', 'bvn', 'phone', ...(withPassword ? ['password'] : [])];
    const user = await db('users')
      .where({ email })
      .whereNull('deleted_at')
      .select(columns)
      .first();
    return user;
  };


};

export const userService = new UserService();
