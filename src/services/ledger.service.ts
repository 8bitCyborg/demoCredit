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

};

export const ledgerService = new LedgerService();