import { ReactNode } from "react";
import { clsx } from "clsx";

export default function Section({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={clsx("py-12", className)}>
      <div className="container">
        {title && (
          <div className="mb-6 space-y-2">
            <h2 className="font-display text-4xl sm:text-5xl tracking-[0.06em] text-ink">{title}</h2>
            <div className="h-[2px] w-16 bg-[color:var(--color-brand-primary)]" />
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
