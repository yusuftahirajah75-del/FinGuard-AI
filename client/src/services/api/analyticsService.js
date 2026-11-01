import apiClient from './apiClient.js';

export const analyticsService = {
  /**
   * Fetch system summary analytics
   */
  async getSummary() {
    const res = await apiClient.get('/reports/summary');
    return res.data;
  },

  /**
   * Fetch academic confusion matrix and evaluation metrics
   */
  async getConfusionMatrix(threshold = 60.0) {
    const res = await apiClient.get('/reports/confusion-matrix', {
      params: { threshold },
    });
    return res.data;
  },

  /**
   * Download sanitized CSV report directly as a Blob
   */
  async downloadCsvExport(type = 'transactions', limit = 1000) {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const downloadUrl = `${baseURL}/reports/export?type=${type}&limit=${limit}`;

    // Trigger browser native download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `ftads-${type}-export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

export default analyticsService;

