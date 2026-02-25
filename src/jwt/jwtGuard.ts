import { IncomingMessage } from 'http';
import type { TokenPayload } from './jwt.util.js';
import { verifyToken } from './jwt.util.js';

export interface AuthenticatedRequest extends IncomingMessage {
  user?: TokenPayload;
}

export const jwtGuard = async (req: AuthenticatedRequest) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw { status: 401, message: 'Authorization header missing or invalid' };
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw { status: 401, message: 'Bearer token missing' };
  }
  const decoded = verifyToken(token);

  req.user = decoded;
  return decoded;
};

export const getUserIdFromRequest = (req: IncomingMessage): number => {
  const user = (req as AuthenticatedRequest).user;
  if (!user || !user.userId) {
    throw { status: 401, message: 'User not authenticated' };
  }
  return user.userId;
};
