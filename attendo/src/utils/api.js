const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'attendoApiToken';

export const apiEnabled = Boolean(API_URL);

export function getApiToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearApiToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest(path, options = {}) {
  if (!apiEnabled) throw new Error('VITE_API_URL is not configured.');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getApiToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  let body = null;
  try { body = await response.json(); } catch { /* empty response */ }
  if (!response.ok) throw new Error(body?.error || `API request failed (${response.status})`);
  return body;
}

export function saveApiToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
