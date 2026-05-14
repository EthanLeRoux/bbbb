import { useState, useEffect } from 'react';
import { SEARCH_DEBOUNCE_MS } from '../constants';

export function useDebounce(value) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(handler);
    };
  }, [value]);

  return debouncedValue;
}
