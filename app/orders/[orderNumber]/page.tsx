'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { OrderStatusCard } from '@/components/order-tracking/OrderStatusCard';
import { OrderTimeline } from '@/components/order-tracking/OrderTimeline';
import { OrderItemsList } from '@/components/order-tracking/OrderItemsList';
import { useOrderPolling } from '@/components/order-tracking/OrderPolling';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  orderType: string;
  location: {
    name: string;
    address: string;
    phone: string;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
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
  }>;
  subtotal: number;
  tax: number;
  tip?: number;
  deliveryFee?: number;
  total: number;
  specialInstructions?: string;
  scheduledFor?: string;
  estimatedReadyTime?: string;
  createdAt: string;
  confirmedAt?: string;
  preparingAt?: string;
  readyAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

interface ApiResponse {
  order: Order;
  _meta: {
    fetchedAt: string;
    suggestedPollInterval: number;
  };
}

function OrderTrackingContent() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [pollInterval, setPollInterval] = useState(30000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleOrderUpdate = useCallback((updatedOrder: unknown) => {
    setOrder(updatedOrder as Order);
  }, []);

  const handlePollingError = useCallback((err: Error) => {
    console.error('Polling error:', err);
    // Don't show error for polling failures - just log them
  }, []);

  const { isPolling, lastFetch, manualRefresh } = useOrderPolling({
    orderNumber,
    currentStatus: order?.status || '',
    suggestedInterval: pollInterval,
    onUpdate: handleOrderUpdate,
    onError: handlePollingError,
  });

  // Initial fetch
  useEffect(() => {
    async function fetchOrder() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/orders/${orderNumber}`);
        const data = await response.json();

        if (!response.ok) {
          if (response.status === 404) {
            setError('Order not found. Please check your order number and try again.');
          } else if (response.status === 400) {
            setError('Invalid order number format. Order numbers look like ORD-20250123-ABC123.');
          } else {
            setError(data.error || 'Failed to load order');
          }
          return;
        }

        const apiResponse = data as ApiResponse;
        setOrder(apiResponse.order);
        setPollInterval(apiResponse._meta.suggestedPollInterval);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Unable to connect. Please check your internet connection.');
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderNumber]);

  if (loading) {
    return <OrderTrackingSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl mx-auto px-4 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to menu
          </Link>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>

          <div className="mt-6 text-center">
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to menu
          </Link>

          <div className="flex items-center gap-2">
            {isPolling && (
              <span className="text-xs text-muted-foreground">
                Auto-updating
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={manualRefresh}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Last updated indicator */}
        {lastFetch && (
          <p className="text-xs text-muted-foreground text-right mb-4">
            Last updated: {lastFetch.toLocaleTimeString()}
          </p>
        )}

        {/* Order cards */}
        <div className="space-y-6">
          <OrderStatusCard order={order} />
          <OrderTimeline order={order} />
          <OrderItemsList
            items={order.items}
            subtotal={order.subtotal}
            tax={order.tax}
            tip={order.tip}
            deliveryFee={order.deliveryFee}
            total={order.total}
            specialInstructions={order.specialInstructions}
          />
        </div>

        {/* Help section */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Questions about your order?</p>
          <p>
            Call{' '}
            <a
              href={`tel:${order.location.phone}`}
              className="text-primary hover:underline"
            >
              {order.location.phone}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function OrderTrackingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>

        <div className="space-y-6">
          {/* Status card skeleton */}
          <div className="border rounded-lg p-6 space-y-4">
            <div className="flex justify-between">
              <div>
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-6 w-40" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-2 w-full" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>

          {/* Timeline skeleton */}
          <div className="border rounded-lg p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Items skeleton */}
          <div className="border rounded-lg p-6">
            <Skeleton className="h-6 w-28 mb-4" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between">
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderTrackingPage() {
  return <OrderTrackingContent />;
}
