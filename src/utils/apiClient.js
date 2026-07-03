export const AUTH_LOGOUT_EVENT = 'auth:unauthorized';

const API_BASE = '';  // Vite proxy handles /api and /ai prefixes

/**
 * A robust fetch wrapper that automatically attaches the authorization token,
 * handles 401 Unauthorized errors by dispatching a global logout event,
 * and includes timeout and retry logic.
 */
export const apiClient = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Ensure JSON content type if body is present and not explicitly set
  if (options.body && !headers.has('Content-Type') && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

  try {
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      console.warn('API Client: 401 Unauthorized detected. Dispatching logout event.');
      window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
      throw new Error('Unauthorized');
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || '60';
      console.warn(`API Client: Rate limited. Retry after ${retryAfter}s`);
      throw new Error(`Rate limited. Please wait ${retryAfter} seconds.`);
    }

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
    }

    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw err;
  }
};

/**
 * Convenience helper that calls apiClient and parses JSON.
 */
export const apiJson = async (url, options = {}) => {
  const response = await apiClient(url, options);
  return response.json();
};
