import { useCallback } from 'react';
import { useAuth } from '../auth/AuthProvider';

// This hook provides methods to interact with the API, automatically handling auth.
export const useApi = () => {
  const { token, refreshToken, logout } = useAuth();

  const request = useCallback(async (endpoint, options = {}) => {
    const baseUrl = window.API_BASE_URL || '/api';
    const url = `${baseUrl}${endpoint}`;

    if (!token) {
      // This shouldn't happen in a protected route, but as a safeguard:
      logout();
      throw new Error('No authentication token found.');
    }

    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    options.headers = { ...defaultHeaders, ...options.headers };

    let response = await fetch(url, options);

    if (response.status === 401) {
      try {
        const newToken = await refreshToken();
        if (newToken) {
          options.headers['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(url, options); // Retry the request
        } else {
          logout();
          throw new Error('Session expired. Please log in again.');
        }
      } catch (error) {
        logout();
        throw new Error('Session expired. Please log in again.');
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})); // Try to parse error, but don't fail if it's not JSON
      const errorMessage = errorData.detail || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    // For 204 No Content, response.json() will fail
    if (response.status === 204) {
        return null;
    }

    return response.json();

  }, [token, refreshToken, logout]);

  const get = useCallback((endpoint) => {
    return request(endpoint, { method: 'GET' });
  }, [request]);

  const post = useCallback((endpoint, body) => {
    return request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }, [request]);

  const del = useCallback((endpoint) => {
    return request(endpoint, { method: 'DELETE' });
  }, [request]);

  return { get, post, del, request };
};
