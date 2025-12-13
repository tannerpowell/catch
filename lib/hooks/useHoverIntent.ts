import { useState, useCallback, useRef, useEffect } from 'react';

interface UseHoverIntentOptions {
  /** Delay before showing (in ms). Default: 120 */
  delayIn?: number;
  /** Delay before hiding (in ms). Default: 200 */
  delayOut?: number;
}

interface UseHoverIntentReturn {
  /** Whether the hover intent is active */
  isHovered: boolean;
  /** Handlers to spread on the target element */
  handlers: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onFocus: () => void;
    onBlur: () => void;
  };
  /** Manually trigger hover state (for keyboard) */
  setHovered: (value: boolean) => void;
}

/**
 * Hook to handle hover intent with configurable delays.
 * Prevents flickering by requiring sustained hover before triggering.
 * Also supports keyboard focus for accessibility.
 *
 * @param options - Configuration for delay timings
 * @returns Hover state and handlers to spread on target element
 *
 * @example
 * ```tsx
 * const { isHovered, handlers } = useHoverIntent({ delayIn: 100, delayOut: 250 });
 *
 * return (
 *   <div {...handlers}>
 *     {isHovered && <Tooltip />}
 *   </div>
 * );
 * ```
 */
export function useHoverIntent(options: UseHoverIntentOptions = {}): UseHoverIntentReturn {
  const { delayIn = 120, delayOut = 200 } = options;

  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFocusedRef = useRef(false);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const onMouseEnter = useCallback(() => {
    clearPendingTimeout();
    timeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, delayIn);
  }, [delayIn, clearPendingTimeout]);

  const onMouseLeave = useCallback(() => {
    clearPendingTimeout();
    // Don't hide if still focused via keyboard
    if (isFocusedRef.current) return;

    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, delayOut);
  }, [delayOut, clearPendingTimeout]);

  const onFocus = useCallback(() => {
    isFocusedRef.current = true;
    clearPendingTimeout();
    setIsHovered(true);
  }, [clearPendingTimeout]);

  const onBlur = useCallback(() => {
    isFocusedRef.current = false;
    clearPendingTimeout();
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, delayOut);
  }, [delayOut, clearPendingTimeout]);

  const setHovered = useCallback((value: boolean) => {
    clearPendingTimeout();
    setIsHovered(value);
  }, [clearPendingTimeout]);

  return {
    isHovered,
    handlers: {
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur,
    },
    setHovered,
  };
}
