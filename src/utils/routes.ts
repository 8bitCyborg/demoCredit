import { IncomingMessage, ServerResponse } from 'http';
import { authController } from '../controllers/auth.controller.js';
import { userController } from '../controllers/user.controller.js';
import { walletController } from '../controllers/wallet.controller.js';
import { ledgerController } from '../controllers/ledger.controller.js';
import { asyncHandler } from './async-handler.js';

export interface Route {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  handler: (req: IncomingMessage, res: ServerResponse) => Promise<any>;
  isPublic?: boolean;
}

export const routes: Route[] = [
  // Auth Routes
  { path: '/api/auth/signup', method: 'POST', handler: authController.signup, isPublic: true },
  { path: '/api/auth/login', method: 'POST', handler: authController.login, isPublic: true },
  { path: '/api/auth/logout', method: 'POST', handler: authController.logout },

  // User Routes
  { path: '/api/user/validate-receiver', method: 'POST', handler: userController.validateReceiver },
  { path: '/api/ledger/get-user-ledger', method: 'GET', handler: ledgerController.getUserLedger },

  // Wallet Routes
  { path: '/api/wallet', method: 'GET', handler: walletController.getWallet },
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
