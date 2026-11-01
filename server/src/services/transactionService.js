import transactionRepository from '../repositories/transactionRepository.js';

export class TransactionService {
  async getTransactionById(id) {
    const transaction = await transactionRepository.findById(id);
    if (!transaction) {
      const error = new Error(`Transaction with ID '${id}' not found`);
      error.statusCode = 404;
      throw error;
    }
    return transaction;
  }

  async getTransactions(options) {
    return transactionRepository.findPaginated(options);
  }

  async createTransaction(data) {
    // Check if reference already exists
    if (data.transaction_reference) {
      const existing = await transactionRepository.findByReference(data.transaction_reference);
      if (existing) {
        const error = new Error(`Transaction with reference '${data.transaction_reference}' already exists`);
        error.statusCode = 409;
        throw error;
      }
    } else {
      data.transaction_reference = `TXN-API-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    }

    return transactionRepository.create(data);
  }
}

export default new TransactionService();
