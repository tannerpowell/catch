'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className={styles.toggle} aria-label="Toggle theme">
        <span className={styles.icon}>◐</span>
      </button>
    );
  }

  return (
    <button
      className={styles.toggle}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
    >
      <span className={styles.icon}>
        {theme === 'dark' ? '☀' : '☾'}
      </span>
    </button>
  );
}
