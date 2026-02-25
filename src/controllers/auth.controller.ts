import { IncomingMessage, ServerResponse } from 'http';
import { authService } from '../services/auth.service.js';
import { getRequestBody } from '../utils/body-parser.js';

export class AuthController {
  signup = async (req: IncomingMessage, res: ServerResponse) => {
    const body = await getRequestBody(req);
    const response = await authService.signup(body);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    return { response };
  };

  login = async (req: IncomingMessage, res: ServerResponse) => {
    const body = await getRequestBody(req);
    const response = await authService.login(body);
    return { response };
  };
}

export const authController = new AuthController();
