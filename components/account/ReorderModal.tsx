'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  X,
  Loader2,
  ShoppingCart,
  AlertTriangle,
  Check,
  MapPin,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';

interface MenuItemData {
  _id: string;
  name: string;
  slug: string;
  price: number;
  description?: string;
  image?: string;
  categorySlug: string;
}

interface ReorderItem {
  _key: string;
  menuItemId: string;
  name: string;
  originalPrice: number;
  currentPrice: number;
  quantity: number;
  modifiers?: Array<{
    name: string;
    option: string;
    priceDelta: number;
  }>;
  specialInstructions?: string;
  isAvailable: boolean;
  priceChanged: boolean;
  unavailableReason?: string;
  menuItem?: MenuItemData;
}

interface ReorderData {
  order: {
    _id: string;
    orderNumber: string;
    originalLocation: string;
  };
  targetLocation: string;
  locationChanged: boolean;
  availableItems: ReorderItem[];
  unavailableItems: ReorderItem[];
  summary: {
    totalItems: number;
    availableCount: number;
    unavailableCount: number;
    hasChanges: boolean;
  };
}

interface ReorderModalProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  targetLocationId?: string;
}

export function ReorderModal({
  orderId,
  isOpen,
  onClose,
  targetLocationId,
}: ReorderModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReorderData | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const { addMultipleToCart } = useCart();

  // Focus trap and escape key handler for accessibility
  useEffect(() => {
    if (!isOpen) return;

    // Save current focus
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Move focus into modal
    const focusFirstElement = () => {
      const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    };
    // Small delay to ensure modal is rendered
    const timer = setTimeout(focusFirstElement, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key closes modal
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Tab key traps focus within modal
      if (e.key === 'Tab' && modalRef.current) {
        const focusables = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus when modal closes
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchReorderData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, targetLocationId }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to load order');
        }

        setData(result);
        // Pre-select all available items
        setSelectedItems(
          new Set(result.availableItems.map((item: ReorderItem) => item._key))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setLoading(false);
      }
    }

    fetchReorderData();
  }, [orderId, targetLocationId, isOpen]);

  const toggleItem = (key: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleAddToCart = async () => {
    if (!data || selectedItems.size === 0) return;

    setAdding(true);

    const itemsToAdd = data.availableItems
      .filter((item) => selectedItems.has(item._key) && item.menuItem)
      .map((item) => ({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.currentPrice,
        quantity: item.quantity,
        modifiers: item.modifiers,
        specialInstructions: item.specialInstructions,
        menuItem: item.menuItem,
      }));

    try {
      await addMultipleToCart(itemsToAdd);
      onClose();
    } catch {
      setError('Failed to add items to cart');
    } finally {
      setAdding(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const calculateTotal = () => {
    if (!data) return 0;
    return data.availableItems
      .filter((item) => selectedItems.has(item._key))
      .reduce((total, item) => {
        const modifiersTotal =
          item.modifiers?.reduce((sum, mod) => sum + mod.priceDelta, 0) || 0;
        return total + (item.currentPrice + modifiersTotal) * item.quantity;
      }, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reorder-modal-title"
        className="relative bg-background rounded-lg shadow-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 id="reorder-modal-title" className="font-display font-semibold text-lg">Reorder</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : data ? (
            <div className="space-y-4">
              {/* Order info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Order #{data.order.orderNumber}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{data.targetLocation}</span>
                    {data.locationChanged && (
                      <Badge variant="secondary" className="ml-auto">
                        Different location
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Warnings */}
              {data.summary.hasChanges && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Some items have changed</AlertTitle>
                  <AlertDescription>
                    {data.summary.unavailableCount > 0 && (
                      <span>
                        {data.summary.unavailableCount} item(s) are no longer
                        available.
                      </span>
                    )}{' '}
                    Prices may have changed since your last order.
                  </AlertDescription>
                </Alert>
              )}

              {/* Available items */}
              {data.availableItems.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Available Items</h3>
                  <div className="space-y-2">
                    {data.availableItems.map((item) => (
                      <div
                        key={item._key}
                        tabIndex={0}
                        role="checkbox"
                        aria-checked={selectedItems.has(item._key)}
                        className={`
                          flex items-start gap-3 p-3 rounded-lg border cursor-pointer
                          transition-colors focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2
                          ${
                            selectedItems.has(item._key)
                              ? 'border-primary bg-primary/5'
                              : 'border-muted hover:bg-muted/50'
                          }
                        `}
                        onClick={() => toggleItem(item._key)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleItem(item._key);
                          }
                        }}
                      >
                        <div
                          className={`
                            flex h-5 w-5 items-center justify-center rounded border
                            ${
                              selectedItems.has(item._key)
                                ? 'border-primary bg-primary text-white'
                                : 'border-muted'
                            }
                          `}
                        >
                          {selectedItems.has(item._key) && (
                            <Check className="h-3 w-3" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="font-medium">
                              {item.quantity}x {item.name}
                            </span>
                            <div className="flex items-center gap-1">
                              {item.priceChanged && (
                                item.currentPrice > item.originalPrice ? (
                                  <TrendingUp className="h-3 w-3 text-red-500" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 text-green-500" />
                                )
                              )}
                              <span className="font-medium">
                                {formatPrice(item.currentPrice * item.quantity)}
                              </span>
                            </div>
                          </div>

                          {item.modifiers && item.modifiers.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.modifiers
                                .map((m) => `${m.name}: ${m.option}`)
                                .join(', ')}
                            </p>
                          )}

                          {item.priceChanged && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Was {formatPrice(item.originalPrice)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unavailable items */}
              {data.unavailableItems.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2 text-muted-foreground">
                    Unavailable Items
                  </h3>
                  <div className="space-y-2">
                    {data.unavailableItems.map((item) => (
                      <div
                        key={item._key}
                        className="flex items-start gap-3 p-3 rounded-lg border border-muted bg-muted/30 opacity-60"
                      >
                        <div className="flex h-5 w-5 items-center justify-center rounded border border-muted">
                          <X className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium line-through">
                            {item.quantity}x {item.name}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {item.unavailableReason}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {data && data.availableItems.length > 0 && (
          <>
            <Separator />
            <div className="p-4 space-y-3">
              <div className="flex justify-between font-medium">
                <span>
                  {selectedItems.size} item(s) selected
                </span>
                <span>{formatPrice(calculateTotal())}</span>
              </div>

              <Button
                className="w-full gap-2"
                onClick={handleAddToCart}
                disabled={selectedItems.size === 0 || adding}
              >
                {adding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding to Cart...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    Add to Cart
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
