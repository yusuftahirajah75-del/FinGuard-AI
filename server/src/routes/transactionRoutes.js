import { Router } from 'express';
import transactionController from '../controllers/transactionController.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  createTransactionSchema,
  listTransactionsQuerySchema,
} from '../validators/transactionValidators.js';

const router = Router();

router.get(
  '/',
  validateRequest({ query: listTransactionsQuerySchema }),
  transactionController.getTransactions
);

router.get('/:id', transactionController.getTransactionById);

router.post(
  '/',
  validateRequest({ body: createTransactionSchema }),
  transactionController.createTransaction
);

export default router;
