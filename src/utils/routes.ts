import { IncomingMessage, ServerResponse } from 'http';
import { authController } from '../controllers/auth.controller.js';
import { userController } from '../controllers/user.controller.js';
import { walletController } from '../controllers/wallet.controller.js';
import { asyncHandler } from './async-handler.js';

export interface Route {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  handler: (req: IncomingMessage, res: ServerResponse) => Promise<any>;
}

export const routes: Route[] = [
  // Auth Routes
  { path: '/api/auth/signup', method: 'POST', handler: authController.signup },
  { path: '/api/auth/login', method: 'POST', handler: authController.login },

  // User Routes
  { path: '/api/user/profile', method: 'GET', handler: userController.getProfile },

  // Wallet Routes
  { path: '/api/wallet/fund', method: 'POST', handler: walletController.fundWallet },
  { path: '/api/wallet/withdraw', method: 'POST', handler: walletController.withdrawFromWallet },
  { path: '/api/wallet/transfer', method: 'POST', handler: walletController.transfer }
];

export const routeMap = new Map<string, Route>(
  routes.map(route => [
    `${route.method}:${route.path}`,
    { ...route, handler: asyncHandler(route.handler) }
  ])
);
