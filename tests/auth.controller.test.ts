import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authController } from '../src/controllers/auth.controller.js';
import { authService } from '../src/services/auth.service.js';
import * as bodyParser from '../src/utils/body-parser.js';

describe('AuthController', () => {
  const createMockResponse = () => {
    const res: any = {
      headers: {} as Record<string, string>,
      setHeader: vi.fn((key, value) => {
        res.headers[key] = value;
      }),
    };
    return res;
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('signup', () => {
    const validSignupData = {
      first_name: 'John',
      last_name: 'Doe',
      phone: '08012345678',
      email: 'john@example.com',
      password: 'password123',
      bvn: '12345678900',
    };

    it('should successfully sign up and set auth cookie (Positive)', async () => {
      vi.spyOn(bodyParser, 'getRequestBody').mockResolvedValue(validSignupData);
      vi.spyOn(authService, 'signup').mockResolvedValue({
        token: 'valid-jwt',
        user: { id: 1, email: 'john@example.com' },
        status: 201
      } as any);

      const res = createMockResponse();
      const result = await authController.signup({} as any, res);

      expect(result.response.token).toBe('valid-jwt');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      // Verify Cookie contains token and required security flags
      expect(res.headers['Set-Cookie']).toContain('token=valid-jwt');
      expect(res.headers['Set-Cookie']).toContain('Secure');
      expect(res.headers['Set-Cookie']).toContain('SameSite=None');
    });

    it('should throw 400 if validation fails (Negative)', async () => {
      vi.spyOn(bodyParser, 'getRequestBody').mockResolvedValue({
        ...validSignupData,
        email: 'not-an-email', // Invalid email
        bvn: '123' // Too short
      });

      const res = createMockResponse();

      try {
        await authController.signup({} as any, res);
      } catch (error: any) {
        expect(error.status).toBe(400);
        expect(error.message).toBe('Validation failed');
        expect(error.errors.email).toBeDefined();
        expect(error.errors.bvn).toBeDefined();
      }
    });

    it('should propagate errors from authService (Negative)', async () => {
      vi.spyOn(bodyParser, 'getRequestBody').mockResolvedValue(validSignupData);
      vi.spyOn(authService, 'signup').mockRejectedValue({
        status: 409,
        message: 'User already exists'
      });

      const res = createMockResponse();

      await expect(authController.signup({} as any, res))
        .rejects.toMatchObject({ status: 409, message: 'User already exists' });
    });
  });

  describe('login', () => {
    const validLoginData = {
      email: 'john@example.com',
      password: 'password123'
    };

    it('should successfully login and set auth cookie (Positive)', async () => {
      vi.spyOn(bodyParser, 'getRequestBody').mockResolvedValue(validLoginData);
      vi.spyOn(authService, 'login').mockResolvedValue({
        token: 'login-token',
        user: { id: 1 },
        status: 200
      } as any);

      const res = createMockResponse();
      const result = await authController.login({} as any, res);

      expect(result.response.token).toBe('login-token');
      expect(res.headers['Set-Cookie']).toContain('token=login-token');
    });

    it('should throw 400 for invalid email format (Negative)', async () => {
      vi.spyOn(bodyParser, 'getRequestBody').mockResolvedValue({
        email: 'bad-email',
        password: '123'
      });

      const res = createMockResponse();

      try {
        await authController.login({} as any, res);
      } catch (error: any) {
        expect(error.status).toBe(400);
        expect(error.errors.email).toBeDefined();
      }
    });
  });

  describe('logout', () => {
    it('should clear the token cookie (Positive)', async () => {
      const res = createMockResponse();
      const result = await authController.logout({} as any, res);

      expect(result.message).toBe('Logged out successfully');
      // Check that Max-Age is 0 to delete the cookie
      expect(res.headers['Set-Cookie']).toContain('Max-Age=0');
      expect(res.headers['Set-Cookie']).toContain('token=;');
    });
  });
});