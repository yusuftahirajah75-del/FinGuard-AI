import apiClient from './apiClient.js';

export const detectionService = {
  /**
   * Trigger explainable statistical analysis on a specific transaction
   */
  async analyzeTransaction(transactionId) {
    const res = await apiClient.post(`/detection/analyze/${transactionId}`);
    return res.data;
  },

  /**
   * Run batch anomaly detection over transactions
   */
  async analyzeBatch(payload = { limit: 50, onlyUnanalyzed: true }) {
    const res = await apiClient.post('/detection/analyze-batch', payload);
    return res.data;
  },

  /**
   * Retrieve cached detection result for a transaction
   */
  async getResultsByTransactionId(transactionId) {
    const res = await apiClient.get(`/detection/results/${transactionId}`);
    return res.data;
  },

  /**
   * Retrieve detection methodology documentation
   */
  async getMethodology() {
    const res = await apiClient.get('/detection/methodology');
    return res.data;
  },

  /**
   * Retrieve active detector weights and threshold settings
   */
  async getSettings() {
    const res = await apiClient.get('/detection/settings');
    return res.data;
  },

  /**
   * Update detector weights or alert threshold
   */
  async updateSettings(payload) {
    const res = await apiClient.patch('/detection/settings', payload);
    return res.data;
  },
};

export default detectionService;
