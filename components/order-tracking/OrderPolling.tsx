'use client';

import { useEffect, useCallback, useRef, useState } from 'react';

interface OrderPollingProps {
  orderNumber: string;
  currentStatus: string;
  suggestedInterval: number;
  onUpdate: (order: unknown) => void;
  onError?: (error: Error) => void;
}

export function useOrderPolling({
  orderNumber,
  currentStatus,
  suggestedInterval,
  onUpdate,
  onError,
}: OrderPollingProps) {
  const [isPolling, setIsPolling] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      const response = await fetch(`/api/orders/${orderNumber}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }
      const data = await response.json();
      setLastFetch(new Date());
      onUpdate(data.order);
    } catch (error) {
      onError?.(error as Error);
    }
  }, [orderNumber, onUpdate, onError]);

  useEffect(() => {
    // Don't poll for terminal states
    if (currentStatus === 'completed' || currentStatus === 'cancelled') {
      setIsPolling(false);
      return;
    }

    // Don't poll if interval is 0
    if (suggestedInterval === 0) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);

    // Set up polling interval
    intervalRef.current = setInterval(fetchOrder, suggestedInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentStatus, suggestedInterval, fetchOrder]);

  // Pause polling when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Resume polling and fetch immediately
        if (isPolling && suggestedInterval > 0) {
          fetchOrder();
          intervalRef.current = setInterval(fetchOrder, suggestedInterval);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPolling, suggestedInterval, fetchOrder]);

  const manualRefresh = useCallback(() => {
    fetchOrder();
  }, [fetchOrder]);

  return {
    isPolling,
    lastFetch,
    manualRefresh,
  };
}
