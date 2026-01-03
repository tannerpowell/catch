'use client';

export interface AuthPageLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

/**
 * Shared layout wrapper for auth pages.
 * Provides consistent centering and header styling.
 */
export function AuthPageLayout({ title, description, children }: AuthPageLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-(--color-surface-page) py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-(--color-text-primary) mb-2">
            {title}
          </h1>
          <p className="text-(--color-text-secondary)">
            {description}
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
