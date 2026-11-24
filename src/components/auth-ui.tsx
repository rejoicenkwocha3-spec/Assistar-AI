"use client";
import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-8 shadow-sm">
        <Link href="/" className="mb-6 block font-display text-lg font-extrabold text-navy">Onboard AI</Link>
        <h1 className="text-2xl font-bold text-navy">{title}</h1>
        <p className="mb-6 mt-1 text-sm text-muted">{subtitle}</p>
        {children}
      </div>
    </main>
  );
}

export function Field({ label, error, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      <input {...p} aria-invalid={!!error} className={`mt-1 block w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/30 ${error ? "border-red-400" : "border-line"}`} />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function PasswordField({ label, error, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const [show, setShow] = useState(false);
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      <div className="relative mt-1">
        <input {...p} type={show ? "text" : "password"} aria-invalid={!!error} className={`block w-full rounded-lg border px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-brand/30 ${error ? "border-red-400" : "border-line"}`} />
        <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 px-3 text-muted">
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function Notice({ kind, children }: { kind: "error" | "success"; children: React.ReactNode }) {
  const Icon = kind === "error" ? AlertCircle : CheckCircle2;
  return (
    <div role={kind === "error" ? "alert" : "status"} className={`mb-4 flex gap-2 rounded-lg p-3 text-sm ${kind === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
      <Icon size={18} className="mt-0.5 shrink-0" /><div>{children}</div>
    </div>
  );
}

export const SubmitButton = ({ loading, children }: { loading: boolean; children: React.ReactNode }) => (
  <button disabled={loading} className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white disabled:opacity-60">
    {loading ? "Please wait..." : children}
  </button>
);

export function friendlyAuthError(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "Incorrect email or password.";
  if (m.includes("email not confirmed")) return "Please verify your email first. Check your inbox for the confirmation link.";
  if (m.includes("already registered")) return "An account with this email already exists. Try logging in.";
  if (m.includes("rate limit")) return "Too many attempts. Please wait a few minutes and try again.";
  if (m.includes("fetch")) return "Cannot reach the server. Check your connection and try again.";
  return msg;
}
