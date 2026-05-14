import { useCallback, useEffect, useState } from 'react';

export default function useAsyncData(loadData, dependencies = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await loadData();
      setData(result);
    } catch (requestError) {
      setData(null);
      setError(requestError.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, error, loading, refresh };
}
