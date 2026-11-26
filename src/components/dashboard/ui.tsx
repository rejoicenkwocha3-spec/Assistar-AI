import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-forest sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export const Page = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
);

export const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-xl border border-line bg-white p-5 shadow-card ${className}`}>{children}</div>
);

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-2 text-3xl font-extrabold tracking-tight text-forest">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </Card>
  );
}

export function EmptyState({ title, body, href, cta }: { title: string; body: string; href?: string; cta?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-white px-6 py-10 text-center">
      <p className="font-semibold text-forest">{title}</p>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-muted">{body}</p>
      {href && cta && <Link href={href} className="mt-4 inline-flex rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white hover:bg-forest-deep">{cta}</Link>}
    </div>
  );
}

const TONES: Record<string, string> = {
  published: "bg-success/15 text-success", resolved: "bg-success/15 text-success", ready: "bg-success/15 text-success", connected: "bg-success/15 text-success", active: "bg-success/15 text-success", succeeded: "bg-success/15 text-success", pass: "bg-success/15 text-success",
  draft: "bg-surface text-ink-muted", processing: "bg-amber-100 text-amber-800", pending: "bg-amber-100 text-amber-800", pending_approval: "bg-amber-100 text-amber-800", open: "bg-sky-100 text-sky-800",
  paused: "bg-amber-100 text-amber-800", escalated: "bg-red-100 text-red-700", failed: "bg-red-100 text-red-700", fail: "bg-red-100 text-red-700", error: "bg-red-100 text-red-700", rejected: "bg-red-100 text-red-700",
  disconnected: "bg-surface text-ink-muted", cancelled: "bg-surface text-ink-muted", past_due: "bg-red-100 text-red-700",
};
export const Badge = ({ value }: { value: string }) => (
  <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${TONES[value] ?? "bg-surface text-ink-muted"}`}>{value.replace(/_/g, " ")}</span>
);

export function ConfigBanner({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" className="mb-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <AlertTriangle size={18} className="mt-0.5 shrink-0" /> <div>{children}</div>
    </div>
  );
}

export const timeAgo = (iso: string) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};
