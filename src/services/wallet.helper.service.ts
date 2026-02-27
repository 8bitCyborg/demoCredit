import db from "../database/db.js";

export class WalletHelperService {
  async idempotency(data: any) {
    // in an actual prod app, the purpose of this is to prevent duplicate transactions, particularly from replay attacks.
    // we generate a key from the transaction by hashing specific data that will be constant and unique to the transaction.
    // we then check if the key already exists in redis.
    // if it does, we throw an error.
    // if it doesn't, we insert the key with a ttl of 30s if the transaction is successful.
    // for the sake of this demo, we will just rely on the unique reference constraint on transactions to prevent duplicates.
    // this would be certainly be required in an actual, production app.
    if (!data.reference) {
      throw new Error("Transaction reference is required");
    };
    return true;
  };

  async validateTransaction(ref: string) {
    // here we validate with a partner (eg: paystack) that the funding info is actually legit.
    // we pass the reference from the payment webhook or from the client to the partner.
    // if verificaion is successful, we extract the user's phone or email or some other way of ID-ing them on our side from the validation data if we need to.
    // for the purposes of this demo, we will just return true and pretend we already have the user's email from the funding validation response.
    return {
      isValid: true,
      validationData: {
        ref: 'reference from validation.',
        amount: 'amount from validation',
        customer: {
          email: 'email from validation',
          id: 'id from validation',
          phone: 'phone from validation',
        }
      },
      ref,
    };
  };

  // use this to find a user's id from as funding info from the partner doesn't "usually" carry the user's id.
  // emails are usually consistent though.
  async getWalletByEmail(email: string) {
    const wallet = await db('wallets')
      .join('users', 'wallets.user_id', 'users.id')
      .where('users.email', email)
      .select('wallets.id')
      .first();

    //probably should create user wallet here if nonexistent but leave as is for now.
    if (!wallet) throw new Error("No wallet found for this user");
    return wallet;
  };

  // use this to validate a user's wallet before performing a transaction.
  async validateWallet(userWallet: any, amount: number) {
    if (userWallet.is_disabled) throw new Error("Wallet is disabled");
    if (userWallet.balance < amount) throw new Error("Insufficient balance");
  };
}

export const walletHelperService = new WalletHelperService();
