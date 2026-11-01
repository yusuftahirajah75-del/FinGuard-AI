import transactionService from '../services/transactionService.js';

export async function getTransactions(req, res, next) {
  try {
    const result = await transactionService.getTransactions(req.query);
    res.json({
      success: true,
      message: 'Transactions retrieved successfully',
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTransactionById(req, res, next) {
  try {
    const transaction = await transactionService.getTransactionById(req.params.id);
    res.json({
      success: true,
      message: 'Transaction details retrieved',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
}

export async function createTransaction(req, res, next) {
  try {
    const newTx = await transactionService.createTransaction(req.body);
    res.status(201).json({
      success: true,
      message: 'Transaction recorded successfully',
      data: newTx,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getTransactions,
  getTransactionById,
  createTransaction,
};
