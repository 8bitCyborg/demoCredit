import db from "../database/db.js";

export class LedgerService {

  async createLedgerEntry(body: any, trx?: any) {
    return await trx('transactions').insert({
      wallet_id: body.wallet_id,
      amount: body.amount,
      type: body.type,
      category: body.category,
      status: body.status,
      reference: body.reference,
      description: body.description
    });
  };

  async getUserLedger(userId: number) {
    const wallet = await db('wallets').where({ user_id: userId }).first();
    if (!wallet) throw new Error("No wallet found for this user");
    return await db('transactions').where({ wallet_id: wallet.id });
  };

};

export const ledgerService = new LedgerService();