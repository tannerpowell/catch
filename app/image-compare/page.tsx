'use client';

import { useState } from 'react';
import Image from 'next/image';
import ImageCompare from '@/components/catch/ImageCompare';

// Image pairs for comparison - using compressed JPEGs for better performance
const IMAGE_PAIRS = [
  { name: 'Banana Pudding', before: '/images/compare/before/banana-pudding.jpg', after: '/images/jpeg/banana-pudding__hero_4x3.jpg' },
  { name: 'Big Bang Shrimp', before: '/images/compare/before/big-bang-shrimp.jpg', after: '/images/jpeg/big-bang-shrimp__hero_4x3.jpg' },
  { name: 'Blackened Catfish', before: '/images/compare/before/blackened-catfish-with-sides.jpg', after: '/images/jpeg/blackened-catfish-with-sides__hero_4x3.jpg' },
  { name: 'Bourbon Chicken Pasta', before: '/images/compare/before/bourbon-chicken-pasta.jpg', after: '/images/jpeg/bourbon-chicken-pasta__hero_4x3.jpg' },
  { name: 'Cajun Special', before: '/images/compare/before/cajun-special.jpg', after: '/images/jpeg/cajun-special__hero_4x3.jpg' },
  { name: 'Catfish Basket', before: '/images/compare/before/catfish-basket.jpg', after: '/images/jpeg/catfish-basket__hero_4x3.jpg' },
  { name: 'Chicken and Waffles', before: '/images/compare/before/chicken-and-waffles.jpg', after: '/images/jpeg/chicken-and-waffles__hero_4x3.jpg' },
  { name: 'French Quarter Plate', before: '/images/compare/before/french-quarter-plate.jpg', after: '/images/jpeg/french-quarter-plate__hero_4x3.jpg' },
  { name: 'Gumbo', before: '/images/compare/before/gumbo.jpg', after: '/images/jpeg/gumbo__hero_4x3.jpg' },
  { name: 'House Salad', before: '/images/compare/before/house-salad.jpg', after: '/images/jpeg/house-salad__hero_4x3.jpg' },
  { name: 'Hush Puppies', before: '/images/compare/before/hush-puppies.jpg', after: '/images/jpeg/hush-puppies__hero_4x3.jpg' },
  { name: 'Jumbo Shrimp and Catfish', before: '/images/compare/before/jumbo-shrimp-and-catfish.jpg', after: '/images/jpeg/jumbo-shrimp-and-catfish__hero_4x3.jpg' },
  { name: 'Key Lime Pie', before: '/images/compare/before/key-lime-pie.jpg', after: '/images/jpeg/key-lime-pie__hero_4x3.jpg' },
  { name: 'Shrimp Etouffee Quesadilla', before: '/images/compare/before/shrimp-etouffee-quesadilla.jpg', after: '/images/jpeg/shrimp-etouffee-quesadilla__hero_4x3.jpg' },
  { name: 'Swamp Fries', before: '/images/compare/before/swamp-fries.jpg', after: '/images/jpeg/swamp-fries__hero_4x3.jpg' },
  { name: 'The Big Easy', before: '/images/compare/before/the-big-easy.jpg', after: '/images/jpeg/the-big-easy__hero_4x3.jpg' },
  { name: 'The Catch Boil', before: '/images/compare/before/the-catch-boil.jpg', after: '/images/jpeg/the-catch-boil__hero_4x3.jpg' },
  { name: 'Warm Beignets', before: '/images/compare/before/warm-beignets.jpg', after: '/images/jpeg/warm-beignets__hero_4x3.jpg' },
];

