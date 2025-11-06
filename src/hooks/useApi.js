import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { fetchAuthSession, signOut } from '@aws-amplify/auth';
import { useApiCache } from '../contexts/ApiCacheContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// 1. Spostato l'oggetto vuoto fuori per usarlo come riferimento stabile
const defaultOptions = {};

export const useApi = (endpoint, options = defaultOptions, cacheKey = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { cache, setCache } = useApiCache();

  // 'fetchData' è stabile e dipende solo da cose che non cambiano
  const fetchData = useCallback(async (requestOptions, forceRefresh = false) => {
    setLoading(true);
    setError(null);

    const fullUrl = `${API_BASE_URL}${endpoint}`;

    if (!forceRefresh && cacheKey && cache[cacheKey]) {
      setData(cache[cacheKey]);
      setLoading(false);
      return;
    }

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      if (!token) {
        throw new Error('Utente non autenticato o token non trovato.');
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...requestOptions.headers,
      };

      const config = {
        method: requestOptions.method || 'GET',
        url: fullUrl,
        data: requestOptions.body,
        headers: headers,
        timeout: 30000,
      };

      const response = await axios(config);
      setData(response.data);

      if (cacheKey) {
        setCache(cacheKey, response.data);
      }

    } catch (err) {
      let errorMessage = 'Errore API: ' + (err.message || 'Errore sconosciuto');
      
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        errorMessage = 'Sessione scaduta. Effettua nuovamente il login.';
        try {
          await signOut();
          window.location.href = '/';
        } catch (signOutError) {
          console.error("Errore durante il logout automatico:", signOutError);
        }
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = "Errore di rete: Impossibile contattare l'API.";
      }
      
      setError(new Error(errorMessage));
      console.error(`Errore API (${fullUrl}):`, err);

    } finally {
      setLoading(false);
    }
  }, [endpoint, cacheKey, cache, setCache]); // Dipendenze stabili

  // 2. CORRETTO: Questo useEffect ora si esegue solo una volta (o al cambio di endpoint)
  // Usiamo 'options.manual' per decidere se eseguirlo
  useEffect(() => {
    if (options.manual) {
      setLoading(false);
      return;
    }
    fetchData(options);
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, options.manual]); // 'options' rimosso per prevenire loop

  const refresh = () => fetchData(options, true);
  const postData = (body) => fetchData({ ...options, method: 'POST', body });
  const putData = (body) => fetchData({ ...options, method: 'PUT', body });
  const deleteData = () => fetchData({ ...options, method: 'DELETE' });

  return { data, loading, error, refresh, postData, putData, deleteData };
};