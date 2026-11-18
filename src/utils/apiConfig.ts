// Centralized API Base URL configuration for Local, Network, and Cloud Production
export const getApiBaseUrl = (): string => {
  // 1. Explicit environment variable takes top priority (e.g. from Vercel / Render / .env)
  if (import.meta.env.VITE_API_URL) {
    const raw = String(import.meta.env.VITE_API_URL).trim().replace(/\/+$/, '');
    return raw.endsWith('/api') ? raw : `${raw}/api`;
  }

  // 2. In browser environments:
  if (typeof window !== 'undefined') {
    // When running inside Electron desktop app via file://, connect to local backend port 5000
    if (window.location.protocol === 'file:') {
      return 'http://localhost:5000/api';
    }

    // When hosted on Vercel without custom env variable, route to Render cloud backend
    if (window.location.hostname.includes('vercel.app')) {
      return 'https://ecoroute-ai-v4jd.onrender.com/api';
    }

    // For all local/container sessions, relative '/api' works via proxy or same-origin
    return '/api';
  }

  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();
