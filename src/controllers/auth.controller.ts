import { IncomingMessage, ServerResponse } from 'http';
import { authService } from '../services/auth.service.js';
import { getRequestBody } from '../utils/body-parser.js';
import { signupSchema, loginSchema } from '../schemas/auth.schema.js';

export class AuthController {
  signup = async (req: IncomingMessage, res: ServerResponse) => {
    const body = await getRequestBody(req);
    const validation = signupSchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Validation failed',
        errors: validation.error.format()
      };
    };

    const response = await authService.signup(validation.data);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Set-Cookie',
      `token=${response.token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict`,
    );
    return { response };
  };

  login = async (req: IncomingMessage, res: ServerResponse) => {
    const body = await getRequestBody(req);
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Validation failed',
        errors: validation.error.format()
      };
    };
    const response = await authService.login(validation.data);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Set-Cookie',
      `token=${response.token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict`,
    );
    return { response };
  };

  logout = async (req: IncomingMessage, res: ServerResponse) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Set-Cookie', 'token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict');
    return { message: 'Logged out successfully' };
  };
};

export const authController = new AuthController();
