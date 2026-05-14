import { useCallback, useEffect, useState } from 'react';
import { getHealth } from '../api/health';

export default function useBackendHealth() {
  const [error, setError] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getHealth();
      setHealth(data);
    } catch (requestError) {
      setHealth(null);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    error,
    health,
    loading,
    refresh,
  };
}
