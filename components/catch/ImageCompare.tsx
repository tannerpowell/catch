'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

interface ImageCompareProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  itemName?: string;
  aspectRatio?: '4/3' | '1/1';
  priority?: boolean;
}

export default function ImageCompare({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
  itemName,
  aspectRatio = '4/3',
  priority = false
}: ImageCompareProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleMove(e.clientX);
  }, [handleMove]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleMove(e.touches[0].clientX);
  }, [handleMove]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  return (
    <>
      <style jsx>{`
        .compare-container {
          --ic-cream: #FAF7F2;
          --ic-cream-dark: #F0EBE3;
          --ic-gold: #C4A35A;
          --ic-text: #2C2420;
          --ic-text-soft: #5C5450;

          position: relative;
          width: 100%;
          aspect-ratio: ${aspectRatio};
          border-radius: 12px;
          overflow: hidden;
          cursor: ew-resize;
          user-select: none;
          touch-action: none;
          box-shadow:
            0 4px 16px rgba(44, 36, 32, 0.08),
            0 12px 32px rgba(44, 36, 32, 0.04);
        }

        :global(.dark) .compare-container {
          --ic-cream: #1C1917;
          --ic-cream-dark: #171412;
          --ic-gold: #D4B896;
          --ic-text: #F5F2EF;
          --ic-text-soft: #B8B0A8;

          box-shadow:
            0 4px 16px rgba(0, 0, 0, 0.2),
            0 12px 32px rgba(0, 0, 0, 0.15);
        }

        .compare-image-wrapper {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .compare-image-after {
          clip-path: inset(0 0 0 ${sliderPosition}%);
        }

        .compare-slider {
          position: absolute;
          top: 0;
          bottom: 0;
          left: ${sliderPosition}%;
          width: 4px;
          background: white;
          transform: translateX(-50%);
          z-index: 10;
          box-shadow: 0 0 12px rgba(0, 0, 0, 0.3);
        }

        .compare-handle {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 48px;
          height: 48px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            0 2px 8px rgba(0, 0, 0, 0.15),
            0 4px 16px rgba(0, 0, 0, 0.1);
          transition: transform 0.15s ease;
        }

        .compare-container:active .compare-handle {
          transform: translate(-50%, -50%) scale(1.1);
        }

        .compare-arrows {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--ic-text);
          font-size: 18px;
          font-weight: 600;
        }

        .compare-label {
          position: absolute;
          bottom: 16px;
          padding: 8px 16px;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: white;
          font-family: var(--font-lux-body);
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border-radius: 20px;
          z-index: 5;
          pointer-events: none;
        }

        .compare-label-before {
          left: 16px;
        }

        .compare-label-after {
          right: 16px;
        }

        .compare-item-name {
          position: absolute;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: var(--ic-text);
          font-family: var(--font-lux-display);
          font-size: 16px;
          font-weight: 500;
          border-radius: 8px;
          z-index: 5;
          pointer-events: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        :global(.dark) .compare-item-name {
          background: rgba(28, 25, 23, 0.9);
        }

        @media (max-width: 600px) {
          .compare-handle {
            width: 40px;
            height: 40px;
          }

          .compare-label {
            font-size: 11px;
            padding: 6px 12px;
          }

          .compare-item-name {
            font-size: 14px;
            padding: 8px 14px;
          }
        }
      `}</style>

      <div
        ref={containerRef}
        className="compare-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      >
        {/* Before image (full) */}
        <div className="compare-image-wrapper">
          <Image
            src={beforeImage}
            alt={`${itemName || 'Item'} - before`}
            fill
            style={{ objectFit: 'cover' }}
            priority={priority}
          />
        </div>

        {/* After image (clipped) */}
        <div className="compare-image-wrapper compare-image-after">
          <Image
            src={afterImage}
            alt={`${itemName || 'Item'} - after`}
            fill
            style={{ objectFit: 'cover' }}
            priority={priority}
          />
        </div>

        {/* Slider */}
        <div className="compare-slider">
          <div className="compare-handle">
            <span className="compare-arrows">
              <span>&#8249;</span>
              <span>&#8250;</span>
            </span>
          </div>
        </div>

        {/* Labels */}
        <span className="compare-label compare-label-before">{beforeLabel}</span>
        <span className="compare-label compare-label-after">{afterLabel}</span>

        {/* Item name */}
        {itemName && <span className="compare-item-name">{itemName}</span>}
      </div>
    </>
  );
}
