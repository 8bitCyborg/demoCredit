import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userController } from '../src/controllers/user.controller.js';
import { userService } from '../src/services/user.service.js';
import * as bodyParser from '../src/utils/body-parser.js';

describe('UserController', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateReceiver', () => {
    it('should return user data for a valid phone number (Positive)', async () => {
      const validBody = { phone: '08012345678' }; // 11 digits
      const mockUser = { id: 1, first_name: 'John', last_name: 'Doe' };

      // Mock body parser
      vi.spyOn(bodyParser, 'getRequestBody').mockResolvedValue(validBody);
      // Mock user service
      const serviceSpy = vi.spyOn(userService, 'getUserByPhone').mockResolvedValue(mockUser as any);

      const result = await userController.validateReceiver({} as any, {} as any);

      expect(result).toEqual(mockUser);
      expect(serviceSpy).toHaveBeenCalledWith(validBody.phone, false);
    });

    it('should throw 400 if phone number fails regex validation (Negative)', async () => {
      // 10 digits instead of 11 (fails your schema regex)
      vi.spyOn(bodyParser, 'getRequestBody').mockResolvedValue({ phone: '1234567890' });

      // Prime the service spy to ensure it's tracked even if not called
      const serviceSpy = vi.spyOn(userService, 'getUserByPhone');

      try {
        await userController.validateReceiver({} as any, {} as any);
      } catch (error: any) {
        expect(error.status).toBe(400);
        expect(error.message).toBe('Validation failed');
        expect(error.errors.phone).toBeDefined();
      }

      expect(serviceSpy).not.toHaveBeenCalled();
    });

    it('should return null/undefined if user service finds no one (Positive - User Not Found)', async () => {
      vi.spyOn(bodyParser, 'getRequestBody').mockResolvedValue({ phone: '09011122233' });
      vi.spyOn(userService, 'getUserByPhone').mockResolvedValue(null);

      const result = await userController.validateReceiver({} as any, {} as any);

      expect(result).toBeNull();
    });
  });
});