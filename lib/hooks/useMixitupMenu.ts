import { useRef, useEffect, useCallback, useState } from 'react';
import type { Mixer } from 'mixitup';

interface UseMixitupMenuOptions {
  /** Initial location filter slug */
  initialLocation?: string;
  /** Initial category filter slug (empty = all) */
  initialCategory?: string;
  /** Animation duration in ms. Default: 250 */
  animationDuration?: number;
}

interface UseMixitupMenuReturn {
  /** Ref to attach to the container element */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Whether MixItUp is initialized and ready */
  isReady: boolean;
  /** Apply a filter. Uses compound selectors for location + category */
  applyFilter: (locationSlug: string, categorySlug?: string) => void;
  /** Apply search filter (client-side, composes with MixItUp) */
  applySearch: (searchTerm: string) => void;
  /** Current search term */
  searchTerm: string;
  /** Force a re-layout (after DOM changes) */
  relayout: () => void;
}

/**
 * Hook to initialize and control MixItUp filtering.
 *
 * MixItUp is DOM-imperative, so this hook manages initialization
 * and provides a stable API for filtering. Items should have classes
 * like `.location-{slug}` and `.category-{slug}` for filtering.
 *
 * @param options - Configuration for initial state and animation
 * @returns Ref and methods to control filtering
 *
 * @example
 * ```tsx
 * const { containerRef, isReady, applyFilter, applySearch } = useMixitupMenu({
 *   initialLocation: 'denton',
 *   initialCategory: 'popular',
 * });
 *
 * // In JSX
 * <div ref={containerRef}>
 *   {items.map(item => (
 *     <div key={item.id} className={`mix-item location-${item.locationSlug} category-${item.categorySlug}`}>
 *       ...
 *     </div>
 *   ))}
 * </div>
 * ```
 */
export function useMixitupMenu(options: UseMixitupMenuOptions = {}): UseMixitupMenuReturn {
  const {
    initialLocation = '',
    initialCategory = '',
    animationDuration = 250,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const mixerRef = useRef<Mixer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Store current filter state for search composition
  const currentFilterRef = useRef({ location: initialLocation, category: initialCategory });

  // Initialize MixItUp on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    let mounted = true;

    // Dynamic import to avoid SSR issues
    import('mixitup').then((mixitup) => {
      if (!mounted || !containerRef.current || mixerRef.current) return;

      // Build initial filter string
      let initialFilter = 'all';
      if (initialLocation) {
        initialFilter = `.location-${initialLocation}`;
        if (initialCategory) {
          initialFilter += `.category-${initialCategory}`;
        }
      }

      mixerRef.current = mixitup.default(containerRef.current, {
        selectors: {
          target: '.mix-item',
        },
        animation: {
          duration: animationDuration,
          effects: 'fade translateY(-8px)',
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        },
        load: {
          filter: initialFilter,
        },
      });

      setIsReady(true);
    });

    return () => {
      mounted = false;
      if (mixerRef.current) {
        mixerRef.current.destroy();
        mixerRef.current = null;
        setIsReady(false);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Apply filter method
  const applyFilter = useCallback((locationSlug: string, categorySlug?: string) => {
    if (!mixerRef.current) return;

    currentFilterRef.current = { location: locationSlug, category: categorySlug || '' };

    // Build filter string
    let filterString: string;

    if (!locationSlug) {
      filterString = 'none';
    } else if (categorySlug) {
      filterString = `.location-${locationSlug}.category-${categorySlug}`;
    } else {
      filterString = `.location-${locationSlug}`;
    }

    mixerRef.current.filter(filterString);

    // Re-apply search if active
    if (searchTerm) {
      // Search is handled via CSS, not MixItUp
    }
  }, [searchTerm]);

  // Apply search (uses CSS visibility, composes with MixItUp)
  const applySearch = useCallback((term: string) => {
    setSearchTerm(term);

    if (!containerRef.current) return;

    const normalizedTerm = term.toLowerCase().trim();
    const items = containerRef.current.querySelectorAll('.mix-item');

    items.forEach((item) => {
      if (!normalizedTerm) {
        // Clear search filter
        item.classList.remove('search-hidden');
        return;
      }

      const name = item.getAttribute('data-name')?.toLowerCase() || '';
      const description = item.getAttribute('data-description')?.toLowerCase() || '';

      if (name.includes(normalizedTerm) || description.includes(normalizedTerm)) {
        item.classList.remove('search-hidden');
      } else {
        item.classList.add('search-hidden');
      }
    });
  }, []);

  // Force relayout - re-apply current filter to refresh MixItUp state
  const relayout = useCallback(() => {
    if (mixerRef.current) {
      const { location, category } = currentFilterRef.current;
      let filterString = location ? `.location-${location}` : 'all';
      if (location && category) {
        filterString += `.category-${category}`;
      }
      mixerRef.current.filter(filterString);
    }
  }, []);

  return {
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
    isReady,
    applyFilter,
    applySearch,
    searchTerm,
    relayout,
  };
}
