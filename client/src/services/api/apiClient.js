import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Response interceptor for consistent response data extraction and error normalization
apiClient.interceptors.response.use(
  (response) => {
    // Return extracted response data if matching standard FTADS envelope
    return response.data;
  },
  (error) => {
    let normalizedError = {
      message: 'An unexpected network error occurred.',
      status: error.response?.status || 0,
      errors: [],
      isNetworkError: !error.response,
    };

    if (error.response?.data) {
      const { message, errors } = error.response.data;
      normalizedError.message = message || error.message;
      normalizedError.errors = errors || [];
    } else if (error.code === 'ECONNABORTED') {
      normalizedError.message = 'The request timed out. Please check backend availability.';
    } else if (!error.response) {
      normalizedError.message = `Cannot connect to FTADS backend at ${baseURL}. Please verify the server is running.`;
    }

    return Promise.reject(normalizedError);
  }
);

export default apiClient;
