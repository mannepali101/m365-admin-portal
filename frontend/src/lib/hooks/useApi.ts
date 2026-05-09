'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ApiError } from '@/lib/api/client';

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isError: boolean;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: unknown[]) => Promise<T | null>;
  reset: () => void;
}

const INITIAL_STATE = {
  data: null,
  isLoading: false,
  error: null,
  isError: false,
};

/**
 * Generic hook for async API calls with loading/error/data lifecycle.
 *
 * @example
 * const { data, isLoading, error, execute } = useApi(dashboardApi.getSummary);
 * useEffect(() => { execute(); }, [execute]);
 */
export function useApi<T>(
  fn: (...args: unknown[]) => Promise<T>,
  options?: {
    /** Run immediately on mount */
    immediate?: boolean;
    /** Called on success */
    onSuccess?: (data: T) => void;
    /** Called on error */
    onError?: (error: string) => void;
  },
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({ ...INITIAL_STATE });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      if (!mountedRef.current) return null;
      setState({ data: null, isLoading: true, error: null, isError: false });

      try {
        const result = await fn(...args);
        if (mountedRef.current) {
          setState({ data: result, isLoading: false, error: null, isError: false });
          options?.onSuccess?.(result);
        }
        return result;
      } catch (err: unknown) {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
            ? err.message
            : 'An unexpected error occurred.';

        if (mountedRef.current) {
          setState({ data: null, isLoading: false, error: message, isError: true });
          options?.onError?.(message);
        }
        return null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fn],
  );

  useEffect(() => {
    if (options?.immediate) execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = useCallback(() => {
    setState({ ...INITIAL_STATE });
  }, []);

  return { ...state, execute, reset };
}
