import { getUserIdFromRequest } from '../jwt/jwtGuard.js';
import { ledgerService } from '../services/ledger.service.js';

export class LedgerController {
  async getUserLedger(req: any, res: any) {
    const userId = getUserIdFromRequest(req);
    console.log('userid', userId);
    const ledger = await ledgerService.getUserLedger(userId);
    return ledger;
  };
};

export const ledgerController = new LedgerController();