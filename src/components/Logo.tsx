export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width="30" height="30" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="14" cy="13" r="6" fill="#123D32" />
        <circle cx="34" cy="11" r="6" fill="#A8BFA8" />
        <path d="M4 38c0-10 8-16 16-12l12 8c5 3 10 2 12-1-1 8-7 12-14 12-6 0-10-3-14-6-4-3-12-6-12-1z" fill="#123D32" />
        <circle cx="34" cy="27" r="9" fill="#A8BFA8" opacity=".85" />
      </svg>
      <span className="font-heading text-lg font-extrabold tracking-tight text-forest">
        Assistar <span className="text-sage">AI</span>
      </span>
    </span>
  );
}
