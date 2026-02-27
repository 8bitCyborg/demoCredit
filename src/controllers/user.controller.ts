import { IncomingMessage, ServerResponse } from 'http';
import { userService } from '../services/user.service.js';
import { getRequestBody } from '../utils/body-parser.js';
import { validateReceiverSchema } from '../schemas/auth.schema.js';

export class UserController {
  validateReceiver = async (req: IncomingMessage, res: ServerResponse) => {
    const body = await getRequestBody(req);
    const validation = validateReceiverSchema.safeParse(body);
    if (!validation.success) {
      throw { status: 400, message: 'Validation failed', errors: validation.error.format() };
    };

    const result = await userService.getUserByPhone(body.phone, false);
    return result;
  };
};

export const userController = new UserController();
