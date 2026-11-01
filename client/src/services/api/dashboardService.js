import apiClient from './apiClient.js';

export const dashboardService = {
  /**
   * Fetch aggregate KPI metrics and charts data
   */
  async getDashboardSummary() {
    const res = await apiClient.get('/dashboard/summary');
    return res.data;
  },
};

export default dashboardService;

