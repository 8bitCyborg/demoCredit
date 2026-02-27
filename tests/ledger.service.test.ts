import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ledgerService } from '../src/services/ledger.service.js';
import db from '../src/database/db.js';

// We mock the entire 'db' module
vi.mock('../src/database/db.js', () => ({
  default: vi.fn(() => ({
    where: vi.fn().mockReturnThis(),
    first: vi.fn(),
    insert: vi.fn(),
  })),
}));

describe('LedgerService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getUserLedger', () => {
    it('should return transactions for a user with a valid wallet (Positive)', async () => {
      const mockWallet = { id: 10, user_id: 1 };
      const mockTransactions = [
        { id: 1, amount: 100, type: 'credit' },
        { id: 2, amount: 50, type: 'debit' }
      ];

      // Setup the chain: db('wallets').where(...).first()
      const firstMock = vi.fn().mockResolvedValue(mockWallet);
      const whereMock = vi.fn().mockReturnValue({ first: firstMock });
      vi.mocked(db).mockReturnValue({ where: whereMock } as any);

      // Setup the second call: db('transactions').where(...)
      // Note: We handle the second call differently if it's the same mock instance
      whereMock.mockImplementation((query) => {
        if (query.user_id) return { first: firstMock };
        if (query.wallet_id) return Promise.resolve(mockTransactions);
        return {};
      });

      const result = await ledgerService.getUserLedger(1);

      expect(result).toEqual(mockTransactions);
      expect(whereMock).toHaveBeenCalledWith({ user_id: 1 });
      expect(whereMock).toHaveBeenCalledWith({ wallet_id: 10 });
    });

    it('should throw "No wallet found" if wallet query returns null (Negative)', async () => {
      // Setup: first() returns null
      const firstMock = vi.fn().mockResolvedValue(null);
      const whereMock = vi.fn().mockReturnValue({ first: firstMock });
      vi.mocked(db).mockReturnValue({ where: whereMock } as any);

      await expect(ledgerService.getUserLedger(999))
        .rejects.toThrow('No wallet found for this user');
    });
  });

  describe('createLedgerEntry', () => {
    it('should use the provided transaction (trx) to insert data', async () => {
      // Mock the knex transaction object
      const insertSpy = vi.fn().mockResolvedValue([1]);
      const trxMock = vi.fn().mockReturnValue({ insert: insertSpy });

      const entryData = {
        wallet_id: 10,
        amount: 500,
        type: 'credit',
        category: 'deposit',
        status: 'completed',
        reference: 'ref-123',
        description: 'Test'
      };

      await ledgerService.createLedgerEntry(entryData, trxMock);

      expect(trxMock).toHaveBeenCalledWith('transactions');
      expect(insertSpy).toHaveBeenCalledWith(entryData);
    });
  });
});