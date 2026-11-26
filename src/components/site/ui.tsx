import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const Container = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 ${className}`}>{children}</div>
);

export function SectionHead({ title, body, center = true }: { title: string; body?: string; center?: boolean }) {
  return (
    <div className={`mx-auto max-w-3xl ${center ? "text-center" : "mx-0 text-left"}`}>
      <h2 className="font-heading text-3xl font-medium tracking-tight text-forest sm:text-5xl sm:leading-[1.1]">{title}</h2>
      {body && <p className="mt-5 text-lg leading-relaxed text-ink-muted">{body}</p>}
    </div>
  );
}

export function Pill({ href, children, variant = "primary", external = false }: { href: string; children: React.ReactNode; variant?: "primary" | "light" | "outline" | "ghost"; external?: boolean }) {
  const styles = {
    primary: "bg-forest text-white hover:bg-forest-deep",
    light: "bg-white text-forest hover:bg-cream",
    outline: "border border-forest/30 text-forest hover:bg-white",
    ghost: "border border-white/40 text-white hover:bg-white/10",
  }[variant];
  const cls = `inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition ${styles}`;
  return external ? <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{children}</a> : <Link href={href} className={cls}>{children}</Link>;
}

export function CardLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:gap-2.5 transition-all">{children} <ArrowRight size={15} /></Link>;
}

export function FinalCta({ title = "Build the assistant your customers deserve.", body = "Create your workspace, add what your business knows, and publish your first assistant." }: { title?: string; body?: string }) {
  return (
    <Container className="py-20">
      <div className="rounded-[2rem] bg-forest px-6 py-16 text-center sm:px-12">
        <h2 className="mx-auto max-w-3xl font-heading text-3xl font-medium tracking-tight text-white sm:text-5xl sm:leading-[1.1]">{title}</h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-sage">{body}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3"><Pill href="/signup" variant="light">Build Your Assistant</Pill><Pill href="/platform" variant="ghost">Explore Platform</Pill></div>
      </div>
    </Container>
  );
}

export function SiblingLinks({ current }: { current: "platform" | "solutions" | "features" }) {
  const all = [["platform", "Platform", "/platform"], ["solutions", "Solutions", "/solutions"], ["features", "Features", "/features"]] as const;
  return (
    <Container className="pb-4">
      <div className="flex flex-wrap items-center justify-center gap-3 border-t border-line pt-10">
        <span className="text-sm text-ink-muted">Keep exploring</span>
        {all.filter(([k]) => k !== current).map(([k, label, href]) => <Pill key={k} href={href} variant="outline">{label}</Pill>)}
        <Pill href="/pricing" variant="outline">Pricing</Pill>
      </div>
    </Container>
  );
}
