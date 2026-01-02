'use client';

import { useState } from 'react';
import Image from 'next/image';

// Image pairs with categories for filtering
const IMAGE_PAIRS = [
  { name: 'Banana Pudding', category: 'dessert', before: '/images/compare/before/banana-pudding.jpg', after: '/images/jpeg/banana-pudding__hero_4x3.jpg' },
  { name: 'Big Bang Shrimp', category: 'appetizer', before: '/images/compare/before/big-bang-shrimp.jpg', after: '/images/jpeg/big-bang-shrimp__hero_4x3.jpg' },
  { name: 'Blackened Catfish', category: 'entree', before: '/images/compare/before/blackened-catfish-with-sides.jpg', after: '/images/jpeg/blackened-catfish-with-sides__hero_4x3.jpg' },
  { name: 'Bourbon Chicken Pasta', category: 'entree', before: '/images/compare/before/bourbon-chicken-pasta.jpg', after: '/images/jpeg/bourbon-chicken-pasta__hero_4x3.jpg' },
  { name: 'Cajun Special', category: 'entree', before: '/images/compare/before/cajun-special.jpg', after: '/images/jpeg/cajun-special__hero_4x3.jpg' },
  { name: 'Catfish Basket', category: 'basket', before: '/images/compare/before/catfish-basket.jpg', after: '/images/jpeg/catfish-basket__hero_4x3.jpg' },
  { name: 'Chicken and Waffles', category: 'entree', before: '/images/compare/before/chicken-and-waffles.jpg', after: '/images/jpeg/chicken-and-waffles__hero_4x3.jpg' },
  { name: 'French Quarter Plate', category: 'entree', before: '/images/compare/before/french-quarter-plate.jpg', after: '/images/jpeg/french-quarter-plate__hero_4x3.jpg' },
  { name: 'Gumbo', category: 'entree', before: '/images/compare/before/gumbo.jpg', after: '/images/jpeg/gumbo__hero_4x3.jpg' },
  { name: 'House Salad', category: 'side', before: '/images/compare/before/house-salad.jpg', after: '/images/jpeg/house-salad__hero_4x3.jpg' },
  { name: 'Hush Puppies', category: 'side', before: '/images/compare/before/hush-puppies.jpg', after: '/images/jpeg/hush-puppies__hero_4x3.jpg' },
  { name: 'Jumbo Shrimp & Catfish', category: 'basket', before: '/images/compare/before/jumbo-shrimp-and-catfish.jpg', after: '/images/jpeg/jumbo-shrimp-and-catfish__hero_4x3.jpg' },
  { name: 'Key Lime Pie', category: 'dessert', before: '/images/compare/before/key-lime-pie.jpg', after: '/images/jpeg/key-lime-pie__hero_4x3.jpg' },
  { name: 'Shrimp Etouffee Quesadilla', category: 'appetizer', before: '/images/compare/before/shrimp-etouffee-quesadilla.jpg', after: '/images/jpeg/shrimp-etouffee-quesadilla__hero_4x3.jpg' },
  { name: 'Swamp Fries', category: 'side', before: '/images/compare/before/swamp-fries.jpg', after: '/images/jpeg/swamp-fries__hero_4x3.jpg' },
  { name: 'The Big Easy', category: 'entree', before: '/images/compare/before/the-big-easy.jpg', after: '/images/jpeg/the-big-easy__hero_4x3.jpg' },
  { name: 'The Catch Boil', category: 'entree', before: '/images/compare/before/the-catch-boil.jpg', after: '/images/jpeg/the-catch-boil__hero_4x3.jpg' },
  { name: 'Warm Beignets', category: 'dessert', before: '/images/compare/before/warm-beignets.jpg', after: '/images/jpeg/warm-beignets__hero_4x3.jpg' },
];

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'entree', label: 'Entrées' },
  { value: 'basket', label: 'Baskets' },
  { value: 'appetizer', label: 'Appetizers' },
  { value: 'side', label: 'Sides' },
  { value: 'dessert', label: 'Desserts' },
];

