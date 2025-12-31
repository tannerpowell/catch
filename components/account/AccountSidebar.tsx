'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Receipt, Settings, User, LogOut } from 'lucide-react';
import { useClerk } from '@clerk/nextjs';

const navigation = [
  {
    name: 'Order History',
    href: '/account/orders' as const,
    icon: Receipt,
  },
  {
    name: 'Settings',
    href: '/account/settings' as const,
    icon: Settings,
  },
] as const;

export function AccountSidebar() {
  const pathname = usePathname();
  const { signOut } = useClerk();

  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">My Account</p>
            <p className="text-sm text-muted-foreground">Manage your orders</p>
          </div>
        </div>
      </div>

      <Separator />

      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <Separator />

      <div className="p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={() => signOut({ redirectUrl: '/' })}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
