import React, { createContext, useContext, useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './AuthContext';

const ApiCacheContext = createContext(null);

export const useApiCache = () => useContext(ApiCacheContext);

export const ApiCacheProvider = ({ children, user, signOut }) => {
  return (
    <AuthProvider user={user} signOut={signOut}>
      <ApiCacheProviderInner>{children}</ApiCacheProviderInner>
    </AuthProvider>
  );
};

const ApiCacheProviderInner = ({ children }) => {
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState({});
  const { token, refreshToken } = useAuth();

  const fetchWithCache = useCallback(async (endpoint, options = {}) => {
    const cacheKey = `${endpoint}-${JSON.stringify(options)}`;
    
    if (cache[cacheKey] && !options.forceRefresh) {
      return { data: cache[cacheKey], loading: false, error: null, fromCache: true };
    }

    if (loading[cacheKey]) {
      return new Promise((resolve) => {
        const checkCache = setInterval(() => {
          if (cache[cacheKey]) {
            clearInterval(checkCache);
            resolve({ data: cache[cacheKey], loading: false, error: null, fromCache: true });
          }
        }, 100);
      });
    }

    setLoading(prev => ({ ...prev, [cacheKey]: true }));

    try {
      const method = options.method || 'GET';
      const baseUrl = '/api';
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
      const url = `${baseUrl}/${cleanEndpoint}`;

      const fetchOptions = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };

      if (options.body && (method === 'POST' || method === 'PUT')) {
        fetchOptions.body = JSON.stringify(options.body);
      }

      let response = await fetch(url, fetchOptions);

      if (response.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          fetchOptions.headers.Authorization = `Bearer ${newToken}`;
          response = await fetch(url, fetchOptions);
        }
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      let processedData = result;
      if (cleanEndpoint === 'hosts' && result.hosts) {
        processedData = result.hosts;
      } else if (cleanEndpoint === 'clients' && result.clients) {
        processedData = result.clients;
      }

      setCache(prev => ({ ...prev, [cacheKey]: processedData }));
      setLoading(prev => ({ ...prev, [cacheKey]: false }));

      return { data: processedData, loading: false, error: null, fromCache: false };
    } catch (error) {
      setLoading(prev => ({ ...prev, [cacheKey]: false }));
      return { data: null, loading: false, error: error.message, fromCache: false };
    }
  }, [cache, loading, token, refreshToken]);

  const clearCache = useCallback((endpoint) => {
    if (endpoint) {
      const keysToRemove = Object.keys(cache).filter(key => key.startsWith(endpoint));
      const newCache = { ...cache };
      keysToRemove.forEach(key => delete newCache[key]);
      setCache(newCache);
    } else {
      setCache({});
    }
  }, [cache]);

  const value = {
    fetchWithCache,
    clearCache,
    cache
  };

  return <ApiCacheContext.Provider value={value}>{children}</ApiCacheContext.Provider>;
};