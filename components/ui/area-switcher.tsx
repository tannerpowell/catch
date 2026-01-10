'use client';

import * as React from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  ChevronDown,
  LayoutDashboard,
  Tv,
  Printer,
  ChefHat,
  Store,
  ExternalLink,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AreaConfig {
  id: string;
  label: string;
  description: string;
  href: Route;
  icon: React.ElementType;
  external?: boolean;
}

const AREAS: AreaConfig[] = [
  {
    id: 'studio',
    label: 'Sanity Studio',
    description: 'Content management',
    href: '/studio' as Route,
    icon: LayoutDashboard,
  },
  {
    id: 'kitchen',
    label: 'Kitchen Display',
    description: 'Order management',
    href: '/kitchen' as Route,
    icon: ChefHat,
  },
  {
    id: 'tv-menu',
    label: 'TV Menu Display',
    description: 'In-store displays',
    href: '/tv-menu-display' as Route,
    icon: Tv,
  },
  {
    id: 'print-menu',
    label: 'Print Menus',
    description: 'PDF generation',
    href: '/print-menu' as Route,
    icon: Printer,
  },
  {
    id: 'site',
    label: 'Customer Site',
    description: 'Public website',
    href: '/' as Route,
    icon: Store,
  },
];

const AREA_BY_ID = new Map(AREAS.map((area) => [area.id, area]));

/**
 * Path prefixes ordered from most specific to least specific.
 *
 * ORDER MATTERS: More specific paths must come before less specific ones.
 * For example, '/tv-menu-display' must come before '/tv' to avoid
 * incorrect matches. Uses first-match semantics via startsWith().
 */
const PATH_TO_AREA: [string, string][] = [
  ['/tv-menu-display', 'tv-menu'],
  ['/print-menu', 'print-menu'],
  ['/studio', 'studio'],
  ['/kitchen', 'kitchen'],
];

// Validate ordering at module load time (dev only)
if (process.env.NODE_ENV === 'development') {
  for (let i = 1; i < PATH_TO_AREA.length; i++) {
    if (PATH_TO_AREA[i - 1][0].startsWith(PATH_TO_AREA[i][0])) {
      console.warn(
        `[AreaSwitcher] PATH_TO_AREA ordering issue: "${PATH_TO_AREA[i - 1][0]}" starts with "${PATH_TO_AREA[i][0]}" - more specific path should come first`
      );
    }
  }
}

function getCurrentArea(pathname: string): AreaConfig {
  for (const [prefix, areaId] of PATH_TO_AREA) {
    if (pathname.startsWith(prefix)) {
      const area = AREA_BY_ID.get(areaId);
      if (!area) {
        console.error(`[AreaSwitcher] Area not found for ID: ${areaId}`);
        return AREA_BY_ID.get('site') ?? AREAS[0];
      }
      return area;
    }
  }
  const siteArea = AREA_BY_ID.get('site');
  if (!siteArea) {
    console.error('[AreaSwitcher] Site area not found in AREAS array');
    return AREAS[0];
  }
  return siteArea;
}

interface AreaSwitcherProps {
  className?: string;
}

export function AreaSwitcher({ className }: AreaSwitcherProps) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const currentArea = React.useMemo(() => getCurrentArea(pathname), [pathname]);
  const CurrentIcon = currentArea.icon;

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            'group relative flex items-center gap-3 rounded-lg px-3 py-2',
            'bg-gradient-to-r from-tierra-reca/5 to-transparent',
            'hover:from-tierra-reca/10 hover:to-tierra-reca/5',
            'border border-tierra-reca/10 hover:border-tierra-reca/20',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-ocean-blue/50',
            className
          )}
        >
          {/* Icon circle */}
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ocean-blue to-ocean-blue/80 text-white shadow-sm">
            <CurrentIcon className="h-4 w-4" />
          </div>

          {/* Area info */}
          <div className="hidden flex-col items-start sm:flex">
            <span className="text-sm font-medium text-tierra-reca">
              {currentArea.label}
            </span>
            <span className="text-[10px] text-tierra-muted">
              {currentArea.description}
            </span>
          </div>

          {/* Chevron */}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-tierra-muted transition-transform duration-200',
              open && 'rotate-180'
            )}
          />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className={cn(
            'z-50 min-w-[240px] overflow-hidden rounded-xl',
            'bg-white/95 backdrop-blur-xl',
            'border border-tierra-reca/10 shadow-xl shadow-tierra-reca/10',
            // Animation
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2',
            'data-[side=top]:slide-in-from-bottom-2'
          )}
        >
          {/* Header */}
          <div className="border-b border-tierra-reca/10 px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-wider text-tierra-muted">
              Switch Area
            </p>
          </div>

          {/* Area options */}
          <div className="p-1">
            {AREAS.map((area) => {
              const Icon = area.icon;
              const isActive = area.id === currentArea.id;

              return (
                <DropdownMenu.Item key={area.id} asChild>
                  <Link
                    href={area.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5',
                      'outline-none transition-colors',
                      isActive
                        ? 'bg-ocean-blue/10 text-ocean-blue'
                        : 'text-tierra-reca hover:bg-tierra-reca/5'
                    )}
                    onClick={() => setOpen(false)}
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg',
                        isActive
                          ? 'bg-ocean-blue text-white'
                          : 'bg-tierra-reca/5 text-tierra-secondary'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{area.label}</span>
                        {area.external && (
                          <ExternalLink className="h-3 w-3 text-tierra-muted" />
                        )}
                      </div>
                      <span className="text-xs text-tierra-muted">
                        {area.description}
                      </span>
                    </div>
                    {isActive && (
                      <Check className="h-4 w-4 text-ocean-blue" />
                    )}
                  </Link>
                </DropdownMenu.Item>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t border-tierra-reca/10 px-3 py-2">
            <p className="text-[10px] text-tierra-muted">
              The Catch Staff Tools
            </p>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
