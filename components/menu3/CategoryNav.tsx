'use client';

import React, { useCallback, useRef } from 'react';
import type { MenuCategory } from '@/lib/types';

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

  // Filter out deprecated/inactive categories that still exist in the CMS
  // These categories are kept for historical data but should not appear in navigation
  // TODO: Consider adding a 'hidden' field to the category schema instead
  const HIDDEN_CATEGORY_SLUGS = ['blazing-hen', 'cajun-creation'];
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
            placeholder="Search menu..."
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

      {/* Category label */}
      <div className="menu3-category-label menu3-type-section">
        Categories
      </div>

      {/* Category list - using menu/menuitemradio for interactive button group */}
      <ul className="menu3-category-list" role="menu" aria-label="Filter by category">
        {/* All Categories option */}
        <li role="none">
          <button
            type="button"
            className={`menu3-category-item menu3-type-category ${selectedCategory === '' ? 'is-active' : ''}`}
            onClick={() => onCategoryChange('')}
            role="menuitemradio"
            aria-checked={selectedCategory === ''}
          >
            <span className="menu3-category-item-text">All Categories</span>
          </button>
        </li>

        {visibleCategories.map(category => (
          <li key={category.slug} role="none">
            <button
              type="button"
              className={`menu3-category-item menu3-type-category ${selectedCategory === category.slug ? 'is-active' : ''}`}
              onClick={() => onCategoryChange(category.slug)}
              role="menuitemradio"
              aria-checked={selectedCategory === category.slug}
            >
              <span className="menu3-category-item-text">{category.title}</span>
            </button>
          </li>
        ))}
      </ul>

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
          border-color: var(--menu3-accent, #333);
          background: white;
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.04);
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

        /* Category label */
        .menu3-category-label {
          padding: 16px 16px 8px;
          color: var(--menu3-text-muted, #888);
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
          padding: 10px 16px 10px 20px;
          background: transparent;
          border: none;
          border-left: 2px solid transparent;
          border-bottom: 1px solid var(--menu3-category-border, rgba(0, 0, 0, 0.1));
          color: var(--menu3-text-secondary, #555);
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
        }

        .menu3-category-list li:last-child .menu3-category-item {
          border-bottom: none;
        }

        .menu3-category-item::before {
          content: '';
          position: absolute;
          left: 8px;
          width: 0;
          height: 0;
          border-top: 4px solid transparent;
          border-bottom: 4px solid transparent;
          border-left: 5px solid var(--menu3-accent, #333);
          opacity: 0;
          transition: opacity 0.15s ease, transform 0.15s ease;
          transform: translateX(-4px);
        }

        .menu3-category-item:hover {
          background: #fff;
          color: var(--menu3-text, #1a1a1a);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        }

        .menu3-category-item:hover::before {
          opacity: 0.6;
          transform: translateX(0);
        }

        .menu3-category-item.is-active {
          background: #fff;
          border-left-color: var(--menu3-accent, #1a1a1a);
          border-left-width: 3px;
          color: var(--menu3-text, #1a1a1a);
          font-weight: 600;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
        }

        .menu3-category-item.is-active::before {
          opacity: 1;
          transform: translateX(0);
        }

        .menu3-category-item:focus-visible {
          outline: none;
          background: var(--menu3-hover-bg, rgba(0, 0, 0, 0.02));
          box-shadow: inset 0 0 0 2px var(--menu3-accent, #333);
        }

        .menu3-category-item-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
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
            gap: 6px;
            padding: 12px 16px;
            overflow: visible;
          }

          .menu3-category-item {
            padding: 6px 14px;
            border: 1px solid var(--menu3-border, rgba(0, 0, 0, 0.1));
            border-radius: 999px;
            border-left: 1px solid var(--menu3-border, rgba(0, 0, 0, 0.1));
            white-space: nowrap;
          }

          .menu3-category-item.is-active {
            background: var(--menu3-accent, #333);
            border-color: var(--menu3-accent, #333);
            color: white;
          }
        }
      `}</style>
    </nav>
  );
}
