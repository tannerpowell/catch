'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin, Phone, Clock, Utensils } from 'lucide-react';

interface OrderStatusCardProps {
  order: {
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
    };
    estimatedReadyTime?: string;
    scheduledFor?: string;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; progress: number }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500', progress: 10 },
  confirmed: { label: 'Confirmed', color: 'bg-blue-500', progress: 25 },
  preparing: { label: 'Preparing', color: 'bg-orange-500', progress: 60 },
  ready: { label: 'Ready for Pickup', color: 'bg-green-500', progress: 90 },
  completed: { label: 'Completed', color: 'bg-gray-500', progress: 100 },
  cancelled: { label: 'Cancelled', color: 'bg-red-500', progress: 0 },
};

const ORDER_TYPE_LABELS: Record<string, string> = {
  pickup: 'Pickup',
  delivery: 'Delivery',
  'dine-in': 'Dine-In',
};

export function OrderStatusCard({ order }: OrderStatusCardProps) {
  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

  const formatTime = (isoString?: string) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const estimatedTime = formatTime(order.estimatedReadyTime);
  const scheduledTime = formatTime(order.scheduledFor);

  return (
    <Card className="border-[var(--color-border-subtle)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Order</p>
            <CardTitle className="text-xl font-display">
              #{order.orderNumber}
            </CardTitle>
          </div>
          <Badge
            variant="secondary"
            className={`${statusConfig.color} text-white px-3 py-1`}
          >
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <Progress value={statusConfig.progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Placed</span>
            <span>Confirmed</span>
            <span>Preparing</span>
            <span>Ready</span>
          </div>
        </div>

        {/* Order details */}
        <div className="grid gap-3 pt-2">
          {/* Customer */}
          <div className="flex items-center gap-2 text-sm">
            <Utensils className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">For:</span>
            <span className="font-medium">{order.customer.name}</span>
            <Badge variant="outline" className="ml-auto">
              {ORDER_TYPE_LABELS[order.orderType] || order.orderType}
            </Badge>
          </div>

          {/* Location */}
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">{order.location.name}</p>
              <p className="text-muted-foreground text-xs">{order.location.address}</p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a
              href={`tel:${order.location.phone}`}
              className="text-primary hover:underline"
            >
              {order.location.phone}
            </a>
          </div>

          {/* Estimated time */}
          {(estimatedTime || scheduledTime) && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {scheduledTime ? 'Scheduled for:' : 'Estimated ready:'}
              </span>
              <span className="font-medium text-primary">
                {scheduledTime || estimatedTime}
              </span>
            </div>
          )}
        </div>

        {/* Status-specific messages */}
        {order.status === 'ready' && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
            <p className="text-green-700 dark:text-green-300 font-medium">
              Your order is ready for pickup!
            </p>
            <p className="text-green-600 dark:text-green-400 text-sm">
              Please show this page at the counter
            </p>
          </div>
        )}

        {order.status === 'cancelled' && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
            <p className="text-red-700 dark:text-red-300 font-medium">
              This order has been cancelled
            </p>
            <p className="text-red-600 dark:text-red-400 text-sm">
              If you have questions, please contact the restaurant
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
