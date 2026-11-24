"use client";
import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string };

export function Field({ label, error, className = "", ...rest }: Props) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <input id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-e` : undefined}
        className={`input ${error ? "input-error" : ""} ${className}`} {...rest} />
      {error && <p id={`${id}-e`} className="field-error">{error}</p>}
    </div>
  );
}

export function PasswordField({ label, error, ...rest }: Props) {
  const id = useId();
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="relative">
        <input id={id} type={show ? "text" : "password"} aria-invalid={!!error}
          aria-describedby={error ? `${id}-e` : undefined}
          className={`input pr-11 ${error ? "input-error" : ""}`} {...rest} />
        <button type="button" onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-muted hover:text-forest">
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <p id={`${id}-e`} className="field-error">{error}</p>}
    </div>
  );
}
