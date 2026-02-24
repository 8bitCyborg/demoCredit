import { IncomingMessage, ServerResponse } from 'http';
import { walletService } from '../services/wallet.service.js';
import { getRequestBody } from '../utils/body-parser.js';

export class WalletController {
  async getBalance(req: IncomingMessage, res: ServerResponse) {
    const balance = await walletService.getBalance('user_123');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(balance));
  }

  async fundAccount(req: IncomingMessage, res: ServerResponse) {
    const body = await getRequestBody(req);
    const result = await walletService.fundAccount('user_123', body.amount);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  }

  async transfer(req: IncomingMessage, res: ServerResponse) {
    const body = await getRequestBody(req);
    const result = await walletService.transfer('user_123', body.toUserId, body.amount);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  }

  async withdraw(req: IncomingMessage, res: ServerResponse) {
    const body = await getRequestBody(req);
    const result = await walletService.withdraw('user_123', body.amount);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  }
}

export const walletController = new WalletController();
