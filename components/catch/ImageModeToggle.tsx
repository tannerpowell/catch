'use client';

import { useImageMode } from '@/lib/contexts/ImageModeContext';

interface ImageModeToggleProps {
  className?: string;
  showLabel?: boolean;
}

/**
 * Toggle switch for original vs AI-enhanced menu images.
 * Similar to a dark mode toggle.
 */
export default function ImageModeToggle({ className = '', showLabel = true }: ImageModeToggleProps) {
  const { imageMode, toggleImageMode, isHydrated } = useImageMode();

  if (!isHydrated) {
    // Prevent flash during hydration
    return null;
  }

  const isEnhanced = imageMode === 'enhanced';

  return (
    <>
      <style jsx>{`
        .toggle-container {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .toggle-label {
          font-family: var(--font-lux-body);
          font-size: 13px;
          font-weight: 500;
          color: var(--pc-text-soft, #5C5450);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        :global(.dark) .toggle-label {
          color: var(--pc-text-soft, #B8B0A8);
        }

        .toggle-switch {
          position: relative;
          width: 52px;
          height: 28px;
          background: var(--toggle-bg);
          border-radius: 14px;
          cursor: pointer;
          transition: background 0.25s ease;
          border: none;
          padding: 0;
        }

        .toggle-switch--original {
          --toggle-bg: #D1D5DB;
        }

        .toggle-switch--enhanced {
          --toggle-bg: #C4A35A;
        }

        :global(.dark) .toggle-switch--original {
          --toggle-bg: #4B5563;
        }

        :global(.dark) .toggle-switch--enhanced {
          --toggle-bg: #D4B896;
        }

        .toggle-knob {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 22px;
          height: 22px;
          background: white;
          border-radius: 50%;
          transition: transform 0.25s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }

        .toggle-switch--enhanced .toggle-knob {
          transform: translateX(24px);
        }

        .toggle-icon {
          font-size: 11px;
        }

        .toggle-status {
          font-family: var(--font-lux-body);
          font-size: 11px;
          font-weight: 600;
          color: var(--pc-text-muted, #8C8480);
          min-width: 60px;
        }

        :global(.dark) .toggle-status {
          color: var(--pc-text-muted, #6B6560);
        }

        .toggle-switch:focus-visible {
          outline: 2px solid var(--pc-gold, #C4A35A);
          outline-offset: 2px;
        }

        @media (prefers-reduced-motion: reduce) {
          .toggle-switch,
          .toggle-knob {
            transition: none;
          }
        }
      `}</style>

      <div className={`toggle-container ${className}`}>
        {showLabel && (
          <span className="toggle-label">Images</span>
        )}
        <button
          className={`toggle-switch toggle-switch--${imageMode}`}
          onClick={toggleImageMode}
          role="switch"
          aria-checked={isEnhanced}
          aria-label={`Switch to ${isEnhanced ? 'original' : 'enhanced'} images`}
          title={isEnhanced ? 'Showing AI-enhanced images' : 'Showing original images'}
        >
          <span className="toggle-knob">
            <span className="toggle-icon">
              {isEnhanced ? '✨' : '📷'}
            </span>
          </span>
        </button>
        <span className="toggle-status">
          {isEnhanced ? 'Enhanced' : 'Original'}
        </span>
      </div>
    </>
  );
}
