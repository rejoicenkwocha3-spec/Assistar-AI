"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";

const LINKS = [["Platform", "/platform"], ["Solutions", "/solutions"], ["Features", "/features"], ["Pricing", "/pricing"]] as const;

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Assistar AI home"><Logo /></Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map(([label, href]) => (
            <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-medium transition hover:bg-white ${pathname === href ? "bg-white text-forest" : "text-ink"}`}>{label}</Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="rounded-full px-4 py-2 text-sm font-medium text-ink hover:bg-white">Sign in</Link>
          <Link href="/signup" className="rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-forest-deep">Get Started</Link>
        </div>
        <button onClick={() => setOpen((o) => !o)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} className="rounded-lg p-2 text-ink md:hidden">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      {open && (
        <div className="border-t border-line bg-cream px-4 pb-5 pt-2 md:hidden">
          <nav className="flex flex-col" aria-label="Mobile">
            {LINKS.map(([label, href]) => <Link key={href} href={href} className="border-b border-line py-3.5 text-lg font-medium text-ink">{label}</Link>)}
          </nav>
          <div className="mt-5 flex flex-col gap-3">
            <Link href="/signup" className="rounded-full bg-forest py-3 text-center font-semibold text-white">Get Started</Link>
            <Link href="/login" className="rounded-full border border-forest/30 py-3 text-center font-semibold text-forest">Sign in</Link>
          </div>
        </div>
      )}
    </header>
  );
}
