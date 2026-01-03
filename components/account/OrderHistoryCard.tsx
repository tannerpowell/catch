'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, RefreshCw, ExternalLink } from 'lucide-react';

interface OrderHistoryCardProps {
  order: {
    _id: string;
    orderNumber: string;
    status: string;
    orderType: string;
    total: number;
    createdAt: string;
    locationName: string;
    itemCount: number;
    itemSummary: Array<{
      _key: string;
      name: string;
      quantity: number;
    }>;
  };
  onReorder?: (orderId: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  confirmed: { label: 'Confirmed', variant: 'default' },
  preparing: { label: 'Preparing', variant: 'default' },
  ready: { label: 'Ready', variant: 'default' },
  completed: { label: 'Completed', variant: 'outline' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

export function OrderHistoryCard({ order, onReorder }: OrderHistoryCardProps) {
  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const isActive = ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const itemSummaryText = order.itemSummary
    .map((item) => `${item.quantity}x ${item.name}`)
    .join(', ');
  const hasMoreItems = order.itemCount > 3;

  return (
    <Card className="border-(--color-border-subtle) hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          {/* Order info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <span className="font-display font-semibold">
                #{order.orderNumber}
              </span>
              <Badge variant={statusConfig.variant}>
                {statusConfig.label}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-1">
              {itemSummaryText}
              {hasMoreItems && ` +${order.itemCount - 3} more`}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {order.locationName}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(order.createdAt)}
              </span>
            </div>
          </div>

          {/* Price and actions */}
          <div className="flex sm:flex-col items-center sm:items-end gap-3">
            <span className="font-semibold text-lg">
              {formatPrice(order.total)}
            </span>

            <div className="flex gap-2">
              {isActive ? (
                <Button size="sm" asChild>
                  <Link href={`/orders/${order.orderNumber}`}>
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Track
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                  >
                    <Link href={`/orders/${order.orderNumber}`}>
                      View
                    </Link>
                  </Button>
                  {order.status === 'completed' && onReorder && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => onReorder(order._id)}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Reorder
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
