import React, { createContext, useContext, useState, useCallback } from 'react';
// import { useAuth } from '../auth/AuthProvider'; // <-- RIMOSSO

const ApiCacheContext = createContext();

export const useApiCache = () => useContext(ApiCacheContext);

export const ApiCacheProvider = ({ children }) => {
  const [cache, setCache] = useState({});
  // const { user } = useAuth(); // <-- RIMOSSO
  // const [userId, setUserId] = useState(null); // <-- RIMOSSO

  // La cache ora è sicura per sessione perché 'useApi'
  // usa un token utente univoco per ogni chiamata.
  
  const setCacheData = useCallback((key, data) => {
    setCache(prevCache => ({
      ...prevCache,
      [key]: data,
    }));
  }, []);

  const clearCache = useCallback((key = null) => {
    if (key) {
      setCache(prevCache => {
        const newCache = { ...prevCache };
        delete newCache[key];
        return newCache;
      });
    } else {
      setCache({});
    }
  }, []);

  return (
    <ApiCacheContext.Provider value={{ cache, setCache: setCacheData, clearCache }}>
      {children}
    </ApiCacheContext.Provider>
  );
};