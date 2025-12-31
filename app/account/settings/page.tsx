'use client';

import { NotificationSettings } from '@/components/account';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User, Shield, Trash2 } from 'lucide-react';

// Check if Clerk is available
const isClerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

// Dynamically import Clerk component
let UserProfile: React.ComponentType<{ appearance?: object }> | null = null;
if (isClerkConfigured) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  UserProfile = require('@clerk/nextjs').UserProfile;
}

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences
        </p>
      </div>

      {/* Profile Section */}
      <Card className="border-[var(--color-border-subtle)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>
            Manage your personal information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isClerkConfigured && UserProfile ? (
            <UserProfile
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'shadow-none border-0 p-0',
                  navbar: 'hidden',
                  pageScrollBox: 'p-0',
                },
              }}
            />
          ) : (
            <p className="text-muted-foreground">
              Profile management is not available. Please configure authentication to manage your profile.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <NotificationSettings />

      {/* Security Section */}
      <Card className="border-[var(--color-border-subtle)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Password</p>
              <p className="text-sm text-muted-foreground">
                Change your account password
              </p>
            </div>
            <Button variant="outline" size="sm" disabled={!isClerkConfigured}>
              Change Password
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security
              </p>
            </div>
            <Button variant="outline" size="sm" disabled={!isClerkConfigured}>
              Enable 2FA
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400 font-display">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
