'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface OrderItem {
  _key: string;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  totalPrice: number;
  modifiers?: Array<{
    name: string;
    option: string;
    priceDelta: number;
  }>;
  specialInstructions?: string;
}

interface OrderItemsListProps {
  items: OrderItem[];
  subtotal: number;
  tax: number;
  tip?: number;
  deliveryFee?: number;
  total: number;
  specialInstructions?: string;
}

export function OrderItemsList({
  items,
  subtotal,
  tax,
  tip = 0,
  deliveryFee = 0,
  total,
  specialInstructions,
}: OrderItemsListProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <Card className="border-(--color-border-subtle)">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-display">Order Items</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Items list */}
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item._key} className="space-y-1">
              <div className="flex justify-between">
                <div className="flex gap-2">
                  <span className="font-medium text-muted-foreground">
                    {item.quantity}x
                  </span>
                  <span className="font-medium">{item.name}</span>
                </div>
                <span className="font-medium">{formatPrice(item.totalPrice)}</span>
              </div>

              {/* Modifiers */}
              {item.modifiers && item.modifiers.length > 0 && (
                <div className="ml-6 space-y-0.5">
                  {item.modifiers.map((mod, idx) => (
                    <p key={idx} className="text-sm text-muted-foreground">
                      {mod.name}: {mod.option}
                      {mod.priceDelta > 0 && (
                        <span className="ml-1">
                          (+{formatPrice(mod.priceDelta)})
                        </span>
                      )}
                    </p>
                  ))}
                </div>
              )}

              {/* Item special instructions */}
              {item.specialInstructions && (
                <p className="ml-6 text-sm italic text-muted-foreground">
                  Note: {item.specialInstructions}
                </p>
              )}
            </div>
          ))}
        </div>

        <Separator />

        {/* Order special instructions */}
        {specialInstructions && (
          <>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Special Instructions
              </p>
              <p className="text-sm">{specialInstructions}</p>
            </div>
            <Separator />
          </>
        )}

        {/* Totals */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatPrice(tax)}</span>
          </div>
          {tip > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tip</span>
              <span>{formatPrice(tip)}</span>
            </div>
          )}
          {deliveryFee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery Fee</span>
              <span>{formatPrice(deliveryFee)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span className="text-primary">{formatPrice(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
