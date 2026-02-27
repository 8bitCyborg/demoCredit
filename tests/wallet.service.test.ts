import { describe, it, expect, vi, beforeEach } from 'vitest';
import { walletService } from '../src/services/wallet.service.js';
import { walletHelperService as whs } from '../src/services/wallet.helper.service.js';
import db from '../src/database/db.js';

// Mock DB and Transaction
vi.mock('../src/database/db.js', () => ({
  default: Object.assign(vi.fn(), {
    transaction: vi.fn((cb) => cb(vi.fn())),
  }),
}));

describe('WalletService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('transferFunds', () => {
    const transferBody = {
      sender_user_id: 1,
      receiver_user_id: 2,
      amount: 1000,
      reference: 'TX-REF-100',
      sender_name: 'Sender Name',
      receiver_name: 'Receiver Name',
      category: 'transfer'
    };

    it('should successfully transfer funds between two wallets', async () => {
      // 1. Setup mocks
      vi.spyOn(whs, 'idempotency').mockResolvedValue(true);

      const senderWallet = { id: 101, user_id: 1, balance: 5000 };
      const receiverWallet = { id: 202, user_id: 2, balance: 500 };

      // Mock getWalletById to return sender then receiver
      const getWalletSpy = vi.spyOn(walletService, 'getWalletById')
        .mockResolvedValueOnce(senderWallet as any)
        .mockResolvedValueOnce(receiverWallet as any);

      vi.spyOn(whs, 'validateWallet').mockResolvedValue(undefined);

      // Mock the transaction helper
      const trx = vi.fn();
      vi.mocked(db.transaction).mockImplementation(async (cb) => cb(trx as any));

      // Spy on private-ish methods (using 'any' because they are private in TS)
      const debitSpy = vi.spyOn(walletService as any, '_debit').mockResolvedValue(undefined);
      const creditSpy = vi.spyOn(walletService as any, '_credit').mockResolvedValue(undefined);

      // 2. Execute
      const result = await walletService.transferFunds(transferBody);

      // 3. Assertions
      expect(result.status).toBe(200);
      expect(whs.idempotency).toHaveBeenCalledWith(transferBody);
      expect(getWalletSpy).toHaveBeenCalledTimes(2);
      expect(debitSpy).toHaveBeenCalledWith(expect.objectContaining({
        amount: 1000,
        reference: 'TX-REF-100-DR'
      }), 101, trx);
      expect(creditSpy).toHaveBeenCalledWith(expect.objectContaining({
        amount: 1000,
        reference: 'TX-REF-100-CR'
      }), 202, trx);
    });

    it('should fail if sender has insufficient funds', async () => {
      vi.spyOn(whs, 'idempotency').mockResolvedValue(true);
      vi.spyOn(walletService, 'getWalletById').mockResolvedValue({ id: 101 } as any);

      // Mock validation failure
      vi.spyOn(whs, 'validateWallet').mockRejectedValue(new Error('Insufficient balance'));

      await expect(walletService.transferFunds(transferBody))
        .rejects.toThrow('Insufficient balance');
    });
  });

  describe('getWalletById', () => {
    it('should use forUpdate when a transaction is provided (Pessimistic Locking)', async () => {
      const forUpdate = vi.fn().mockReturnThis();
      const first = vi.fn().mockResolvedValue({ id: 1 });
      const modify = vi.fn().mockImplementation((cb) => {
        cb({ forUpdate });
        return { first };
      });
      const where = vi.fn().mockReturnValue({ modify });
      const trx = vi.fn().mockReturnValue({ where });

      await walletService.getWalletById(1, trx);

      expect(where).toHaveBeenCalledWith({ user_id: 1 });
      expect(forUpdate).toHaveBeenCalled(); // Verifies row locking for concurrency
    });
  });
});