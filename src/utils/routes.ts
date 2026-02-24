import { IncomingMessage, ServerResponse } from 'http';
import { authController } from '../controllers/auth.controller.js';
import { userController } from '../controllers/user.controller.js';
import { walletController } from '../controllers/wallet.controller.js';

export interface Route {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>;
}

export const routes: Route[] = [
  // Auth Routes
  { path: '/api/auth/signup', method: 'POST', handler: authController.signup.bind(authController) },
  { path: '/api/auth/login', method: 'POST', handler: authController.login.bind(authController) },

  // User Routes
  { path: '/api/user/profile', method: 'GET', handler: userController.getProfile.bind(userController) },

  // Wallet Routes
  { path: '/api/wallet/balance', method: 'GET', handler: walletController.getBalance.bind(walletController) },
  { path: '/api/wallet/fund', method: 'POST', handler: walletController.fundAccount.bind(walletController) },
  { path: '/api/wallet/transfer', method: 'POST', handler: walletController.transfer.bind(walletController) },
  { path: '/api/wallet/withdraw', method: 'POST', handler: walletController.withdraw.bind(walletController) },
];

export const routeMap = new Map<string, Route>(
  routes.map(route => [`${route.method}:${route.path}`, route])
);
