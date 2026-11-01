import apiClient from './apiClient.js';

export const transactionService = {
  /**
   * Fetch paginated and filtered transactions list
   */
  async getTransactions(params = {}) {
    const res = await apiClient.get('/transactions', { params });
    return {
      items: res.data || [],
      pagination: res.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 },
    };
  },

  /**
   * Fetch a single transaction with its anomaly result and alert status
   */
  async getTransactionById(id) {
    const res = await apiClient.get(`/transactions/${id}`);
    return res.data;
  },

  /**
   * Submit a new transaction for evaluation
   */
  async createTransaction(payload) {
    const res = await apiClient.post('/transactions', payload);
    return res.data;
  },
};

export default transactionService;

