import "@testing-library/jest-dom";

// matchMedia stub (common for responsive components)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// ResizeObserver stub
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error global assignment
global.ResizeObserver = ResizeObserver;
