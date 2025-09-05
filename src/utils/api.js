// Simple API helper to support both web and native (Capacitor) runtimes
// - On web (Vite dev or static hosting), default to "/api" so Vite proxy or same-origin backend can work
// - On native (Capacitor), use VITE_API_BASE if provided; otherwise fallback to a placeholder

const isNative = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform;

// You can set VITE_API_BASE in an .env file for native builds, e.g. https://staging.example.com/api
const NATIVE_DEFAULT = 'https://example.com/api';

const API_BASE = isNative
  ? (import.meta?.env?.VITE_API_BASE || NATIVE_DEFAULT)
  : '/api';

const normalize = (path) => {
  if (!path) return '';
  return path.startsWith('/') ? path : `/${path}`;
};

export const apiFetch = (path, options) => {
  const url = `${API_BASE}${normalize(path)}`;
  return fetch(url, options);
};

export const API_BASE_URL = API_BASE;
