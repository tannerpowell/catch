'use client';

import React, { useCallback, useRef } from 'react';
import type { MenuCategory } from '@/lib/types';
import { HIDDEN_CATEGORY_SLUGS } from '@/lib/constants/categories';

interface CategoryNavProps {
  categories: MenuCategory[];
  selectedCategory: string;
  onCategoryChange: (slug: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

/**
 * Left pane category navigation with search.
 * Compact, high-density list with small type.
 * Sticky positioning for persistent access.
 */
export function CategoryNav({
  categories,
  selectedCategory,
  onCategoryChange,
  searchTerm,
  onSearchChange,
}: CategoryNavProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearchClear = useCallback(() => {
    onSearchChange('');
    searchInputRef.current?.focus();
  }, [onSearchChange]);

  // Filter out deprecated/inactive categories (defined in lib/constants/categories.ts)
  const visibleCategories = categories.filter(
    cat => !HIDDEN_CATEGORY_SLUGS.includes(cat.slug)
  );

  return (
    <nav className="menu3-category-nav" aria-label="Menu categories">
      {/* Search */}
      <div className="menu3-search-container">
        <div className="menu3-search-wrapper">
          <svg
            className="menu3-search-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={searchInputRef}
            type="search"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="menu3-search-input menu3-type-search"
            aria-label="Search menu items"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleSearchClear}
              className="menu3-search-clear"
              aria-label="Clear search"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Category list - using radiogroup/radio for mutually exclusive selection */}
      <div className="menu3-category-list" role="radiogroup" aria-label="Filter by category">
        {/* All Menu Items option */}
        <button
          type="button"
          className={`menu3-category-item menu3-type-category ${selectedCategory === '' ? 'is-active' : ''}`}
          onClick={() => onCategoryChange('')}
          role="radio"
          aria-checked={selectedCategory === ''}
        >
          <span className="menu3-category-item-text">All Menu Items</span>
        </button>

        {visibleCategories.map(category => (
          <button
            key={category.slug}
            type="button"
            className={`menu3-category-item menu3-type-category ${selectedCategory === category.slug ? 'is-active' : ''}`}
            onClick={() => onCategoryChange(category.slug)}
            role="radio"
            aria-checked={selectedCategory === category.slug}
          >
            <svg className="menu3-category-flourish" width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 4V20M4 12H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="menu3-category-item-text">{category.title}</span>
          </button>
        ))}
      </div>

      <style jsx>{`
        .menu3-category-nav {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 20px 0;
        }

        /* Search */
        .menu3-search-container {
          padding: 0 16px 16px;
          border-bottom: 1px solid var(--menu3-border, rgba(0, 0, 0, 0.06));
        }

        .menu3-search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .menu3-search-icon {
          position: absolute;
          left: 10px;
          color: var(--menu3-text-muted, #888);
          pointer-events: none;
        }

        .menu3-search-input {
          width: 100%;
          padding: 9px 32px 9px 34px;
          background: var(--menu3-search-bg, rgba(0, 0, 0, 0.03));
          border: 1px solid var(--menu3-border, rgba(0, 0, 0, 0.08));
          border-radius: 6px;
          color: var(--menu3-text, #1a1a1a);
          transition: all 0.2s ease;
        }

        .menu3-search-input::placeholder {
          color: var(--menu3-text-muted, #888);
        }

        .menu3-search-input:focus {
          outline: none;
          border-color: var(--menu3-accent, #2B7A9B);
          background: white;
          box-shadow: 0 0 0 3px rgba(43, 122, 155, 0.1);
        }

        .menu3-search-clear {
          position: absolute;
          right: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          padding: 0;
          background: var(--menu3-text-muted, #888);
          border: none;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .menu3-search-clear:hover {
          background: var(--menu3-text, #333);
        }

        /* Category list */
        .menu3-category-list {
          list-style: none;
          margin: 0;
          padding: 0;
          flex: 1;
          overflow-y: auto;
        }

        .menu3-category-item {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          padding: 10px 16px;
          margin: 0 8px;
          width: calc(100% - 16px);
          background: transparent;
          border: none;
          border-radius: 6px;
          color: var(--menu3-text-muted, #7c6a63);
          cursor: pointer;
          text-align: left;
          font-size: 14px;
          transition: all 0.25s ease;
        }

        .menu3-category-item:hover {
          background: var(--menu3-hover-bg, rgba(255, 255, 255, 0.6));
          color: var(--menu3-text, #322723);
        }

        .menu3-category-item.is-active {
          background: var(--menu3-active-bg, white);
          color: var(--menu3-active-text, #322723);
          font-weight: 500;
          box-shadow: var(--menu3-active-shadow, 0 1px 4px rgba(50, 39, 35, 0.08));
        }

        .menu3-category-item:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px var(--menu3-accent, #2B7A9B);
        }

        .menu3-category-item-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Flourish */
        .menu3-category-flourish {
          flex-shrink: 0;
          margin-right: 8px;
          color: var(--menu3-accent, #2B7A9B);
          opacity: 0.4;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .menu3-category-item:hover .menu3-category-flourish {
          opacity: 0.7;
        }

        .menu3-category-item.is-active .menu3-category-flourish {
          opacity: 1;
          transform: scale(1.1);
        }

        /* Mobile: horizontal scroll chips */
        @media (max-width: 1023px) {
          .menu3-category-nav {
            flex-direction: row;
            height: auto;
            padding: 0;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }

          .menu3-category-nav::-webkit-scrollbar {
            display: none;
          }

          .menu3-search-container {
            display: none;
          }

          .menu3-category-label {
            display: none;
          }

          .menu3-category-list {
            display: flex;
            gap: 4px;
            padding: 4px;
            margin: 8px 12px;
            background: rgba(50, 39, 35, 0.03);
            border-radius: 20px;
            border: 1px solid rgba(50, 39, 35, 0.05);
            overflow: visible;
          }

          .menu3-category-item {
            padding: 6px 14px;
            margin: 0;
            width: auto;
            border: none;
            border-radius: 16px;
            font-size: 13px;
            white-space: nowrap;
            color: var(--menu3-text-muted, #7c6a63);
          }

          .menu3-category-item:hover {
            background: rgba(255, 255, 255, 0.6);
          }

          .menu3-category-item.is-active {
            background: var(--menu3-accent, #2B7A9B);
            color: white;
            box-shadow: 0 2px 6px rgba(43, 122, 155, 0.2);
          }

          .menu3-category-flourish {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
}
