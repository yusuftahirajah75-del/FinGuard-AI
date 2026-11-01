import { z } from 'zod';

export const createTransactionSchema = z.object({
  transaction_reference: z.string().max(64).optional(),
  customer_reference: z.string().min(1, 'customer_reference is required').max(64),
  source_account_reference: z.string().min(1, 'source_account_reference is required').max(64),
  beneficiary_reference: z.string().min(1, 'beneficiary_reference is required').max(64),
  amount: z.coerce.number().positive('amount must be a positive number'),
  currency: z.string().length(3).default('USD'),
  transaction_type: z.enum(['TRANSFER', 'PAYMENT', 'WITHDRAWAL', 'DEPOSIT']),
  transaction_channel: z.enum(['ONLINE', 'MOBILE', 'ATM', 'POS', 'BRANCH']),
  transaction_location: z.string().max(64).optional(),
  transaction_timestamp: z.string().datetime({ offset: true }).optional(),
  transaction_status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'FLAGGED']).default('COMPLETED'),
  synthetic_ground_truth_label: z.enum(['NORMAL', 'SUSPICIOUS']).default('NORMAL'),
});

export const listTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  channel: z.enum(['ONLINE', 'MOBILE', 'ATM', 'POS', 'BRANCH']).optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'FLAGGED']).optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  minAmount: z.coerce.number().positive().optional(),
  maxAmount: z.coerce.number().positive().optional(),
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
  sortBy: z.enum(['timestamp', 'transaction_timestamp', 'amount', 'reference', 'customer', 'score', 'anomaly_score']).default('timestamp'),
  sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).default('DESC'),
});

