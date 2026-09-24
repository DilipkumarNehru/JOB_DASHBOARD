import { useEffect, useState, useCallback } from 'react';

export const useFetch = (fn, deps = [], options = {}) => {
  const { initialData = null, enabled = true } = options;
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    run().catch(() => {});
  }, [run, enabled]);

  const refetch = useCallback(async () => {
    const result = await run();
    return result;
  }, [run]);

  return { data, loading, error, refetch, setData };
};