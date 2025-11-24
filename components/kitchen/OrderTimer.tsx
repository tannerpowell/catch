'use client';

import { useEffect, useState } from 'react';

interface OrderTimerProps {
  createdAt: string;
}

/**
 * Displays a live-updating order timer that shows how long ago the provided creation timestamp occurred.
 *
 * The component updates its display every 30 seconds and applies visual urgency states based on elapsed time.
 *
 * @param createdAt - Creation timestamp string (e.g., ISO 8601) used as the reference time for the timer
 * @returns A JSX element containing a clock icon and the formatted elapsed time. Adds the CSS modifier `order-timer--warning` when elapsed time is between 15 and 29 minutes, and `order-timer--critical` when elapsed time is 30 minutes or more.
 */
export function OrderTimer({ createdAt }: OrderTimerProps) {
  const [elapsed, setElapsed] = useState('');
  const [isWarning, setIsWarning] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  useEffect(() => {
    const updateElapsed = () => {
      const created = new Date(createdAt);
      const now = new Date();
      const diffMs = now.getTime() - created.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      // Format time display
      if (diffMins < 1) {
        setElapsed('Just now');
      } else if (diffMins === 1) {
        setElapsed('1 min');
      } else if (diffMins < 60) {
        setElapsed(`${diffMins} min`);
      } else {
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        setElapsed(`${hours}h ${mins}m`);
      }

      // Set warning states based on time thresholds
      // Warning: 15+ minutes (yellow)
      // Critical: 30+ minutes (red)
      setIsWarning(diffMins >= 15 && diffMins < 30);
      setIsCritical(diffMins >= 30);
    };

    // Update immediately
    updateElapsed();

    // Update every 30 seconds
    const interval = setInterval(updateElapsed, 30000);

    return () => clearInterval(interval);
  }, [createdAt]);

  return (
    <div
      className={`order-timer ${isWarning ? 'order-timer--warning' : ''} ${
        isCritical ? 'order-timer--critical' : ''
      }`}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle
          cx="7"
          cy="7"
          r="6"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M7 3.5V7L9.5 9.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{elapsed}</span>
    </div>
  );
}