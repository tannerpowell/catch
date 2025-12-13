'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ModifierSelectionModal from '@/components/cart/ModifierSelectionModal';
import type { CartModifier } from '@/lib/types';

// Dev-only test page - redirect to home in production
const isDev = process.env.NODE_ENV === 'development';

// Local types for demo page (modifier system types for online ordering)
interface ModifierOption {
  _key: string;
  name: string;
  price?: number;
  isDefault?: boolean;
  available?: boolean;
}

interface ModifierGroup {
  _id: string;
  name: string;
  slug: string;
  required: boolean;
  multiSelect: boolean;
  maxSelections?: number;
  options: ModifierOption[];
}

interface DemoMenuItem {
  id: string;
  name: string;
  slug: string;
  categorySlug: string;
  description?: string;
  price?: number;
  image?: string;
  allowSpecialInstructions?: boolean;
  modifierGroups?: ModifierGroup[];
}

// Sample menu item with modifiers (like the Olo Whitefish Basket)
const sampleMenuItem: DemoMenuItem = {
  id: 'test-whitefish-basket',
  name: 'Whitefish Basket',
  slug: 'whitefish-basket',
  categorySlug: 'baskets',
  description: 'Golden fried whitefish served with your choice of side and dipping sauce.',
  price: 14.99,
  image: '/images/placeholder-efefef.jpg',
  allowSpecialInstructions: true,
  modifierGroups: [
    {
      _id: 'size',
      name: 'Size',
      slug: 'size',
      required: true,
      multiSelect: false,
      options: [
        { _key: 'reg', name: 'Regular', price: 0, isDefault: true, available: true },
        { _key: 'med', name: 'Medium', price: 4.00, available: true },
        { _key: 'lg', name: 'Large', price: 8.00, available: true },
      ],
    },
    {
      _id: 'prep',
      name: 'Preparation',
      slug: 'preparation',
      required: true,
      multiSelect: false,
      options: [
        { _key: 'fried', name: 'Fried', price: 0, isDefault: true, available: true },
        { _key: 'grilled', name: 'Grilled', price: 0, available: true },
        { _key: 'blackened', name: 'Blackened', price: 1.50, available: true },
      ],
    },
    {
      _id: 'side',
      name: 'Choose a Side',
      slug: 'side',
      required: true,
      multiSelect: false,
      options: [
        { _key: 'fries', name: 'French Fries', price: 0, isDefault: true, available: true },
        { _key: 'coleslaw', name: 'Coleslaw', price: 0, available: true },
        { _key: 'hushpuppies', name: 'Hush Puppies', price: 0, available: true },
        { _key: 'onion-rings', name: 'Onion Rings', price: 2.00, available: true },
        { _key: 'loaded-fries', name: 'Loaded Fries', price: 3.50, available: true },
      ],
    },
    {
      _id: 'dressing',
      name: 'Dressing',
      slug: 'dressing',
      required: false,
      multiSelect: true,
      maxSelections: 2,
      options: [
        { _key: 'ranch', name: 'Ranch', price: 0, available: true },
        { _key: 'tartar', name: 'Tartar Sauce', price: 0, available: true },
        { _key: 'cocktail', name: 'Cocktail Sauce', price: 0, available: true },
        { _key: 'remoulade', name: 'Remoulade', price: 0, available: true },
        { _key: 'hot-sauce', name: 'Hot Sauce', price: 0, available: true },
      ],
    },
    {
      _id: 'addons',
      name: 'Add Ons',
      slug: 'add-ons',
      required: false,
      multiSelect: true,
      options: [
        { _key: 'extra-fish', name: 'Extra Fish', price: 5.99, available: true },
        { _key: 'grilled-shrimp', name: 'Grilled Shrimp (6pc)', price: 7.99, available: true },
        { _key: 'fried-shrimp', name: 'Fried Shrimp (6pc)', price: 6.99, available: true },
        { _key: 'cheese', name: 'Shredded Cheese', price: 1.50, available: true },
        { _key: 'jalapenos', name: 'Jalapeños', price: 0.75, available: true },
      ],
    },
  ],
};

