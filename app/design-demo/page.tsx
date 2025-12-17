'use client';

import React, { useState } from 'react';

/**
 * Design Demo Page
 *
 * Interactive comparison of current vs proposed design system.
 * Showcases the "Catch Track" pattern - the 3D inset effect from the events toggle.
 */

type DesignMode = 'current' | 'proposed';

export default function DesignDemoPage() {
  const [mode, setMode] = useState<DesignMode>('proposed');
  const [activeTab, setActiveTab] = useState(0);
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  const filters = ['All', 'Seafood', 'Platters', 'Sides', 'Drinks'];
  const tabs = ['Overview', 'Components', 'Colors', 'Typography'];

  return (
    <div className={`demo-page ${mode}`}>
      <style>{`
        /* ============================================
           DESIGN DEMO PAGE STYLES
           ============================================ */

        .demo-page {
          --demo-cream: #FDF8ED;
          --demo-tierra: #322723;
          --demo-ocean: #2B7A9B;
          --demo-warm-secondary: #5b4a42;
          --demo-warm-muted: #7c6a63;

          /* Current (cold) palette */
          --current-bg: #ffffff;
          --current-sidebar: #f0f0f0;
          --current-border: rgba(0, 0, 0, 0.06);
          --current-text: #1a1a1a;
          --current-muted: #888;
          --current-accent: #1a1a1a;

          /* Proposed (warm) palette */
          --proposed-bg: #FDF8ED;
          --proposed-sidebar: rgba(50, 39, 35, 0.04);
          --proposed-border: rgba(50, 39, 35, 0.08);
          --proposed-text: #322723;
          --proposed-muted: #7c6a63;
          --proposed-accent: #2B7A9B;

          min-height: 100vh;
          background: var(--demo-cream);
          font-family: var(--font-body, 'Source Sans 3', system-ui, sans-serif);
          color: var(--demo-tierra);
          padding-bottom: 120px;
        }

        /* ============================================
           HEADER
           ============================================ */

        .demo-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--demo-cream);
          border-bottom: 1px solid rgba(50, 39, 35, 0.1);
          backdrop-filter: blur(12px);
        }

        .demo-header-inner {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .demo-title {
          font-family: var(--font-display, 'Playfair Display', Georgia, serif);
          font-size: 28px;
          font-weight: 500;
          letter-spacing: -0.02em;
        }

        .demo-title span {
          color: var(--demo-ocean);
        }

        /* ============================================
           MASTER TOGGLE - The Hero Element
           ============================================ */

        .master-toggle {
          display: flex;
          gap: 4px;
          padding: 6px;
          background: rgba(50, 39, 35, 0.04);
          border-radius: 14px;
          border: 1px solid rgba(50, 39, 35, 0.08);
        }

        .master-toggle button {
          padding: 12px 28px;
          border: none;
          border-radius: 10px;
          font-family: var(--font-family--headings, 'Poppins', sans-serif);
          font-size: 15px;
          font-weight: 500;
          letter-spacing: 0.01em;
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          background: transparent;
          color: var(--demo-tierra);
        }

        .master-toggle button:hover:not(.active) {
          background: rgba(50, 39, 35, 0.06);
        }

        .master-toggle button.active {
          background: var(--demo-ocean);
          color: white;
          box-shadow: 0 4px 16px rgba(43, 122, 155, 0.3);
        }

        /* ============================================
           CONTENT SECTIONS
           ============================================ */

        .demo-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 60px 40px;
        }

        .demo-section {
          margin-bottom: 80px;
        }

        .section-header {
          margin-bottom: 40px;
        }

        .section-eyebrow {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--demo-ocean);
          margin-bottom: 12px;
        }

        .section-title {
          font-family: var(--font-display, 'Playfair Display', Georgia, serif);
          font-size: 36px;
          font-weight: 500;
          letter-spacing: -0.02em;
          margin-bottom: 16px;
        }

        .section-description {
          font-size: 17px;
          line-height: 1.7;
          color: var(--demo-warm-secondary);
          max-width: 640px;
        }

        /* ============================================
           COLOR PALETTE COMPARISON
           ============================================ */

        .palette-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;
        }

        .palette-card {
          padding: 32px;
          border-radius: 16px;
          border: 1px solid rgba(50, 39, 35, 0.08);
          transition: all 0.4s ease;
        }

        .palette-card.current-palette {
          background: white;
        }

        .palette-card.proposed-palette {
          background: rgba(50, 39, 35, 0.02);
        }

        .palette-label {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .palette-label .badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.05em;
        }

        .current-palette .badge {
          background: #f0f0f0;
          color: #666;
        }

        .proposed-palette .badge {
          background: rgba(43, 122, 155, 0.1);
          color: var(--demo-ocean);
        }

        .color-swatches {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .swatch {
          aspect-ratio: 1;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 12px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.02em;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .swatch:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }

        .swatch-name {
          opacity: 0.9;
        }

        .swatch-value {
          opacity: 0.7;
          font-size: 10px;
          margin-top: 4px;
        }

        /* ============================================
           CATCH TRACK PATTERN - The Star
           ============================================ */

        .pattern-showcase {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 48px;
        }

        .pattern-demo {
          padding: 40px;
          border-radius: 20px;
          transition: all 0.4s ease;
        }

        .demo-page.current .pattern-demo {
          background: var(--current-bg);
          border: 1px solid var(--current-border);
        }

        .demo-page.proposed .pattern-demo {
          background: var(--proposed-bg);
          border: 1px solid var(--proposed-border);
        }

        .pattern-title {
          font-family: var(--font-family--headings, 'Poppins', sans-serif);
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pattern-title::before {
          content: '';
          width: 4px;
          height: 20px;
          background: var(--demo-ocean);
          border-radius: 2px;
        }

        /* Track Container - Current Style */
        .demo-page.current .catch-track {
          display: flex;
          gap: 8px;
          padding: 4px;
          background: #f5f5f5;
          border-radius: 8px;
        }

        .demo-page.current .catch-track-item {
          flex: 1;
          padding: 14px 24px;
          background: transparent;
          border: none;
          border-radius: 6px;
          font-family: var(--font-family--headings, 'Poppins', sans-serif);
          font-size: 15px;
          font-weight: 500;
          color: #666;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .demo-page.current .catch-track-item:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .demo-page.current .catch-track-item.active {
          background: #333;
          color: white;
        }

        /* Track Container - Proposed Style (The Magic) */
        .demo-page.proposed .catch-track {
          display: flex;
          gap: 12px;
          padding: 8px;
          background: rgba(50, 39, 35, 0.04);
          border-radius: 12px;
          border: 1px solid rgba(50, 39, 35, 0.08);
        }

        .demo-page.proposed .catch-track-item {
          flex: 1;
          padding: 16px 24px;
          background: transparent;
          border: none;
          border-radius: 8px;
          font-family: var(--font-family--headings, 'Poppins', sans-serif);
          font-size: 15px;
          font-weight: 500;
          color: var(--demo-tierra);
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          letter-spacing: 0.02em;
        }

        .demo-page.proposed .catch-track-item:hover:not(.active) {
          background: rgba(255, 255, 255, 0.7);
          box-shadow: 0 1px 4px rgba(50, 39, 35, 0.06);
        }

        .demo-page.proposed .catch-track-item.active {
          background: var(--demo-ocean);
          color: white;
          box-shadow: 0 4px 12px rgba(43, 122, 155, 0.25);
        }

        /* ============================================
           FILTER CHIPS
           ============================================ */

        .demo-page.current .filter-chips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .demo-page.current .filter-chip {
          padding: 10px 20px;
          background: #f5f5f5;
          border: 1px solid #e0e0e0;
          border-radius: 20px;
          font-size: 14px;
          color: #666;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .demo-page.current .filter-chip:hover {
          background: #eee;
        }

        .demo-page.current .filter-chip.active {
          background: #333;
          border-color: #333;
          color: white;
        }

        /* Proposed Filter Chips - Compact */
        .demo-page.proposed .filter-chips {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: rgba(50, 39, 35, 0.03);
          border-radius: 20px;
          border: 1px solid rgba(50, 39, 35, 0.06);
          width: fit-content;
        }

        .demo-page.proposed .filter-chip {
          padding: 6px 14px;
          background: transparent;
          border: none;
          border-radius: 16px;
          font-family: var(--font-family--headings, 'Poppins', sans-serif);
          font-size: 13px;
          font-weight: 500;
          color: var(--demo-warm-muted);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .demo-page.proposed .filter-chip:hover:not(.active) {
          color: var(--demo-tierra);
          background: rgba(255, 255, 255, 0.6);
        }

        .demo-page.proposed .filter-chip.active {
          background: var(--demo-ocean);
          color: white;
          box-shadow: 0 2px 6px rgba(43, 122, 155, 0.2);
        }

        /* ============================================
           SEARCH INPUT
           ============================================ */

        .demo-page.current .search-input-demo {
          position: relative;
          max-width: 320px;
        }

        .demo-page.current .search-input-demo input {
          width: 100%;
          padding: 14px 20px 14px 48px;
          background: #f5f5f5;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          font-size: 15px;
          color: #333;
          outline: none;
          transition: all 0.2s ease;
        }

        .demo-page.current .search-input-demo input:focus {
          border-color: #333;
          background: white;
        }

        .demo-page.current .search-input-demo input::placeholder {
          color: #999;
        }

        /* Proposed Search Input */
        .demo-page.proposed .search-input-demo {
          position: relative;
          max-width: 320px;
        }

        .demo-page.proposed .search-input-demo input {
          width: 100%;
          padding: 16px 20px 16px 52px;
          background: rgba(50, 39, 35, 0.02);
          border: 1px solid rgba(50, 39, 35, 0.08);
          border-radius: 12px;
          font-size: 15px;
          color: var(--demo-tierra);
          outline: none;
          box-shadow: inset 0 1px 3px rgba(50, 39, 35, 0.04);
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .demo-page.proposed .search-input-demo input:focus {
          border-color: var(--demo-ocean);
          background: white;
          box-shadow: 0 0 0 4px rgba(43, 122, 155, 0.1);
        }

        .demo-page.proposed .search-input-demo input::placeholder {
          color: var(--demo-warm-muted);
        }

        .search-icon {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          width: 18px;
          height: 18px;
          opacity: 0.4;
        }

        /* ============================================
           CARDS
           ============================================ */

        .card-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-top: 32px;
        }

        .demo-page.current .demo-card {
          background: white;
          border: 1px solid #eee;
          border-radius: 12px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .demo-page.current .demo-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .demo-page.current .demo-card.selected {
          border-color: #333;
          box-shadow: 0 0 0 2px #333;
        }

        /* Proposed Cards */
        .demo-page.proposed .demo-card {
          background: white;
          border: 1px solid rgba(50, 39, 35, 0.08);
          border-radius: 16px;
          padding: 24px;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(50, 39, 35, 0.04);
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .demo-page.proposed .demo-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(50, 39, 35, 0.08);
        }

        .demo-page.proposed .demo-card.selected {
          border-color: var(--demo-ocean);
          box-shadow: 0 0 0 3px rgba(43, 122, 155, 0.15), 0 8px 24px rgba(50, 39, 35, 0.08);
        }

        .card-image {
          width: 100%;
          aspect-ratio: 4/3;
          border-radius: 8px;
          margin-bottom: 16px;
          overflow: hidden;
        }

        .demo-page.current .card-image {
          background: #f5f5f5;
        }

        .demo-page.proposed .card-image {
          background: linear-gradient(135deg, rgba(43, 122, 155, 0.08) 0%, rgba(118, 189, 166, 0.08) 100%);
        }

        .card-title {
          font-family: var(--font-display, 'Playfair Display', Georgia, serif);
          font-size: 20px;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .demo-page.current .card-title {
          color: #333;
        }

        .demo-page.proposed .card-title {
          color: var(--demo-tierra);
        }

        .card-description {
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 16px;
        }

        .demo-page.current .card-description {
          color: #888;
        }

        .demo-page.proposed .card-description {
          color: var(--demo-warm-muted);
        }

        .card-price {
          font-family: var(--font-family--headings, 'Poppins', sans-serif);
          font-size: 18px;
          font-weight: 600;
        }

        .demo-page.current .card-price {
          color: #333;
        }

        .demo-page.proposed .card-price {
          color: var(--demo-ocean);
        }

        /* ============================================
           BUTTON GROUPS
           ============================================ */

        .button-group-container {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }

        .demo-page.current .button-group {
          display: flex;
          gap: 0;
        }

        .demo-page.current .button-group button {
          padding: 14px 28px;
          background: white;
          border: 1px solid #ddd;
          font-size: 14px;
          font-weight: 500;
          color: #666;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .demo-page.current .button-group button:first-child {
          border-radius: 8px 0 0 8px;
        }

        .demo-page.current .button-group button:last-child {
          border-radius: 0 8px 8px 0;
          border-left: none;
        }

        .demo-page.current .button-group button:hover {
          background: #f5f5f5;
        }

        .demo-page.current .button-group button.active {
          background: #333;
          border-color: #333;
          color: white;
        }

        /* Proposed Button Groups */
        .demo-page.proposed .button-group {
          display: flex;
          gap: 8px;
          padding: 6px;
          background: rgba(50, 39, 35, 0.04);
          border-radius: 12px;
          border: 1px solid rgba(50, 39, 35, 0.08);
        }

        .demo-page.proposed .button-group button {
          padding: 12px 24px;
          background: transparent;
          border: none;
          border-radius: 8px;
          font-family: var(--font-family--headings, 'Poppins', sans-serif);
          font-size: 14px;
          font-weight: 500;
          color: var(--demo-tierra);
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .demo-page.proposed .button-group button:hover:not(.active) {
          background: rgba(255, 255, 255, 0.6);
        }

        .demo-page.proposed .button-group button.active {
          background: var(--demo-ocean);
          color: white;
          box-shadow: 0 3px 10px rgba(43, 122, 155, 0.25);
        }

        /* ============================================
           MENU SIDEBAR PREVIEW
           ============================================ */

        .sidebar-preview {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 24px;
          padding: 24px;
          border-radius: 20px;
          min-height: 400px;
        }

        .demo-page.current .sidebar-preview {
          background: var(--current-bg);
          border: 1px solid var(--current-border);
        }

        .demo-page.proposed .sidebar-preview {
          background: var(--proposed-bg);
          border: 1px solid var(--proposed-border);
        }

        .sidebar-nav {
          padding: 12px;
          border-radius: 10px;
        }

        .demo-page.current .sidebar-nav {
          background: #f5f5f5;
        }

        .demo-page.proposed .sidebar-nav {
          background: rgba(50, 39, 35, 0.03);
          border: 1px solid rgba(50, 39, 35, 0.05);
        }

        .sidebar-search {
          margin-bottom: 12px;
        }

        .sidebar-search input {
          width: 100%;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 13px;
          outline: none;
        }

        .demo-page.current .sidebar-search input {
          background: white;
          border: 1px solid #ddd;
          color: #333;
        }

        .demo-page.current .sidebar-search input:focus {
          border-color: #333;
        }

        .demo-page.proposed .sidebar-search input {
          background: white;
          border: 1px solid rgba(50, 39, 35, 0.08);
          color: var(--demo-tierra);
          box-shadow: inset 0 1px 2px rgba(50, 39, 35, 0.03);
        }

        .demo-page.proposed .sidebar-search input:focus {
          border-color: var(--demo-ocean);
          box-shadow: 0 0 0 3px rgba(43, 122, 155, 0.1);
        }

        .category-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .category-item {
          padding: 10px 14px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .demo-page.current .category-item {
          color: #666;
          border-left: 3px solid transparent;
        }

        .demo-page.current .category-item:hover {
          background: rgba(0, 0, 0, 0.04);
        }

        .demo-page.current .category-item.active {
          background: white;
          color: #333;
          font-weight: 500;
          border-left-color: #333;
        }

        .demo-page.proposed .category-item {
          color: var(--demo-warm-muted);
          font-family: var(--font-family--headings, 'Poppins', sans-serif);
        }

        .demo-page.proposed .category-item:hover {
          background: rgba(255, 255, 255, 0.5);
          color: var(--demo-tierra);
        }

        .demo-page.proposed .category-item.active {
          background: white;
          color: var(--demo-tierra);
          font-weight: 500;
          box-shadow: 0 1px 4px rgba(50, 39, 35, 0.08);
        }

        .main-content-preview {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          padding: 16px;
        }

        .menu-item-preview {
          padding: 20px;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .demo-page.current .menu-item-preview {
          background: #fafafa;
          border: 1px solid #eee;
        }

        .demo-page.current .menu-item-preview:hover {
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .demo-page.proposed .menu-item-preview {
          background: white;
          border: 1px solid rgba(50, 39, 35, 0.06);
          box-shadow: 0 1px 3px rgba(50, 39, 35, 0.03);
        }

        .demo-page.proposed .menu-item-preview:hover {
          box-shadow: 0 4px 16px rgba(50, 39, 35, 0.08);
          transform: translateY(-2px);
        }

        .item-name {
          font-family: var(--font-display, 'Playfair Display', Georgia, serif);
          font-size: 17px;
          margin-bottom: 6px;
        }

        .demo-page.current .item-name {
          color: #333;
        }

        .demo-page.proposed .item-name {
          color: var(--demo-tierra);
        }

        .item-desc {
          font-size: 13px;
          line-height: 1.5;
          margin-bottom: 12px;
        }

        .demo-page.current .item-desc {
          color: #888;
        }

        .demo-page.proposed .item-desc {
          color: var(--demo-warm-muted);
        }

        .item-price {
          font-weight: 600;
          font-size: 16px;
        }

        .demo-page.current .item-price {
          color: #333;
        }

        .demo-page.proposed .item-price {
          color: var(--demo-ocean);
        }

        /* ============================================
           TABS COMPONENT
           ============================================ */

        .tabs-demo {
          margin-bottom: 32px;
        }

        .demo-page.current .tabs-container {
          display: flex;
          gap: 0;
          border-bottom: 2px solid #eee;
        }

        .demo-page.current .tab-item {
          padding: 16px 32px;
          background: none;
          border: none;
          font-size: 15px;
          font-weight: 500;
          color: #888;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
        }

        .demo-page.current .tab-item:hover {
          color: #333;
        }

        .demo-page.current .tab-item.active {
          color: #333;
        }

        .demo-page.current .tab-item.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background: #333;
        }

        /* Proposed Tabs */
        .demo-page.proposed .tabs-container {
          display: flex;
          gap: 6px;
          padding: 6px;
          background: rgba(50, 39, 35, 0.04);
          border-radius: 14px;
          border: 1px solid rgba(50, 39, 35, 0.06);
          width: fit-content;
        }

        .demo-page.proposed .tab-item {
          padding: 14px 28px;
          background: transparent;
          border: none;
          border-radius: 10px;
          font-family: var(--font-family--headings, 'Poppins', sans-serif);
          font-size: 15px;
          font-weight: 500;
          color: var(--demo-warm-muted);
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .demo-page.proposed .tab-item:hover:not(.active) {
          color: var(--demo-tierra);
          background: rgba(50, 39, 35, 0.04);
        }

        .demo-page.proposed .tab-item.active {
          background: var(--demo-ocean);
          color: white;
          box-shadow: 0 4px 12px rgba(43, 122, 155, 0.25);
        }

        /* ============================================
           TRANSITION INDICATOR
           ============================================ */

        .transition-notice {
          text-align: center;
          padding: 48px;
          margin: 40px 0;
          border-radius: 20px;
          transition: all 0.4s ease;
        }

        .demo-page.current .transition-notice {
          background: linear-gradient(135deg, #f8f8f8 0%, #f0f0f0 100%);
          border: 2px dashed #ddd;
        }

        .demo-page.proposed .transition-notice {
          background: linear-gradient(135deg, rgba(43, 122, 155, 0.04) 0%, rgba(118, 189, 166, 0.04) 100%);
          border: 2px solid rgba(43, 122, 155, 0.15);
        }

        .notice-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .demo-page.current .notice-icon {
          background: #eee;
        }

        .demo-page.proposed .notice-icon {
          background: rgba(43, 122, 155, 0.1);
        }

        .notice-title {
          font-family: var(--font-display, 'Playfair Display', Georgia, serif);
          font-size: 24px;
          margin-bottom: 8px;
        }

        .notice-text {
          font-size: 15px;
          max-width: 480px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .demo-page.current .notice-text {
          color: #888;
        }

        .demo-page.proposed .notice-text {
          color: var(--demo-warm-secondary);
        }

        /* ============================================
           RESPONSIVE
           ============================================ */

        @media (max-width: 1024px) {
          .palette-grid,
          .pattern-showcase {
            grid-template-columns: 1fr;
          }

          .sidebar-preview {
            grid-template-columns: 1fr;
          }

          .card-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .demo-header-inner {
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }

          .demo-content {
            padding: 40px 20px;
          }

          .card-grid {
            grid-template-columns: 1fr;
          }

          .color-swatches {
            grid-template-columns: repeat(2, 1fr);
          }

          .section-title {
            font-size: 28px;
          }
        }
      `}</style>

      {/* Header */}
      <header className="demo-header">
        <div className="demo-header-inner">
          <h1 className="demo-title">
            Design <span>System</span>
          </h1>
          <div className="master-toggle">
            <button
              className={mode === 'current' ? 'active' : ''}
              onClick={() => setMode('current')}
            >
              Current
            </button>
            <button
              className={mode === 'proposed' ? 'active' : ''}
              onClick={() => setMode('proposed')}
            >
              Proposed
            </button>
          </div>
        </div>
      </header>

      <main className="demo-content">
        {/* Transition Notice */}
        <div className="transition-notice">
          <div className="notice-icon">
            {mode === 'current' ? '🔲' : '✨'}
          </div>
          <h3 className="notice-title">
            {mode === 'current' ? 'Current Design' : 'Proposed Design'}
          </h3>
          <p className="notice-text">
            {mode === 'current'
              ? 'The current menu page uses a cold, neutral palette with gray tones and black accents.'
              : 'The proposed design uses warm cream tones and the 3D "Catch Track" pattern for a cohesive, sophisticated feel.'}
          </p>
        </div>

        {/* Color Palette Section */}
        <section className="demo-section">
          <div className="section-header">
            <p className="section-eyebrow">Foundations</p>
            <h2 className="section-title">Color Palette</h2>
            <p className="section-description">
              Comparing the current cold/neutral palette with the proposed warm cream palette that matches the rest of the site.
            </p>
          </div>

          <div className="palette-grid">
            <div className="palette-card current-palette">
              <div className="palette-label">
                Current <span className="badge">Cold</span>
              </div>
              <div className="color-swatches">
                <div className="swatch" style={{ background: '#ffffff', color: '#333', border: '1px solid #eee' }}>
                  <span className="swatch-name">Background</span>
                  <span className="swatch-value">#ffffff</span>
                </div>
                <div className="swatch" style={{ background: '#f0f0f0', color: '#333' }}>
                  <span className="swatch-name">Sidebar</span>
                  <span className="swatch-value">#f0f0f0</span>
                </div>
                <div className="swatch" style={{ background: '#1a1a1a', color: '#fff' }}>
                  <span className="swatch-name">Accent</span>
                  <span className="swatch-value">#1a1a1a</span>
                </div>
                <div className="swatch" style={{ background: '#888888', color: '#fff' }}>
                  <span className="swatch-name">Muted</span>
                  <span className="swatch-value">#888888</span>
                </div>
                <div className="swatch" style={{ background: '#f5f5f5', color: '#333' }}>
                  <span className="swatch-name">Preview</span>
                  <span className="swatch-value">#f5f5f5</span>
                </div>
                <div className="swatch" style={{ background: 'rgba(0,0,0,0.06)', color: '#333', border: '1px solid #eee' }}>
                  <span className="swatch-name">Border</span>
                  <span className="swatch-value">6% black</span>
                </div>
              </div>
            </div>

            <div className="palette-card proposed-palette">
              <div className="palette-label">
                Proposed <span className="badge">Warm</span>
              </div>
              <div className="color-swatches">
                <div className="swatch" style={{ background: '#FDF8ED', color: '#322723' }}>
                  <span className="swatch-name">Cream</span>
                  <span className="swatch-value">#FDF8ED</span>
                </div>
                <div className="swatch" style={{ background: 'rgba(50, 39, 35, 0.04)', color: '#322723', border: '1px solid rgba(50,39,35,0.1)' }}>
                  <span className="swatch-name">Sidebar</span>
                  <span className="swatch-value">4% tierra</span>
                </div>
                <div className="swatch" style={{ background: '#2B7A9B', color: '#fff' }}>
                  <span className="swatch-name">Ocean</span>
                  <span className="swatch-value">#2B7A9B</span>
                </div>
                <div className="swatch" style={{ background: '#7c6a63', color: '#fff' }}>
                  <span className="swatch-name">Muted</span>
                  <span className="swatch-value">#7c6a63</span>
                </div>
                <div className="swatch" style={{ background: '#322723', color: '#fff' }}>
                  <span className="swatch-name">Tierra</span>
                  <span className="swatch-value">#322723</span>
                </div>
                <div className="swatch" style={{ background: 'rgba(50, 39, 35, 0.08)', color: '#322723', border: '1px solid rgba(50,39,35,0.15)' }}>
                  <span className="swatch-name">Border</span>
                  <span className="swatch-value">8% tierra</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Catch Track Pattern */}
        <section className="demo-section">
          <div className="section-header">
            <p className="section-eyebrow">Signature Pattern</p>
            <h2 className="section-title">The Catch Track</h2>
            <p className="section-description">
              The 3D inset container pattern inspired by the events page toggle. Creates depth through padding, subtle backgrounds, and elevation shadows on active states.
            </p>
          </div>

          <div className="pattern-showcase">
            <div className="pattern-demo">
              <h4 className="pattern-title">Toggle Switch</h4>
              <div className="catch-track">
                <button
                  className={`catch-track-item ${activeTab === 0 ? 'active' : ''}`}
                  onClick={() => setActiveTab(0)}
                >
                  Private Parties
                </button>
                <button
                  className={`catch-track-item ${activeTab === 1 ? 'active' : ''}`}
                  onClick={() => setActiveTab(1)}
                >
                  Catering
                </button>
              </div>
            </div>

            <div className="pattern-demo">
              <h4 className="pattern-title">Filter Chips</h4>
              <div className="filter-chips">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    className={`filter-chip ${activeFilter === filter ? 'active' : ''}`}
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="pattern-demo">
              <h4 className="pattern-title">Search Input</h4>
              <div className="search-input-demo">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
                <input type="text" placeholder="Search menu items..." />
              </div>
            </div>

            <div className="pattern-demo">
              <h4 className="pattern-title">Button Groups</h4>
              <div className="button-group-container">
                <div className="button-group">
                  <button className="active">Dine In</button>
                  <button>Takeout</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tabs Demo */}
        <section className="demo-section">
          <div className="section-header">
            <p className="section-eyebrow">Navigation</p>
            <h2 className="section-title">Tab Navigation</h2>
            <p className="section-description">
              Tabs transform from flat underline style to the elevated track pattern.
            </p>
          </div>

          <div className="tabs-demo">
            <div className="tabs-container">
              {tabs.map((tab, i) => (
                <button
                  key={tab}
                  className={`tab-item ${activeTab === i ? 'active' : ''}`}
                  onClick={() => setActiveTab(i)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="demo-section">
          <div className="section-header">
            <p className="section-eyebrow">Components</p>
            <h2 className="section-title">Card Treatments</h2>
            <p className="section-description">
              Cards get warmer borders, subtle shadows, and smooth hover lift animations.
            </p>
          </div>

          <div className="card-grid">
            {[
              { name: 'Gulf Shrimp Platter', desc: 'Fresh Gulf shrimp, hand-breaded and fried golden', price: '$18.95' },
              { name: 'Catch Fish Tacos', desc: 'Three tacos with grilled fish, slaw & chipotle crema', price: '$14.95' },
              { name: 'Oyster Po\'Boy', desc: 'Crispy oysters on French bread with remoulade', price: '$16.95' },
            ].map((item, i) => (
              <div
                key={i}
                className={`demo-card ${selectedCard === i ? 'selected' : ''}`}
                onClick={() => setSelectedCard(selectedCard === i ? null : i)}
              >
                <div className="card-image" />
                <h4 className="card-title">{item.name}</h4>
                <p className="card-description">{item.desc}</p>
                <span className="card-price">{item.price}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Menu Sidebar Preview */}
        <section className="demo-section">
          <div className="section-header">
            <p className="section-eyebrow">Layout Preview</p>
            <h2 className="section-title">Menu Sidebar</h2>
            <p className="section-description">
              How the category navigation will look with the warm palette and track pattern applied.
            </p>
          </div>

          <div className="sidebar-preview">
            <div className="sidebar-nav">
              <div className="sidebar-search">
                <input type="text" placeholder="Search..." />
              </div>
              <div className="category-list">
                {['All Items', 'Platters', 'Sandwiches', 'Sides', 'Beverages'].map((cat, i) => (
                  <div
                    key={cat}
                    className={`category-item ${i === 0 ? 'active' : ''}`}
                  >
                    {cat}
                  </div>
                ))}
              </div>
            </div>
            <div className="main-content-preview">
              {[
                { name: 'Fried Catfish', desc: 'Southern-style catfish fillets', price: '$15.95' },
                { name: 'Shrimp Basket', desc: 'Hand-breaded Gulf shrimp', price: '$14.95' },
                { name: 'Crawfish Etouffee', desc: 'Classic Louisiana recipe', price: '$17.95' },
                { name: 'Hush Puppies', desc: 'Golden cornmeal fritters', price: '$5.95' },
              ].map((item, i) => (
                <div key={i} className="menu-item-preview">
                  <h5 className="item-name">{item.name}</h5>
                  <p className="item-desc">{item.desc}</p>
                  <span className="item-price">{item.price}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
