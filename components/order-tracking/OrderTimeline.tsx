'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Clock, ChefHat, Bell, Package, X } from 'lucide-react';

interface OrderTimelineProps {
  order: {
    status: string;
    createdAt: string;
    confirmedAt?: string;
    preparingAt?: string;
    readyAt?: string;
    completedAt?: string;
    cancelledAt?: string;
  };
}

interface TimelineStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  timestamp?: string;
  isActive: boolean;
  isCompleted: boolean;
  isCancelled?: boolean;
}

const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];

export function OrderTimeline({ order }: OrderTimelineProps) {
  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return undefined;
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const currentStatusIndex = STATUS_ORDER.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  const steps: TimelineStep[] = [
    {
      id: 'pending',
      label: 'Order Placed',
      icon: <Clock className="h-4 w-4" />,
      timestamp: formatTimestamp(order.createdAt),
      isActive: order.status === 'pending',
      isCompleted: currentStatusIndex > 0 || isCancelled,
    },
    {
      id: 'confirmed',
      label: 'Order Confirmed',
      icon: <Check className="h-4 w-4" />,
      timestamp: formatTimestamp(order.confirmedAt),
      isActive: order.status === 'confirmed',
      isCompleted: currentStatusIndex > 1,
    },
    {
      id: 'preparing',
      label: 'Preparing',
      icon: <ChefHat className="h-4 w-4" />,
      timestamp: formatTimestamp(order.preparingAt),
      isActive: order.status === 'preparing',
      isCompleted: currentStatusIndex > 2,
    },
    {
      id: 'ready',
      label: 'Ready for Pickup',
      icon: <Bell className="h-4 w-4" />,
      timestamp: formatTimestamp(order.readyAt),
      isActive: order.status === 'ready',
      isCompleted: currentStatusIndex > 3,
    },
    {
      id: 'completed',
      label: 'Completed',
      icon: <Package className="h-4 w-4" />,
      timestamp: formatTimestamp(order.completedAt),
      isActive: order.status === 'completed',
      isCompleted: order.status === 'completed',
    },
  ];

  // Add cancelled step if order was cancelled
  if (isCancelled) {
    steps.push({
      id: 'cancelled',
      label: 'Cancelled',
      icon: <X className="h-4 w-4" />,
      timestamp: formatTimestamp(order.cancelledAt),
      isActive: true,
      isCompleted: false,
      isCancelled: true,
    });
  }

  return (
    <Card className="border-(--color-border-subtle)">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-display">Order Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {steps.map((step, index) => (
            <div key={step.id} className="flex gap-4 pb-6 last:pb-0">
              {/* Timeline line */}
              <div className="relative flex flex-col items-center">
                {/* Step indicator */}
                <div
                  className={`
                    flex h-8 w-8 items-center justify-center rounded-full border-2
                    ${
                      step.isCancelled
                        ? 'border-red-500 bg-red-500 text-white'
                        : step.isCompleted
                        ? 'border-primary bg-primary text-white'
                        : step.isActive
                        ? 'border-primary bg-white dark:bg-card text-primary animate-pulse'
                        : 'border-muted bg-muted text-muted-foreground'
                    }
                  `}
                >
                  {step.icon}
                </div>
                {/* Connecting line */}
                {index < steps.length - 1 && (
                  <div
                    className={`
                      w-0.5 flex-1 mt-2
                      ${
                        step.isCompleted
                          ? 'bg-primary'
                          : 'bg-muted'
                      }
                    `}
                  />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 pt-1">
                <p
                  className={`
                    font-medium
                    ${
                      step.isCancelled
                        ? 'text-red-600 dark:text-red-400'
                        : step.isActive || step.isCompleted
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }
                  `}
                >
                  {step.label}
                </p>
                {step.timestamp && (
                  <p className="text-sm text-muted-foreground">{step.timestamp}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
