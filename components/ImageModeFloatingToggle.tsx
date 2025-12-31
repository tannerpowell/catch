'use client';

import { useImageMode } from '@/lib/contexts/ImageModeContext';
import { useEffect, useState } from 'react';
import styles from './ImageModeFloatingToggle.module.css';

/**
 * Floating toggle for image mode (original vs enhanced).
 * Positioned above the theme toggle in bottom-right corner.
 */
export default function ImageModeFloatingToggle() {
  const [mounted, setMounted] = useState(false);
  const { imageMode, toggleImageMode } = useImageMode();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className={styles.toggle} aria-label="Toggle image mode">
        <span className={styles.icon}>✨</span>
      </button>
    );
  }

  const isEnhanced = imageMode === 'enhanced';

  return (
    <button
      className={`${styles.toggle} ${isEnhanced ? styles.enhanced : styles.original}`}
      onClick={toggleImageMode}
      aria-label={`Switch to ${isEnhanced ? 'original' : 'enhanced'} images`}
      title={isEnhanced ? 'AI-enhanced images (click for original)' : 'Original images (click for AI-enhanced)'}
    >
      <span className={styles.icon}>
        {isEnhanced ? '✨' : '📷'}
      </span>
    </button>
  );
}
