import { IncomingMessage, ServerResponse } from 'http';
import { userService } from '../services/user.service.js';

export class UserController {
  async getProfile(req: IncomingMessage, res: ServerResponse) {
    const profile = await userService.getProfile('user_123');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(profile));
  }
}

export const userController = new UserController();