export default function ImageComparePage() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');

  return (
    <>
      <style jsx>{`
        .compare-page {
          --cp-cream: #FAF7F2;
          --cp-cream-dark: #F0EBE3;
          --cp-gold: #C4A35A;
          --cp-text: #2C2420;
          --cp-text-soft: #5C5450;

          min-height: 100vh;
          background: linear-gradient(180deg, var(--cp-cream) 0%, var(--cp-cream-dark) 100%);
          padding: 40px 24px;
        }

        :global(.dark) .compare-page {
          --cp-cream: #0F0D0B;
          --cp-cream-dark: #1C1917;
          --cp-gold: #D4B896;
          --cp-text: #F5F2EF;
          --cp-text-soft: #B8B0A8;
        }

        .compare-header {
          max-width: 1200px;
          margin: 0 auto 40px;
          text-align: center;
        }

        .compare-title {
          font-family: var(--font-lux-display);
          font-size: 42px;
          font-weight: 500;
          color: var(--cp-text);
          margin: 0 0 12px;
          letter-spacing: -0.02em;
        }

        .compare-subtitle {
          font-family: var(--font-lux-body);
          font-size: 18px;
          color: var(--cp-text-soft);
          margin: 0 0 32px;
        }

        .compare-controls {
          display: flex;
          justify-content: center;
          gap: 12px;
        }

        .compare-btn {
          padding: 10px 24px;
          font-family: var(--font-lux-body);
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          border: 2px solid var(--cp-gold);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: transparent;
          color: var(--cp-gold);
        }

        .compare-btn:hover {
          background: var(--cp-gold);
          color: white;
        }

        .compare-btn.active {
          background: var(--cp-gold);
          color: white;
        }

        .compare-main {
          max-width: 1000px;
          margin: 0 auto;
        }

        .compare-single {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .compare-thumbnails {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .compare-thumb {
          width: 80px;
          height: 60px;
          border-radius: 6px;
          overflow: hidden;
          cursor: pointer;
          border: 3px solid transparent;
          transition: all 0.2s ease;
          opacity: 0.6;
        }

        .compare-thumb.active,
        .compare-thumb:hover {
          border-color: var(--cp-gold);
          opacity: 1;
        }

        .compare-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .compare-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .compare-grid-item {
          border-radius: 12px;
          overflow: hidden;
        }

        .compare-nav {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
        }

        .compare-nav-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 2px solid var(--cp-gold);
          background: transparent;
          color: var(--cp-gold);
          font-size: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .compare-nav-btn:hover {
          background: var(--cp-gold);
          color: white;
        }

        .compare-nav-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .compare-counter {
          font-family: var(--font-lux-body);
          font-size: 14px;
          color: var(--cp-text-soft);
        }

        .compare-instructions {
          text-align: center;
          margin-top: 24px;
          font-family: var(--font-lux-body);
          font-size: 14px;
          color: var(--cp-text-soft);
        }

        @media (max-width: 768px) {
          .compare-title {
            font-size: 28px;
          }

          .compare-grid {
            grid-template-columns: 1fr;
          }

          .compare-thumb {
            width: 60px;
            height: 45px;
          }
        }
      `}</style>

      <div className="compare-page">
        <header className="compare-header">
          <h1 className="compare-title">Menu Image Transformation</h1>
          <p className="compare-subtitle">
            AI-enhanced photography for The Catch restaurant
          </p>
          <div className="compare-controls">
            <button
              className={`compare-btn ${viewMode === 'single' ? 'active' : ''}`}
              onClick={() => setViewMode('single')}
            >
              Single View
            </button>
            <button
              className={`compare-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              Grid View
            </button>
          </div>
        </header>

        <main className="compare-main">
          {viewMode === 'single' ? (
            <div className="compare-single">
              <ImageCompare
                beforeImage={IMAGE_PAIRS[selectedIndex].before}
                afterImage={IMAGE_PAIRS[selectedIndex].after}
                itemName={IMAGE_PAIRS[selectedIndex].name}
                beforeLabel="Original"
                afterLabel="AI Enhanced"
                priority
              />

              <div className="compare-thumbnails">
                {IMAGE_PAIRS.map((pair, index) => (
                  <button
                    key={pair.name}
                    className={`compare-thumb ${index === selectedIndex ? 'active' : ''}`}
                    onClick={() => setSelectedIndex(index)}
                  >
                    <Image
                      src={pair.before}
                      alt={pair.name}
                      width={80}
                      height={60}
                      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    />
                  </button>
                ))}
              </div>

              <nav className="compare-nav">
                <button
                  className="compare-nav-btn"
                  onClick={() => setSelectedIndex(i => Math.max(0, i - 1))}
                  disabled={selectedIndex === 0}
                >
                  &#8249;
                </button>
                <span className="compare-counter">
                  {selectedIndex + 1} / {IMAGE_PAIRS.length}
                </span>
                <button
                  className="compare-nav-btn"
                  onClick={() => setSelectedIndex(i => Math.min(IMAGE_PAIRS.length - 1, i + 1))}
                  disabled={selectedIndex === IMAGE_PAIRS.length - 1}
                >
                  &#8250;
                </button>
              </nav>

              <p className="compare-instructions">
                Drag the slider to compare original and enhanced images
              </p>
            </div>
          ) : (
            <div className="compare-grid">
              {IMAGE_PAIRS.map((pair) => (
                <div key={pair.name} className="compare-grid-item">
                  <ImageCompare
                    beforeImage={pair.before}
                    afterImage={pair.after}
                    itemName={pair.name}
                    beforeLabel="Original"
                    afterLabel="AI Enhanced"
                  />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
