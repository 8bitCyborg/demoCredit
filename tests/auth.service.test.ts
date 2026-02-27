import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../src/services/auth.service.js';
import { userService } from '../src/services/user.service.js';
import * as jwtUtil from '../src/jwt/jwt.util.js';
import bcrypt from 'bcrypt';

describe('AuthService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Clear global fetch mock if any
    vi.stubGlobal('fetch', vi.fn());
  });

  describe('signup', () => {
    const signupBody = {
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      password: 'password123',
      bvn: '12345678901'
    };

    it('should successfully create a user and return a token (Positive)', async () => {
      // 1. Mock dependencies
      const mockUser = { id: 1, email: 'jane@example.com' };
      vi.spyOn(userService, 'create').mockResolvedValue(mockUser as any);
      vi.spyOn(jwtUtil, 'generateToken').mockReturnValue('mocked-jwt-token');

      // 2. Execute
      const result = await authService.signup(signupBody);

      // 3. Assert
      expect(userService.create).toHaveBeenCalledWith(signupBody);
      expect(result).toEqual({
        user: mockUser,
        token: 'mocked-jwt-token',
        status: 200
      });
    });

    it('should block signup if user is blacklisted on Lendsqr Karma (Negative)', async () => {
      const blacklistedBody = { ...signupBody, bvn: '22222222222' };
      // 1. You MUST spy on the method first so Vitest can track it
      const createSpy = vi.spyOn(userService, 'create');

      // 2. Mock global fetch
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { karma_identity: 'some-identity' } })
      }));

      // 3. Check for the rejection
      await expect(authService.signup(blacklistedBody))
        .rejects.toThrow('Unable to complete signup. Please try again later.');

      // 4. Now this will work because it's a spy!
      expect(createSpy).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginBody = { email: 'jane@example.com', password: 'password123' };
    const dbUser = {
      id: 1,
      email: 'jane@example.com',
      password: 'hashed_password'
    };

    it('should login successfully with correct credentials (Positive)', async () => {
      vi.spyOn(userService, 'getUserByEmail').mockResolvedValue(dbUser as any);
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as any);
      vi.spyOn(jwtUtil, 'generateToken').mockReturnValue('login-token');

      const result = await authService.login(loginBody);

      expect(result.token).toBe('login-token');
      expect(result.user).not.toHaveProperty('password'); // Ensure password is stripped
    });

    it('should throw "User not found" if email does not exist (Negative)', async () => {
      vi.spyOn(userService, 'getUserByEmail').mockResolvedValue(null);

      await expect(authService.login(loginBody))
        .rejects.toThrow('User not found');
    });

    it('should throw "Invalid email/password" for wrong password (Negative)', async () => {
      vi.spyOn(userService, 'getUserByEmail').mockResolvedValue(dbUser as any);
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as any); // Password mismatch

      await expect(authService.login(loginBody))
        .rejects.toThrow('Invalid email/password');
    });
  });
});