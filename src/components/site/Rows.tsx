import { Check } from "lucide-react";

export function FeatureRow({ id, title, body, bullets }: { id?: string; title: string; body: string; bullets?: string[] }) {
  return (
    <div id={id} className="grid scroll-mt-24 grid-cols-1 gap-6 rounded-[2rem] bg-white p-7 sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
      <h3 className="font-heading text-2xl font-medium tracking-tight text-forest sm:text-4xl sm:leading-tight">{title}</h3>
      <div>
        <p className="text-lg leading-relaxed text-ink-muted">{body}</p>
        {!!bullets?.length && <ul className="mt-5 space-y-2.5">{bullets.map((b) => <li key={b} className="flex items-start gap-3 text-ink"><Check size={18} className="mt-1 shrink-0 text-success" />{b}</li>)}</ul>}
      </div>
    </div>
  );
}

export function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.5rem] bg-white p-6">
      <h3 className="font-heading text-lg font-semibold text-forest">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
    </div>
  );
}

export function PageHero({ eyebrow, title, body, children }: { eyebrow: string; title: string; body: string; children?: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-5xl px-4 pb-14 pt-16 text-center sm:px-6 sm:pb-20 sm:pt-24">
      <p className="text-sm font-semibold uppercase tracking-widest text-ink-muted">{eyebrow}</p>
      <h1 className="mt-5 font-heading text-4xl font-medium leading-[1.05] tracking-tight text-forest sm:text-6xl">{title}</h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">{body}</p>
      {children && <div className="mt-8 flex flex-wrap justify-center gap-3">{children}</div>}
    </section>
  );
}
