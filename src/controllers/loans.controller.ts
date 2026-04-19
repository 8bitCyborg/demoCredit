import { loanService } from '../services/loans.service.js';
import { loanSchema } from '../schemas/loan.schema.js';
import { getUserIdFromRequest } from '../jwt/jwtGuard.js';

export class LoanController {
  async applyForLoan(req: any, res: any) {
    try {
      const userId = getUserIdFromRequest(req);
      const file = req.file;
      const amount = req.body.amount;

      // Validation logic
      const validation = loanSchema.safeParse({
        amount,
        bankStatement: file,
        installments: req.body.installments,
        amountPerInstallment: req.body.amountPerInstallment
      });

      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.format()
        });
      }

      // Verification logging as requested
      console.log('--- Loan Application Received ---');

      // Call service to record the application (optional context)
      await loanService.uploadLoanDocument({
        amount: validation.data.amount,
        installments: validation.data.installments,
        interest_rate: 5, // 5% amortized interest
        fileMetadata: {
          name: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          buffer: file.buffer,
        },
      }, userId);

      return res.status(200).json({
        message: 'Loan application submitted successfully in memory',
        file: {
          name: file.originalname,
          size: file.size
        }
      });
    } catch (error: any) {
      console.error('Loan application error:', error);
      return res.status(error.status || 500).json({ error: error.message || 'Internal Server Error' });
    }
  };
};

export const loanController = new LoanController();