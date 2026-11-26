"use client";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { ActionState } from "@/lib/context";

export function Submit({ children, className = "btn-primary", pendingText }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending && <Loader2 size={15} className="animate-spin" />} {pending && pendingText ? pendingText : children}
    </button>
  );
}

export function ActionForm({ action, children, className = "", resetOnSuccess = false, encType }: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  children: React.ReactNode; className?: string; resetOnSuccess?: boolean; encType?: "multipart/form-data";
}) {
  const [state, formAction] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok && resetOnSuccess) ref.current?.reset(); }, [state, resetOnSuccess]);
  return (
    <form ref={ref} action={formAction} className={className} encType={encType}>
      {children}
      {state?.error && <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{state.error}</p>}
      {state?.ok && state.message && <p role="status" className="mt-3 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-forest">{state.message}</p>}
    </form>
  );
}

/** Small button posting a server action with hidden fields, e.g. delete or status change. */
export function MiniForm({ action, fields, children, className = "btn-secondary py-1.5 text-xs", confirm }: {
  action: (fd: FormData) => Promise<void>; fields: Record<string, string>; children: React.ReactNode; className?: string; confirm?: string;
}) {
  return (
    <form action={action} onSubmit={(e) => { if (confirm && !window.confirm(confirm)) e.preventDefault(); }} className="inline">
      {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <Submit className={className}>{children}</Submit>
    </form>
  );
}
