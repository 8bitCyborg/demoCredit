import db from "../database/db.js";

export class WalletService {
  private async _validateTransaction(ref: string, email: string) {
    // here we validate with a partner (eg: paystack) that the funding is actually legit.
    // if successful, we extract the user's id or email from the validation data if we need to.
    // for the purposes of this demo, we will just return true and pretend we already have the user's email from the funding webbook and validation response.
    return {
      isValid: true,
      email
    };
  };

  private async _credit(body: any, wallet_id: number, trx?: any) {
    // here we credit the user's wallet and generate a credit ledger entry.
    return await db.transaction(async (trx) => {
      await trx('wallets')
        .where({ id: wallet_id })
        .increment('balance', body.amount);
      //amount should be in the smallest denom.

      await trx('transactions').insert({
        wallet_id: wallet_id,
        amount: body.amount,
        type: 'credit',
        category: body.category,
        status: 'success',
        reference: body.reference,
        description: body.description,
      });
    });

  };

  private async _debit(body: any, wallet_id: number, trx?: any) {
    return await db.transaction(async (trx) => {
      await trx('wallets')
        .where({ id: wallet_id })
        .decrement('balance', body.amount);
      //amount should be in the smallest denom.

      await trx('transactions').insert({
        wallet_id: wallet_id,
        amount: body.amount,
        type: 'debit',
        category: body.category,
        status: 'success',
        reference: body.reference,
        description: body.description,
      });
    });
  };

  private async getWalletByEmail(email: string) {
    const wallet = await db('wallets')
      .join('users', 'wallets.user_id', 'users.id')
      .where('users.email', email)
      .select('wallets.id')
      .first();

    //probably should create user wallet here if nonexistent but leave as is for now.
    if (!wallet) throw new Error("No wallet found for this user");
    return wallet;
  };

  async createWallet(userId: number, trx?: any) {
    const query = trx || db;
    return await query('wallets').insert({
      user_id: userId,
      balance: 0,
      is_disabled: false,
    });
  };

  async fundWallet(body: any) {
    const validateTransaction = await this._validateTransaction(body.reference, body.email);
    if (!validateTransaction) throw new Error("Transaction validation failed");

    const userWallet = await this.getWalletByEmail(body.email);
    const creditUserWallet = await this._credit(body, userWallet.id);
    return { message: "Wallet funded successfully" };
  };

};

export const walletService = new WalletService();
