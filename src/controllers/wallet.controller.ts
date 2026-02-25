import { IncomingMessage, ServerResponse } from 'http';
import { walletService } from '../services/wallet.service.js';
import { getRequestBody } from '../utils/body-parser.js';

export class WalletController {
  fundWallet = async (req: IncomingMessage, res: ServerResponse) => {
    const body = await getRequestBody(req);
    const result = await walletService.fundWallet(body);
    return result;
  };

  withdrawFromWallet = async (req: IncomingMessage, res: ServerResponse) => {
    const body = await getRequestBody(req);
    const result = await walletService.withdrawFromWallet(body);
    return result;
  };

  transfer = async (req: IncomingMessage, res: ServerResponse) => {
    const body = await getRequestBody(req);
    const result = await walletService.transferFunds(body);
    return result;
  };
}

export const walletController = new WalletController();
