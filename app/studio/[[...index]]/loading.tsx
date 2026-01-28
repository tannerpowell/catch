'use client';

import { useEffect, useState } from 'react';

/**
 * Loading state for Sanity Studio.
 * Shows a progress bar and loading message while the heavy Studio bundle loads.
 */
export default function StudioLoading() {
  const [progress, setProgress] = useState(0);

  // Simulate progress with asymptotic approach
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        // Slow down as we approach 90%
        const increment = Math.max(0.5, (90 - prev) / 15);
        return Math.min(90, prev + increment);
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#101112]">
      {/* Sanity-style dark background */}
      <div className="flex flex-col items-center gap-6 max-w-md w-full px-8">
        {/* Logo/Brand area */}
        <div className="flex items-center gap-3 text-white">
          <svg
            className="w-8 h-8 text-[#f03e2f]"
            viewBox="0 0 28 28"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M7.7 15.9c0 2.1 1.3 3.4 3.9 4.1l2.8.7c2.9.7 4.6 2.2 4.6 4.7 0 .4 0 .8-.1 1.2a6 6 0 0 0 3.4-5.5c0-2.2-1.2-3.6-4-4.3l-2.7-.7c-2.7-.6-4.5-1.8-4.5-4.5 0-.5 0-1 .2-1.4a6 6 0 0 0-3.6 5.7z" />
            <path d="M14.9 2.3c-3.3 0-5.3 1.7-6 4.2a5 5 0 0 1 2.8-.8c1.7 0 2.8.6 3.9 1.8l4.6 5.1 2.5-1.4a9 9 0 0 0-7.8-8.9zM13 25.7c3.3 0 5.4-1.7 6-4.2a5 5 0 0 1-2.8.8c-1.6 0-2.8-.6-3.8-1.8L7.8 15.4l-2.5 1.4a9 9 0 0 0 7.7 8.9z" />
          </svg>
          <span className="text-xl font-semibold tracking-tight">
            The Catch Studio
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full">
          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#f03e2f] transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Loading text */}
        <p className="text-white/60 text-sm">
          Loading Sanity Studio...
        </p>
      </div>
    </div>
  );
}
