import Link from "next/link";
import { Logo } from "@/components/Logo";

export function AuthShell({ title, subtitle, children, footer }: {
  title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-cream px-4 py-8">
      <Link href="/" aria-label="Assistar AI home"><Logo /></Link>
      <div className="mt-8 w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-forest">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <p className="mt-6 text-sm text-ink-muted">{footer}</p>}
      <p className="mt-auto pt-10 text-xs text-ink-muted">© 2026 Assistar AI</p>
    </main>
  );
}

export function Alert({ kind, children }: { kind: "error" | "success" | "info"; children: React.ReactNode }) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-success/30 bg-success/10 text-forest",
    info: "border-line bg-surface text-ink",
  }[kind];
  return <div role={kind === "error" ? "alert" : "status"} className={`rounded-lg border px-3.5 py-3 text-sm ${styles}`}>{children}</div>;
}
