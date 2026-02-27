import db from "../database/db.js";
import { walletHelperService as whs } from "./wallet.helper.service.js";

export class WalletService {

  async getWalletById(user_id: number, trx?: any) {
    const query = trx ?? db;
    const wallet = await query('wallets')
      .where({ user_id })
      .modify((builder: any) => {
        if (trx) builder.forUpdate();
      })
      .first();
    if (!wallet) throw new Error("No wallet found for this user");
    return wallet;
  };

  private async _credit(body: any, wallet_id: number, trx?: any) {
    // here we credit the user's wallet and generate a credit ledger entry.

    await trx('wallets')
      .where({ id: wallet_id })
      .increment('balance', body.amount);//amount should be in the smallest denom.

    await trx('transactions').insert({
      wallet_id: wallet_id,
      amount: body.amount,
      type: 'credit',
      category: body.category,
      status: 'success',
      reference: body.reference,
      description: body.description,
      counterparty_name: body.counterparty_name,
      counterparty_id: body.counterparty_id,
    });
  };

  private async _debit(body: any, wallet_id: number, trx?: any) {
    await trx('wallets')
      .where({ id: wallet_id })
      .decrement('balance', body.amount); //amount should be in the smallest denom.

    await trx('transactions').insert({
      wallet_id: wallet_id,
      amount: body.amount,
      type: 'debit',
      category: body.category,
      status: 'success',
      reference: body.reference,
      description: body.description,
      counterparty_name: body.counterparty_name,
      counterparty_id: body.counterparty_id,
    });
  };


  // trx here just on the offchance that this is called from a transaction
  async createWallet(userId: number, trx?: any) {
    const query = trx || db;
    return await query('wallets').insert({
      user_id: userId,
      balance: 0,
      is_disabled: false,
    });
  };

  async fundWallet(body: any) {
    await whs.idempotency(body);

    return await db.transaction(async (trx: any) => {
      const validateTransaction = await whs.validateTransaction(body.reference);
      if (!validateTransaction) throw new Error("Transaction validation failed");

      const userWallet = await whs.getWalletByEmail(body.email);
      await whs.validateWallet(userWallet, body.amount);
      await this._credit({
        ...body,
        counterparty_name: 'Self',
        counterparty_id: userWallet.id,
      }, userWallet.id, trx);

      //pass an email off to the queue here to notify the user of the funding.
      return { message: "Wallet funded successfully", status: 200 };
    });
  };

  async withdrawFromWallet(body: any) {
    await whs.idempotency(body);

    // before getting here, the bank being withdrawn to would have first been verified.
    // the user will also be ideally required to set up a withdrawal pin that will be verified first before getting here as well.

    return await db.transaction(async (trx: any) => {
      const userWallet = await this.getWalletById(body.user_id, trx);
      await whs.validateWallet(userWallet, body.amount);
      await this._debit(body, userWallet.id, trx);

      // pass an email/notification off to the queue here to notify the user of the withdrawal.
      return { message: "Wallet withdrawn successfully", status: 200 };
    });
  };

  async transferFunds(body: any) {
    await whs.idempotency(body);
    // the user will also be ideally required to set up a withdrawal pin that will be verified first before getting here.

    return await db.transaction(async (trx) => {
      const senderWallet = await this.getWalletById(body.sender_user_id, trx);
      const receiverWallet = await this.getWalletById(body.receiver_user_id, trx);
      await whs.validateWallet(senderWallet, body.amount); // verify the sender can actually send the money.
      await this._debit({
        ...body,
        counterparty_id: body.receiver_user_id,
        counterparty_name: body.receiver_name,
        reference: body.reference + "-DR",
      }, senderWallet.id, trx);

      await this._credit({
        ...body,
        counterparty_id: body.sender_user_id,
        counterparty_name: body.sender_name,
        reference: body.reference + "-CR",
      }, receiverWallet.id, trx);

      // send an email/notification here to the sender and receiver via a queue to notify them of the transaction.
      return { message: "Funds transferred successfully", status: 200 };
    });
  };


};

export const walletService = new WalletService();
