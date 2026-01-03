"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Navigation progress bar that provides visual feedback on slow route changes.
 *
 * Only appears if navigation takes longer than 150ms - fast navigations feel
 * instant without a flashing progress bar. Uses asymptotic approach to 90%
 * while loading, then completes on route change.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const [progress, setProgress] = useState(0);

  // Reset on route change complete
  useEffect(() => {
    setIsNavigating(false);
    setShowBar(false);
    setProgress(0);
  }, [pathname, searchParams]);

  // Listen for link clicks to start tracking navigation
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (
        anchor?.href &&
        anchor.href.startsWith(window.location.origin) &&
        !anchor.hasAttribute("download") &&
        !anchor.target && // Skip links that open in new tabs
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey
      ) {
        const url = new URL(anchor.href);
        // Only trigger for actual navigation (different path)
        if (url.pathname !== pathname) {
          setIsNavigating(true);
        }
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  // Only show progress bar if navigation takes longer than 150ms
  useEffect(() => {
    if (!isNavigating) return;

    const showTimer = setTimeout(() => {
      setShowBar(true);
      setProgress(20);
    }, 150);

    return () => clearTimeout(showTimer);
  }, [isNavigating]);

  // Animate progress with asymptotic approach to 90%
  useEffect(() => {
    if (!showBar) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        // Slow down as we approach 90%
        const increment = Math.max(1, (90 - prev) / 10);
        return Math.min(90, prev + increment);
      });
    }, 100);

    return () => clearInterval(timer);
  }, [showBar]);

  if (!showBar || progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-100 h-1 pointer-events-none"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page loading"
    >
      <div
        className="h-full transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          background: "linear-gradient(90deg, #2B7A9B, #2B7A9B, rgba(43, 122, 155, 0.5))",
          boxShadow: "0 0 10px #2B7A9B, 0 0 5px #2B7A9B",
        }}
      />
    </div>
  );
}