// Simple item without modifiers
const simpleMenuItem: DemoMenuItem = {
  id: 'test-soft-drink',
  name: 'Soft Drink',
  slug: 'soft-drink',
  categorySlug: 'beverages',
  description: 'Your choice of Coca-Cola products.',
  price: 2.99,
  allowSpecialInstructions: true,
};

export default function TestSheetPage() {
  const router = useRouter();
  const [showModifierModal, setShowModifierModal] = useState(false);
  const [showSimpleModal, setShowSimpleModal] = useState(false);
  const [lastOrder, setLastOrder] = useState<string | null>(null);

  // Redirect to home in production
  useEffect(() => {
    if (!isDev) {
      router.replace('/');
    }
  }, [router]);

  // Don't render in production
  if (!isDev) {
    return null;
  }

  const handleAddToCart = (modifiers: CartModifier[], specialInstructions: string, quantity: number) => {
    const modifierSummary = modifiers.length > 0
      ? modifiers.map(m => `${m.name}: ${m.option}${m.priceDelta > 0 ? ` (+$${m.priceDelta.toFixed(2)})` : ''}`).join(', ')
      : 'None';

    setLastOrder(`Added ${quantity}x item with modifiers: ${modifierSummary}${specialInstructions ? `. Notes: "${specialInstructions}"` : ''}`);
    setShowModifierModal(false);
    setShowSimpleModal(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      padding: '40px 20px',
      background: 'linear-gradient(180deg, #FDF8ED 0%, #f5ebe0 100%)',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 400,
          marginBottom: '8px',
          color: '#322723'
        }}>
          Silk Sheet Test
        </h1>
        <p style={{ color: '#6b5d54', marginBottom: '32px' }}>
          Test the modifier selection modal with native swipe gestures.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button
            onClick={() => setShowModifierModal(true)}
            style={{
              padding: '20px 24px',
              background: '#1A71B3',
              color: 'white',
              border: 'none',
              borderRadius: '14px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
              boxShadow: '0 4px 16px rgba(26, 113, 179, 0.3)',
            }}
          >
            <div style={{ marginBottom: '4px' }}>Whitefish Basket</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              With modifiers: Size, Preparation, Side, Dressing, Add Ons
            </div>
          </button>

          <button
            onClick={() => setShowSimpleModal(true)}
            style={{
              padding: '20px 24px',
              background: '#fff',
              color: '#322723',
              border: '2px solid #ede3d5',
              borderRadius: '14px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ marginBottom: '4px' }}>Soft Drink</div>
            <div style={{ fontSize: '14px', color: '#8C8480' }}>
              Quick add (no modifiers)
            </div>
          </button>
        </div>

        {lastOrder && (
          <div style={{
            marginTop: '32px',
            padding: '16px 20px',
            background: 'rgba(74, 124, 89, 0.1)',
            border: '1px solid rgba(74, 124, 89, 0.3)',
            borderRadius: '12px',
            color: '#4A7C59',
            fontSize: '14px',
          }}>
            <strong>Last order:</strong> {lastOrder}
          </div>
        )}

        <p style={{
          marginTop: '40px',
          color: '#8C8480',
          fontSize: '13px',
          lineHeight: 1.6
        }}>
          Try swiping down on the sheet to dismiss it. On mobile, the swipe gesture feels native.
          The sheet also handles scroll correctly - you can scroll through options without accidentally dismissing.
        </p>
      </div>

      <ModifierSelectionModal
        isOpen={showModifierModal}
        onClose={() => setShowModifierModal(false)}
        onAddToCart={handleAddToCart}
        menuItem={sampleMenuItem}
      />

      <ModifierSelectionModal
        isOpen={showSimpleModal}
        onClose={() => setShowSimpleModal(false)}
        onAddToCart={handleAddToCart}
        menuItem={simpleMenuItem}
      />
    </div>
  );
}
