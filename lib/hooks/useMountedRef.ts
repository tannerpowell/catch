import { useEffect, useRef, type RefObject } from 'react';

/**
 * Track if component is mounted to prevent state updates after unmount.
 * Returns a ref that will be `true` while mounted and `false` after unmount.
 */
export function useMountedRef(): RefObject<boolean> {
  const mounted = useRef(true);
  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);
  return mounted;
}
