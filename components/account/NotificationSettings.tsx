'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, MessageSquare, Bell, Loader2, Check } from 'lucide-react';

interface NotificationPreferences {
  email: {
    orderConfirmation: boolean;
    orderReady: boolean;
    promotions: boolean;
  };
  sms: {
    orderConfirmation: boolean;
    orderReady: boolean;
    promotions: boolean;
  };
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  email: {
    orderConfirmation: true,
    orderReady: true,
    promotions: false,
  },
  sms: {
    orderConfirmation: true,
    orderReady: true,
    promotions: false,
  },
};

interface ToggleRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function ToggleRow({ icon, title, description, checked, onChange, disabled }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between py-3">
      <div className="flex gap-3">
        <div className="mt-0.5 text-muted-foreground">{icon}</div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
          transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
          disabled:cursor-not-allowed disabled:opacity-50
          ${checked ? 'bg-primary' : 'bg-muted'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg
            ring-0 transition-transform
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
}

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPreferences() {
      try {
        const response = await fetch('/api/notifications/preferences');
        if (response.ok) {
          const data = await response.json();
          setPreferences(data.preferences);
        }
      } catch (err) {
        console.error('Error fetching preferences:', err);
        // Use defaults if fetch fails
      } finally {
        setLoading(false);
      }
    }

    fetchPreferences();
  }, []);

  const updatePreference = (
    channel: 'email' | 'sms',
    key: keyof NotificationPreferences['email'],
    value: boolean
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [key]: value,
      },
    }));
    setSaved(false);
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[var(--color-border-subtle)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Choose how you want to receive updates about your orders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Email notifications */}
        <div>
          <h3 className="flex items-center gap-2 font-medium mb-2">
            <Mail className="h-4 w-4" />
            Email Notifications
          </h3>
          <div className="divide-y">
            <ToggleRow
              icon={<Check className="h-4 w-4" />}
              title="Order Confirmation"
              description="Receive email when your order is confirmed"
              checked={preferences.email.orderConfirmation}
              onChange={(v) => updatePreference('email', 'orderConfirmation', v)}
            />
            <ToggleRow
              icon={<Bell className="h-4 w-4" />}
              title="Order Ready"
              description="Get notified when your order is ready for pickup"
              checked={preferences.email.orderReady}
              onChange={(v) => updatePreference('email', 'orderReady', v)}
            />
            <ToggleRow
              icon={<Mail className="h-4 w-4" />}
              title="Promotions"
              description="Receive special offers and promotions"
              checked={preferences.email.promotions}
              onChange={(v) => updatePreference('email', 'promotions', v)}
            />
          </div>
        </div>

        <Separator />

        {/* SMS notifications */}
        <div>
          <h3 className="flex items-center gap-2 font-medium mb-2">
            <MessageSquare className="h-4 w-4" />
            SMS Notifications
          </h3>
          <div className="divide-y">
            <ToggleRow
              icon={<Check className="h-4 w-4" />}
              title="Order Confirmation"
              description="Receive text when your order is confirmed"
              checked={preferences.sms.orderConfirmation}
              onChange={(v) => updatePreference('sms', 'orderConfirmation', v)}
            />
            <ToggleRow
              icon={<Bell className="h-4 w-4" />}
              title="Order Ready"
              description="Get a text when your order is ready for pickup"
              checked={preferences.sms.orderReady}
              onChange={(v) => updatePreference('sms', 'orderReady', v)}
            />
            <ToggleRow
              icon={<MessageSquare className="h-4 w-4" />}
              title="Promotions"
              description="Receive special offers via text"
              checked={preferences.sms.promotions}
              onChange={(v) => updatePreference('sms', 'promotions', v)}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={savePreferences} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Saved!
              </>
            ) : (
              'Save Preferences'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
