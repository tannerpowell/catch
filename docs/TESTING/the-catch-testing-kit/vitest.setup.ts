import "@testing-library/jest-dom";

// Configurable matchMedia stub for testing responsive components
const matchMediaState = new Map<string, boolean>();

function createMatchMediaResult(query: string): MediaQueryList {
  const matches = matchMediaState.get(query) ?? false;
  return {
    matches,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  } as MediaQueryList;
}

/**
 * Set the match result for a specific media query.
 * @param query - The media query string (e.g., "(min-width: 768px)")
 * @param matches - Whether the query should match
 */
export function setMatchMedia(query: string, matches: boolean): void {
  matchMediaState.set(query, matches);
}

/**
 * Reset all media query match states to default (false).
 */
export function resetMatchMedia(): void {
  matchMediaState.clear();
}

// Attach helper APIs to window for global test access
declare global {
  interface Window {
    setMatchMedia: typeof setMatchMedia;
    resetMatchMedia: typeof resetMatchMedia;
  }
}
window.setMatchMedia = setMatchMedia;
window.resetMatchMedia = resetMatchMedia;

// Install the configurable matchMedia stub
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: createMatchMediaResult,
});

// ResizeObserver stub
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Augment global namespace for ResizeObserver
declare global {
  var ResizeObserver: typeof ResizeObserver;
}

global.ResizeObserver = ResizeObserver;
