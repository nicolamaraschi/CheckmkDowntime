import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthProvider';

const useApi = (endpoint, method = 'GET', body = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token, refreshToken } = useAuth();

  const fetchData = useCallback(async () => {
    if (!token) {
      setError('No authentication token');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };

      if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body);
      }

      const baseUrl = window.API_BASE_URL || '/api';
      const url = `${baseUrl}${endpoint}`;
      
      const response = await fetch(url, options);
      
      if (response.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          options.headers.Authorization = `Bearer ${newToken}`;
          const retryResponse = await fetch(url, options);
          if (!retryResponse.ok) {
            throw new Error(`API error: ${retryResponse.status}`);
          }
          const result = await retryResponse.json();
          setData(result);
        } else {
          throw new Error('Token refresh failed');
        }
      } else if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      } else {
        const result = await response.json();
        setData(result);
      }
    } catch (err) {
      setError(err.message || 'Error in API call');
      console.error('API error:', err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, method, body, token, refreshToken]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, fetchData]);

  return { data, loading, error, refetch: fetchData };
};

export default useApi;
