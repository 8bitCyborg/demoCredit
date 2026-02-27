import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ledgerController } from '../src/controllers/ledger.controller.js';
import { ledgerService } from '../src/services/ledger.service.js';
import * as jwtGuard from '../src/jwt/jwtGuard.js';

describe('LedgerController', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getUserLedger', () => {
    it('should return ledger data for a valid authenticated user (Positive)', async () => {
      // 1. Mock the Guard to return a specific User ID
      const mockUserId = 1;
      const guardSpy = vi.spyOn(jwtGuard, 'getUserIdFromRequest').mockReturnValue(mockUserId);

      // 2. Mock the Service to return dummy ledger data
      const mockLedger = {
        id: 'ledger-abc',
        balance: 5000,
        currency: 'NGN',
        userId: mockUserId
      };
      const serviceSpy = vi.spyOn(ledgerService, 'getUserLedger').mockResolvedValue(mockLedger as any);

      // 3. Execute
      const mockReq = { headers: { authorization: 'Bearer valid-token' } };
      const mockRes = {};

      const result = await ledgerController.getUserLedger(mockReq, mockRes);

      // 4. Assert
      expect(guardSpy).toHaveBeenCalledWith(mockReq);
      expect(serviceSpy).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockLedger);
    });

    it('should throw an error if the jwtGuard fails (Negative)', async () => {
      // 1. PRIME THE SPY HERE so Vitest starts watching it
      const serviceSpy = vi.spyOn(ledgerService, 'getUserLedger');

      // 2. Mock the guard to throw
      vi.spyOn(jwtGuard, 'getUserIdFromRequest').mockImplementation(() => {
        throw { status: 401, message: 'Unauthorized' };
      });

      const mockReq = {};
      const mockRes = {};

      // 3. Check for rejection
      await expect(ledgerController.getUserLedger(mockReq, mockRes))
        .rejects.toMatchObject({ status: 401, message: 'Unauthorized' });

      // 4. Now this will work!
      expect(serviceSpy).not.toHaveBeenCalled();
    });

    it('should propagate errors from the ledgerService (Negative)', async () => {
      vi.spyOn(jwtGuard, 'getUserIdFromRequest').mockReturnValue(1);

      // Mock service failure (e.g., Database timeout)
      vi.spyOn(ledgerService, 'getUserLedger').mockRejectedValue(new Error('DB Timeout'));

      await expect(ledgerController.getUserLedger({}, {}))
        .rejects.toThrow('DB Timeout');
    });
  });
});