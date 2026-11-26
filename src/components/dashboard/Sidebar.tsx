"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { NAV } from "./nav";
import { switchOrganization } from "@/app/dashboard/actions";

type Org = { id: string; name: string; role: string };

export function Sidebar({ orgs, activeOrgId, userName, role, children }: {
  orgs: Org[]; activeOrgId: string; userName: string; role: string; children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => { try { setCollapsed(localStorage.getItem("assistar_nav") === "1"); } catch {} }, []);
  useEffect(() => setOpen(false), [pathname]);
  const toggle = () => setCollapsed((c) => { try { localStorage.setItem("assistar_nav", c ? "0" : "1"); } catch {} return !c; });

  const isActive = (href: string) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href));

  const nav = (compact: boolean) => (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3" aria-label="Dashboard">
      {NAV.map(({ label, href, icon: Icon }) => (
        <Link key={href} href={href} title={compact ? label : undefined} aria-current={isActive(href) ? "page" : undefined}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${isActive(href) ? "bg-forest text-white" : "text-ink hover:bg-surface"} ${compact ? "justify-center px-0" : ""}`}>
          <Icon size={18} className="shrink-0" />
          {!compact && <span className="truncate">{label}</span>}
        </Link>
      ))}
    </nav>
  );

  const footer = (compact: boolean) => (
    <div className="border-t border-line p-3">
      {!compact && (
        <div className="mb-2 px-1">
          <p className="truncate text-sm font-semibold text-ink">{userName}</p>
          <p className="text-xs capitalize text-ink-muted">{role}</p>
        </div>
      )}
      <form action="/auth/signout" method="post">
        <button type="submit" title="Log out" className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-surface ${compact ? "justify-center px-0" : ""}`}>
          <LogOut size={16} /> {!compact && "Log out"}
        </button>
      </form>
    </div>
  );

  const orgSwitcher = orgs.length > 1 && (
    <form action={switchOrganization} className="px-3 pt-3">
      <label className="sr-only" htmlFor="org">Workspace</label>
      <select id="org" name="orgId" defaultValue={activeOrgId} onChange={(e) => e.currentTarget.form?.requestSubmit()} className="input py-2 text-xs">
        {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
    </form>
  );

  return (
    <div className="min-h-screen bg-surface lg:flex">
      {/* Desktop */}
      <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-white transition-[width] lg:flex ${collapsed ? "w-[72px]" : "w-64"}`}>
        <div className={`flex h-16 items-center border-b border-line ${collapsed ? "justify-center" : "justify-between px-4"}`}>
          {!collapsed && <Link href="/dashboard"><Logo /></Link>}
          <button onClick={toggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="rounded-lg p-2 text-ink-muted hover:bg-surface">
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
        {!collapsed && orgSwitcher}
        {nav(collapsed)}
        {footer(collapsed)}
      </aside>

      {/* Mobile */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white px-4 lg:hidden">
        <Link href="/dashboard"><Logo /></Link>
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-2 text-ink"><Menu size={22} /></button>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-forest-deep/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-white shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-line px-4">
              <Logo />
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-lg p-2"><X size={20} /></button>
            </div>
            {orgSwitcher}
            {nav(false)}
            {footer(false)}
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
