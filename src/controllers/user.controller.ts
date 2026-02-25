import { IncomingMessage, ServerResponse } from 'http';
import { userService } from '../services/user.service.js';

export class UserController {
  getProfile = async (req: IncomingMessage, res: ServerResponse) => {
    // Implementation will go here
    return { message: 'Profile implementation pending' };
  };
}

export const userController = new UserController();
