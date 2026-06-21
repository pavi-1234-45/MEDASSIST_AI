export const AUTH_LOGOUT_EVENT = 'auth:unauthorized';

/**
 * A robust fetch wrapper that automatically attaches the authorization token
 * and handles 401 Unauthorized errors by dispatching a global logout event.
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

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    console.warn('API Client: 401 Unauthorized detected. Dispatching logout event.');
    window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
  }

  return response;
};
