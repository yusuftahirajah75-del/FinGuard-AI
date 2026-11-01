import apiClient from './apiClient.js';

export const alertService = {
  /**
   * Fetch paginated and filtered compliance alerts
   */
  async getAlerts(params = {}) {
    const res = await apiClient.get('/alerts', { params });
    return {
      items: res.data || [],
      pagination: res.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 },
    };
  },

  /**
   * Fetch single alert with transaction context and audit logs
   */
  async getAlertById(id) {
    const res = await apiClient.get(`/alerts/${id}`);
    return res.data;
  },

  /**
   * Update alert triage status, analyst assignment, or notes
   */
  async updateAlert(id, payload) {
    const res = await apiClient.patch(`/alerts/${id}`, payload);
    return res.data;
  },
};

export default alertService;

