import axios from 'axios';
import { refreshToken, clearAuthToken } from './auth';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor to add auth token
axios.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const storedRefreshToken = sessionStorage.getItem('refreshToken');
      
      if (!storedRefreshToken) {
        // No refresh token, redirect to login
        processQueue(error);
        isRefreshing = false;
        clearAuthToken();
        sessionStorage.clear();
        window.location.href = '/auth';
        return Promise.reject(error);
      }

      try {
        const tokenResponse = await refreshToken(storedRefreshToken);
        
        if (tokenResponse.success) {
          const newToken = tokenResponse.access_token;
          
          // Update stored tokens
          sessionStorage.setItem('authToken', newToken);
          if (tokenResponse.refresh_token) {
            sessionStorage.setItem('refreshToken', tokenResponse.refresh_token);
          }
          
          // Update axios default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          
          // Process queued requests
          processQueue(null, newToken);
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axios(originalRequest);
        } else {
          // Refresh failed, redirect to login
          throw new Error('Token refresh failed');
        }
      } catch (refreshError) {
        // Refresh failed, clear everything and redirect to login
        processQueue(refreshError);
        clearAuthToken();
        sessionStorage.clear();
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For other errors or if retry already attempted, just reject
    return Promise.reject(error);
  }
);

// Enhanced API methods with better error handling
export const apiCall = async (config) => {
  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    // Enhanced error handling
    if (error.response) {
      // Server responded with error status
      const errorMessage = error.response.data?.error || 
                          error.response.data?.message || 
                          `API Error: ${error.response.status}`;
      throw new Error(errorMessage);
    } else if (error.request) {
      // Request made but no response
      throw new Error('Network error: Unable to reach server');
    } else {
      // Something else happened
      throw new Error(`Request error: ${error.message}`);
    }
  }
};

// Convenience methods for common HTTP operations
export const get = (url, config = {}) => 
  apiCall({ method: 'GET', url, ...config });

export const post = (url, data, config = {}) => 
  apiCall({ method: 'POST', url, data, ...config });

export const put = (url, data, config = {}) => 
  apiCall({ method: 'PUT', url, data, ...config });

export const del = (url, config = {}) => 
  apiCall({ method: 'DELETE', url, ...config });

export const patch = (url, data, config = {}) => 
  apiCall({ method: 'PATCH', url, data, ...config });

// Health check method to verify API connectivity
export const healthCheck = async () => {
  try {
    const response = await get('/api/health');
    return { success: true, data: response };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Method to verify authentication with current token
export const verifyAuth = async () => {
  try {
    const response = await get('/api/auth/verify');
    return { success: true, data: response };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default {
  apiCall,
  get,
  post,
  put,
  del,
  patch,
  healthCheck,
  verifyAuth
};