import { IncomingMessage, ServerResponse } from 'http';
import { authService } from '../services/auth.service.js';
import { getRequestBody } from '../utils/body-parser.js';

export class AuthController {
  async signup(req: IncomingMessage, res: ServerResponse) {
    const body = await getRequestBody(req);
    const response = await authService.signup(body);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ response }));
  };

  async login(req: IncomingMessage, res: ServerResponse) {
    const body = await getRequestBody(req);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'User logged in successfully',
      token: 'faux-jwt-token',
      user: { email: 'user', id: 'user_123' },
    }));
  };

};

export const authController = new AuthController();
