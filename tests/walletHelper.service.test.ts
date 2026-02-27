import { describe, it, expect, vi, beforeEach } from 'vitest';
import { walletHelperService } from '../src/services/wallet.helper.service.js';
import db from '../src/database/db.js';

// Mock the db module
vi.mock('../src/database/db.js', () => ({
  default: vi.fn(() => ({
    join: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    first: vi.fn(),
  })),
}));

describe('WalletHelperService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('idempotency', () => {
    it('should return true if reference exists (Positive)', async () => {
      const result = await walletHelperService.idempotency({ reference: 'ref_123' });
      expect(result).toBe(true);
    });

    it('should throw if reference is missing (Negative)', async () => {
      await expect(walletHelperService.idempotency({}))
        .rejects.toThrow('Transaction reference is required');
    });
  });

  describe('validateTransaction', () => {
    it('should return a validation object with the provided reference', async () => {
      const ref = 'test_ref_999';
      const result = await walletHelperService.validateTransaction(ref);

      expect(result.isValid).toBe(true);
      expect(result.ref).toBe(ref);
      expect(result.validationData.customer.email).toBeDefined();
    });
  });

  describe('getWalletByEmail', () => {
    it('should return wallet ID when email exists (Positive)', async () => {
      const mockWallet = { id: 50 };

      // Mocking the chain: db('wallets').join(...).where(...).select(...).first()
      const firstMock = vi.fn().mockResolvedValue(mockWallet);
      const selectMock = vi.fn().mockReturnValue({ first: firstMock });
      const whereMock = vi.fn().mockReturnValue({ select: selectMock });
      const joinMock = vi.fn().mockReturnValue({ where: whereMock });

      vi.mocked(db).mockReturnValue({ join: joinMock } as any);

      const result = await walletHelperService.getWalletByEmail('test@user.com');

      expect(result.id).toBe(50);
      expect(joinMock).toHaveBeenCalledWith('users', 'wallets.user_id', 'users.id');
      expect(whereMock).toHaveBeenCalledWith('users.email', 'test@user.com');
    });

    it('should throw "No wallet found" if result is null (Negative)', async () => {
      const firstMock = vi.fn().mockResolvedValue(null);
      vi.mocked(db).mockReturnValue({
        join: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        first: firstMock
      } as any);

      await expect(walletHelperService.getWalletByEmail('unknown@user.com'))
        .rejects.toThrow('No wallet found for this user');
    });
  });

  describe('validateWallet', () => {
    const mockWallet = { balance: 1000, is_disabled: false };

    it('should pass if wallet is active and has enough balance (Positive)', async () => {
      // Should not throw
      await expect(walletHelperService.validateWallet(mockWallet, 500))
        .resolves.not.toThrow();
    });

    it('should throw if wallet is disabled (Negative)', async () => {
      const disabledWallet = { ...mockWallet, is_disabled: true };
      await expect(walletHelperService.validateWallet(disabledWallet, 100))
        .rejects.toThrow('Wallet is disabled');
    });

    it('should throw if balance is insufficient (Negative)', async () => {
      await expect(walletHelperService.validateWallet(mockWallet, 1500))
        .rejects.toThrow('Insufficient balance');
    });
  });
});