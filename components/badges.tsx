import type { Badge } from "@/lib/types";

export function BadgePill({ label }: { label: Badge | string }) {
  return <span className="chip">{label}</span>;
}

export function BadgeList({ badges }: { badges?: (Badge | string)[] }) {
  if (!badges?.length) return null;
  return <div className="badge-stack">{badges.map((b, i) => <BadgePill key={i} label={b} />)}</div>;
}
