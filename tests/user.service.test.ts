import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from '../src/services/user.service.js';
import { walletService } from '../src/services/wallet.service.js';
import db from '../src/database/db.js';
import bcrypt from 'bcrypt';

// Mock the db module
vi.mock('../src/database/db.js', () => ({
  default: Object.assign(vi.fn(() => ({
    where: vi.fn().mockReturnThis(),
    whereNull: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    first: vi.fn(),
  })), {
    // Mock the transaction method specifically
    transaction: vi.fn((cb) => cb('mock-trx')),
  }),
}));

describe('UserService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.SALT_ROUNDS = '10';
  });

  describe('create', () => {
    it('should hash password and create user + wallet within a transaction', async () => {
      const signupBody = {
        first_name: 'Jane',
        password: 'plainPassword',
        email: 'jane@test.com'
      };

      // 1. Mock bcrypt
      vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);

      // 2. Mock DB calls within transaction
      const trxMock = vi.fn((table) => ({
        insert: vi.fn().mockResolvedValue([55]) // Returns User ID 55
      }));
      vi.mocked(db.transaction).mockImplementation(async (cb) => cb(trxMock as any));

      // 3. Mock wallet service and internal getUserById
      vi.spyOn(walletService, 'createWallet').mockResolvedValue({} as any);
      const getUserSpy = vi.spyOn(userService, 'getUserById').mockResolvedValue({
        id: 55,
        first_name: 'Jane',
        email: 'jane@test.com'
      } as any);

      const result = await userService.create(signupBody);

      // Assertions
      expect(bcrypt.hash).toHaveBeenCalledWith('plainPassword', 10);
      expect(trxMock).toHaveBeenCalledWith('users');
      expect(walletService.createWallet).toHaveBeenCalledWith(55, trxMock);
      expect(getUserSpy).toHaveBeenCalledWith(55, trxMock);
      expect(result.id).toBe(55);
    });

    it('should throw error if SALT_ROUNDS is missing', async () => {
      delete process.env.SALT_ROUNDS;
      await expect(userService.create({})).rejects.toThrow('Unable to create user');
    });
  });

  describe('getUserByPhone', () => {
    it('should select correct columns including password when requested', async () => {
      const firstMock = vi.fn().mockResolvedValue({ id: 1, password: 'hash' });
      const selectMock = vi.fn().mockReturnValue({ first: firstMock });
      const whereNullMock = vi.fn().mockReturnValue({ select: selectMock });
      const whereMock = vi.fn().mockReturnValue({ whereNull: whereNullMock });

      vi.mocked(db).mockReturnValue({ where: whereMock } as any);

      await userService.getUserByPhone('08012345678', true);

      // Verify password was included in the select array
      const selectCall = selectMock.mock.calls[0][0];
      expect(selectCall).toContain('password');
      expect(whereMock).toHaveBeenCalledWith({ phone: '08012345678' });
    });

    it('should exclude password by default', async () => {
      const selectMock = vi.fn().mockReturnThis();
      vi.mocked(db).mockReturnValue({
        where: vi.fn().mockReturnThis(),
        whereNull: vi.fn().mockReturnThis(),
        select: selectMock,
        first: vi.fn()
      } as any);

      await userService.getUserByPhone('08012345678');

      const selectCall = selectMock.mock.calls[0][0];
      expect(selectCall).not.toContain('password');
    });
  });
});