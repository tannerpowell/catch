'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type ImageMode = 'original' | 'enhanced';

interface ImageModeContextType {
  imageMode: ImageMode;
  toggleImageMode: () => void;
  setImageMode: (mode: ImageMode) => void;
  isHydrated: boolean;
  getImageUrl: (originalUrl: string | undefined, enhancedUrl?: string) => string | undefined;
}

const ImageModeContext = createContext<ImageModeContextType | undefined>(undefined);

const IMAGE_MODE_STORAGE_KEY = 'catch-image-mode';

/**
 * Provides image mode state (original vs enhanced) to descendant components.
 * Similar to dark mode - persists preference in localStorage.
 */
export function ImageModeProvider({ children }: { children: React.ReactNode }) {
  const [imageMode, setImageModeState] = useState<ImageMode>('enhanced');
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(IMAGE_MODE_STORAGE_KEY);
    if (stored === 'original' || stored === 'enhanced') {
      setImageModeState(stored);
    }
    setIsHydrated(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(IMAGE_MODE_STORAGE_KEY, imageMode);
    }
  }, [imageMode, isHydrated]);

  const toggleImageMode = useCallback(() => {
    setImageModeState(prev => prev === 'original' ? 'enhanced' : 'original');
  }, []);

  const setImageMode = useCallback((mode: ImageMode) => {
    setImageModeState(mode);
  }, []);

  /**
   * Get the appropriate image URL based on current mode.
   * Falls back gracefully if enhanced version isn't available.
   */
  const getImageUrl = useCallback((
    originalUrl: string | undefined,
    enhancedUrl?: string
  ): string | undefined => {
    if (!originalUrl) return undefined;

    if (imageMode === 'enhanced' && enhancedUrl) {
      return enhancedUrl;
    }

    return originalUrl;
  }, [imageMode]);

  return (
    <ImageModeContext.Provider value={{
      imageMode,
      toggleImageMode,
      setImageMode,
      isHydrated,
      getImageUrl
    }}>
      {children}
    </ImageModeContext.Provider>
  );
}

export function useImageMode() {
  const context = useContext(ImageModeContext);
  if (context === undefined) {
    throw new Error('useImageMode must be used within an ImageModeProvider');
  }
  return context;
}

/**
 * Hook for components that just need the image URL
 * Automatically selects based on current mode
 */
export function useMenuImage(originalUrl: string | undefined, enhancedUrl?: string) {
  const { getImageUrl, imageMode, isHydrated } = useImageMode();
  return {
    imageUrl: getImageUrl(originalUrl, enhancedUrl),
    imageMode,
    isHydrated
  };
}
