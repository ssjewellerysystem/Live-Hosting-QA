/**
 * Centralized Environment & API Configuration for SSJewellery Frontend
 */

const getApiBaseUrl = () => {
  const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';
  const envApiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

  if (isProduction) {
    if (!envApiUrl) {
      const errorMsg = "[CRITICAL DEPLOYMENT FAILURE] VITE_API_BASE_URL is missing in production environment!";
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    if (envApiUrl.includes("localhost") || envApiUrl.includes("127.0.0.1")) {
      const errorMsg = "[CRITICAL DEPLOYMENT FAILURE] VITE_API_BASE_URL cannot point to localhost/127.0.0.1 in production mode!";
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    return envApiUrl.replace(/\/$/, '');
  }

  // Development mode: Allow explicit env variable if provided, fallback to localhost
  if (envApiUrl) {
    return envApiUrl.replace(/\/$/, '');
  }

  // Local development fallback
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5005/api';
  }

  return 'http://localhost:5005/api';
};

export const API_BASE_URL = getApiBaseUrl();
export const SERVER_BASE_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
export const IS_PRODUCTION = import.meta.env.PROD || import.meta.env.MODE === 'production';
