import React, { createContext, useContext, useState, useCallback } from 'react';

const ApiCacheContext = createContext(null);

export const useApiCache = () => useContext(ApiCacheContext);

export const ApiCacheProvider = ({ children }) => {
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState({});

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
      
      // Usa il proxy direttamente
      const url = endpoint.startsWith('/') 
        ? `/api${endpoint}`
        : `/api/${endpoint}`;

      console.log(`Effettuo richiesta a: ${url}`);

      const fetchOptions = {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      // Aggiungi header di autorizzazione se fornito nelle opzioni
      if (options.token) {
        fetchOptions.headers['Authorization'] = `Bearer ${options.token}`;
      }

      if (options.body && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
        fetchOptions.body = JSON.stringify(options.body);
      }

      let response = await fetch(url, fetchOptions);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      let processedData = result;
      if (endpoint === 'hosts' && result.hosts) {
        processedData = result.hosts;
      } else if (endpoint === 'clients' && result.clients) {
        processedData = result.clients;
      }

      setCache(prev => ({ ...prev, [cacheKey]: processedData }));
      setLoading(prev => ({ ...prev, [cacheKey]: false }));

      return { data: processedData, loading: false, error: null, fromCache: false };
    } catch (error) {
      setLoading(prev => ({ ...prev, [cacheKey]: false }));
      return { data: null, loading: false, error: error.message, fromCache: false };
    }
  }, [cache, loading]);

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