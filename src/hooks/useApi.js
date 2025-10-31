// src/hooks/useApi.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthProvider';

export const useApi = (endpoint, method = 'GET', body = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawResponse, setRawResponse] = useState(null); // Per debugging
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

      // Assicurati che l'endpoint abbia il prefisso /api
      const baseUrl = '/api'; 
      
      // Rimuovi la barra iniziale da endpoint se presente
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
      
      // Costruisci l'URL con il prefisso /api e l'endpoint
      const url = `${baseUrl}/${cleanEndpoint}`;
      
      console.log(`Fetching ${method} ${url}`);
      const timeStart = Date.now();
      
      const response = await fetch(url, options);
      setRawResponse(response); // Salva la risposta grezza per debug
      
      const timeElapsed = Date.now() - timeStart;
      console.log(`Response received in ${timeElapsed}ms`);
      
      if (response.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          options.headers.Authorization = `Bearer ${newToken}`;
          const retryResponse = await fetch(url, options);
          if (!retryResponse.ok) {
            throw new Error(`API error: ${retryResponse.status}`);
          }
          const result = await retryResponse.json();
          
          // Per endpoint specifici, esegui trasformazioni particolari
          if (cleanEndpoint === 'hosts') {
            console.log('Host data received:', result);
            // Se il backend restituisce { hosts: [...] }
            setData(result.hosts || result);
          } else {
            setData(result);
          }
        } else {
          throw new Error('Token refresh failed');
        }
      } else if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      } else {
        const result = await response.json();
        
        // Per endpoint specifici, esegui trasformazioni particolari
        if (cleanEndpoint === 'hosts') {
          console.log('Host data received:', result);
          // Se il backend restituisce { hosts: [...] }
          setData(result.hosts || result);
        } else {
          setData(result);
        }
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

  return { data, loading, error, rawResponse, refetch: fetchData };
};

export default useApi;