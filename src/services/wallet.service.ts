import db from "../database/db.js";

export class WalletService {
  async getWallet(user_id: number) {
    return await db('wallets').where({ user_id }).first();
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

  private async _validateTransaction(ref: string, email: string) {
    // here we validate with a partner (eg: paystack) that the funding info is actually legit.
    // if successful, we extract the user's id or email from the validation data if we need to.
    // for the purposes of this demo, we will just return true and pretend we already have the user's email from the funding validation response.
    return {
      ref,
      isValid: true,
      email
    };
  };

  // use this to find a user's id from as funding info from the partner doesn't "usually" carry the user's id.
  // emails are usually consistent though.
  private async _getWalletByEmail(email: string) {
    const wallet = await db('wallets')
      .join('users', 'wallets.user_id', 'users.id')
      .where('users.email', email)
      .select('wallets.id')
      .first();

    //probably should create user wallet here if nonexistent but leave as is for now.
    if (!wallet) throw new Error("No wallet found for this user");
    return wallet;
  };

  private async _validateWallet(userWallet: any, amount: number) {
    if (userWallet.is_disabled) throw new Error("Wallet is disabled");
    if (userWallet.balance < amount) throw new Error("Insufficient balance");
  };

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
    return await db.transaction(async (trx: any) => {
      const validateTransaction = await this._validateTransaction(body.reference, body.email);
      if (!validateTransaction) throw new Error("Transaction validation failed");

      const userWallet = await this._getWalletByEmail(body.email);
      await this._validateWallet(userWallet, body.amount);
      await this._credit({
        ...body,
        counterparty_name: 'Self',
        counterparty_id: userWallet.id,
      }, userWallet.id, trx);

      return { message: "Wallet funded successfully", status: 200 };
    });
  };

  async withdrawFromWallet(body: any) {
    return await db.transaction(async (trx: any) => {
      const userWallet = await this.getWalletById(body.user_id, trx);
      await this._validateWallet(userWallet, body.amount);
      await this._debit(body, userWallet.id, trx);
      return { message: "Wallet withdrawn successfully", status: 200 };
    });
  };

  async transferFunds(body: any) {
    return await db.transaction(async (trx) => {
      const senderWallet = await this.getWalletById(body.sender_user_id, trx);
      const receiverWallet = await this.getWalletById(body.receiver_user_id, trx);
      await this._validateWallet(senderWallet, body.amount); // verify the sender can actually send the money.
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

      return { message: "Funds transferred successfully", status: 200 };
    });
  };


};

export const walletService = new WalletService();
