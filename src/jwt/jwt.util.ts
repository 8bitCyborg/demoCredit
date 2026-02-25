import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_for_demo';
const JWT_EXPIRES_IN = '24h';

export interface TokenPayload {
  userId: number;
  email: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw { status: 401, message: 'Invalid or expired token' };
  }
};

export const getUserIdFromToken = (token: string): number => {
  return verifyToken(token).userId;
};