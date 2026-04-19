import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export const loanSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  bankStatement: z
    .any()
    .refine((file) => file, 'Bank statement is required')
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file.type || file.mimetype),
      "Only .pdf, .jpg, and .png formats are supported."
    ),
  installments: z.coerce.number().int().min(1).max(24, 'Maximum 24 installments allowed'),
  amountPerInstallment: z.coerce.bigint().positive(),
});

export type LoanInput = z.infer<typeof loanSchema>;