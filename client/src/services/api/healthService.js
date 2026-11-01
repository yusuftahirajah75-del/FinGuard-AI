import apiClient from './apiClient.js';

export const healthService = {
  /**
   * Check backend health, uptime, and database connection
   */
  async checkHealth() {
    const res = await apiClient.get('/health');
    return res.data;
  },
};

export default healthService;

