import { describe, it, expect, vi, beforeEach } from 'vitest';
import { walletController } from '../src/controllers/wallet.controller.js';
import { walletService } from '../src/services/wallet.service.js';
import * as jwtGuard from '../src/jwt/jwtGuard.js';
import * as bodyParser from '../src/utils/body-parser.js';

describe('WalletController', () => {
  const MOCK_USER_ID = 1;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(jwtGuard, 'getUserIdFromRequest').mockReturnValue(MOCK_USER_ID);
  });

  describe('getWallet', () => {
    it('should return wallet for authenticated user', async () => {
      const mockWallet = { id: 10, user_id: MOCK_USER_ID, balance: 5000 };
      vi.spyOn(walletService, 'getWalletById').mockResolvedValue(mockWallet as any);
      const result = await walletController.getWallet({} as any, {} as any);
      expect(result).toEqual(mockWallet);
    });
  });

  describe('fundWallet', () => {
    it('should successfully fund wallet with valid data', async () => {
      const validFunding = {
        amount: 5000,
        email: 'user@test.com',
        reference: 'ext-ref-001',
        category: 'funding'
      };
      vi.spyOn(bodyParser, 'getRequestBody').mockResolvedValue(validFunding);
      vi.spyOn(walletService, 'fundWallet').mockResolvedValue({ success: true } as any);
      const result = await walletController.fundWallet({} as any, {} as any);
    });
  });

  describe('withdrawFromWallet', () => {
    it('should pass authenticated user_id and valid data to service', async () => {
      const validWithdrawal = {
        amount: 2000,
        reference: 'with-001',
        counterparty_id: '1234567890',
        destination_bank_code: '058',
        counterparty_name: 'John Doe Savings'
      };

      vi.spyOn(bodyParser, 'getRequestBody').mockResolvedValue(validWithdrawal);
      const serviceSpy = vi.spyOn(walletService, 'withdrawFromWallet').mockResolvedValue({ status: 'processing' } as any);

      const result = await walletController.withdrawFromWallet({} as any, {} as any);

      expect(result.status).toBe('processing');
      // Added 'category' here because Zod adds the default value automatically
      expect(serviceSpy).toHaveBeenCalledWith({
        user_id: MOCK_USER_ID,
        category: 'withdrawal',
        ...validWithdrawal
      });
    });
  });

  describe('transfer', () => {
    const validTransferData = {
      receiver_user_id: 2,
      receiver_name: 'Jane Smith',
      sender_name: 'John Doe',
      amount: 1000,
      reference: 'trans-unique-99',
      category: 'p2p-transfer'
    };

    it('should successfully transfer funds (Positive)', async () => {
      vi.spyOn(bodyParser, 'getRequestBody').mockResolvedValue(validTransferData);
      vi.spyOn(walletService, 'transferFunds').mockResolvedValue({ transaction_id: 'tx-1' } as any);
      const result = await walletController.transfer({} as any, {} as any);
    });

    it('should prevent user from sending money to themselves (Negative)', async () => {
      // 1. PRIME THE SPY AT THE START
      const serviceSpy = vi.spyOn(walletService, 'transferFunds');

      const selfTransferData = { ...validTransferData, receiver_user_id: MOCK_USER_ID };
      vi.spyOn(bodyParser, 'getRequestBody').mockResolvedValue(selfTransferData);

      await expect(walletController.transfer({} as any, {} as any))
        .rejects.toMatchObject({
          status: 400,
          message: 'You cannot send money to yourself.'
        });

      expect(serviceSpy).not.toHaveBeenCalled();
    });

    it('should throw 400 if validation fails (Negative)', async () => {
      vi.spyOn(bodyParser, 'getRequestBody').mockResolvedValue({ amount: 100 });
      try {
        await walletController.transfer({} as any, {} as any);
      } catch (error: any) {
        expect(error.status).toBe(400);
      }
    });
  });
});