export default function AIImagesPage() {
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredPairs = activeFilter === 'all'
    ? IMAGE_PAIRS
    : IMAGE_PAIRS.filter(pair => pair.category === activeFilter);

  return (
    <>
      <style jsx>{`
        .ai-page {
          min-height: 100vh;
          background: #111;
          padding: 48px 24px 80px;
        }

        .ai-header {
          max-width: 1400px;
          margin: 0 auto 40px;
          text-align: center;
        }

        .ai-title {
          font-family: var(--font-playfair-display), serif;
          font-size: 48px;
          font-weight: 400;
          color: #fff;
          margin: 0 0 12px;
          letter-spacing: -0.02em;
        }

        .ai-subtitle {
          font-family: var(--font-source-sans), sans-serif;
          font-size: 18px;
          color: rgba(255,255,255,0.6);
          margin: 0 0 32px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .ai-filters {
          display: flex;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .ai-chip {
          padding: 8px 20px;
          font-family: var(--font-source-sans), sans-serif;
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 100px;
          background: transparent;
          color: rgba(255,255,255,0.6);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .ai-chip:hover {
          border-color: rgba(255,255,255,0.4);
          color: rgba(255,255,255,0.9);
        }

        .ai-chip.active {
          background: #fff;
          border-color: #fff;
          color: #111;
        }

        .ai-gallery {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .ai-pair {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2px;
          background: rgba(255,255,255,0.9);
          border-radius: 8px;
          overflow: hidden;
          box-shadow:
            0 4px 6px rgba(0,0,0,0.3),
            0 10px 40px rgba(0,0,0,0.4);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .ai-pair:hover {
          transform: translateY(-4px);
          box-shadow:
            0 8px 12px rgba(0,0,0,0.3),
            0 20px 60px rgba(0,0,0,0.5);
        }

        .ai-image-wrap {
          position: relative;
          aspect-ratio: 4/3;
          background: #1a1a1a;
        }

        .ai-image-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .ai-label {
          position: absolute;
          bottom: 8px;
          left: 8px;
          padding: 4px 10px;
          font-family: var(--font-source-sans), sans-serif;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border-radius: 4px;
          background: rgba(0,0,0,0.7);
          color: #fff;
        }

        .ai-label.after {
          background: rgba(52, 199, 89, 0.9);
        }

        .ai-pair-name {
          grid-column: 1 / -1;
          padding: 12px 16px;
          font-family: var(--font-source-sans), sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #222;
          text-align: center;
          background: rgba(255,255,255,0.95);
          border-top: 1px solid rgba(0,0,0,0.05);
        }

        .ai-count {
          text-align: center;
          margin-top: 32px;
          font-family: var(--font-source-sans), sans-serif;
          font-size: 14px;
          color: rgba(255,255,255,0.4);
        }

        @media (max-width: 1024px) {
          .ai-gallery {
            grid-template-columns: 1fr;
            max-width: 600px;
          }
        }

        @media (max-width: 640px) {
          .ai-title {
            font-size: 32px;
          }

          .ai-pair {
            gap: 1px;
          }

          .ai-pair-name {
            font-size: 13px;
            padding: 10px 12px;
          }
        }
      `}</style>

      <div className="ai-page">
        <header className="ai-header">
          <h1 className="ai-title">AI Image Enhancement</h1>
          <p className="ai-subtitle">
            Original menu photos transformed with AI to showcase
            our dishes in their best light
          </p>
          <div className="ai-filters">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                className={`ai-chip ${activeFilter === cat.value ? 'active' : ''}`}
                onClick={() => setActiveFilter(cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </header>

        <div className="ai-gallery">
          {filteredPairs.map((pair) => (
            <article key={pair.name} className="ai-pair">
              <div className="ai-image-wrap">
                <Image
                  src={pair.before}
                  alt={`${pair.name} - Original`}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  style={{ objectFit: 'cover' }}
                />
                <span className="ai-label">Before</span>
              </div>
              <div className="ai-image-wrap">
                <Image
                  src={pair.after}
                  alt={`${pair.name} - AI Enhanced`}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  style={{ objectFit: 'cover' }}
                />
                <span className="ai-label after">After</span>
              </div>
              <div className="ai-pair-name">{pair.name}</div>
            </article>
          ))}
        </div>

        <p className="ai-count">
          Showing {filteredPairs.length} of {IMAGE_PAIRS.length} transformations
        </p>
      </div>
    </>
  );
}
