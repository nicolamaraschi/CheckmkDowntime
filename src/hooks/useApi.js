import { useState, useEffect } from 'react';
import { useApiCache } from '../contexts/ApiCacheContext';

export const useApi = (endpoint, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false);
  const { fetchWithCache } = useApiCache();

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!endpoint) {
        setLoading(false);
        return;
      }

      const result = await fetchWithCache(endpoint, options);

      if (isMounted) {
        setData(result.data);
        setLoading(result.loading);
        setError(result.error);
        setFromCache(result.fromCache);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, fetchWithCache]);

  const refetch = async () => {
    setLoading(true);
    const result = await fetchWithCache(endpoint, { ...options, forceRefresh: true });
    setData(result.data);
    setLoading(result.loading);
    setError(result.error);
    setFromCache(result.fromCache);
  };

  const post = async (postEndpoint, body) => {
    const result = await fetchWithCache(postEndpoint, { method: 'POST', body });
    return result.data;
  };

  return { data, loading, error, fromCache, refetch, post };
};

export default useApi;
