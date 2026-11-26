import type { Metadata } from "next";
import { PLANS } from "@/config/plans";
import { Container, FinalCta, Pill } from "@/components/site/ui";
import { PageHero } from "@/components/site/Rows";

export const metadata: Metadata = { title: "Pricing | Assistar AI", description: "Simple monthly plans for Assistar AI, billed in US dollars through Selar." };

const FAQ = [
  ["How am I billed?", "Each plan is a recurring monthly subscription in US dollars. You are charged every month, you receive an email before every charge, and you can cancel at any time."],
  ["When does my plan start?", "After you pay on Selar, Selar confirms the payment to Assistar AI and your subscription is activated. Use the same email at checkout that you used to create your account so the payment can be matched."],
  ["Where does checkout happen?", "Checkout opens on Selar in a new tab. Assistar AI never handles your card details."],
];

export default function PricingPage() {
  return (
    <>
      <PageHero eyebrow="Pricing" title="Simple monthly plans." body="Choose a plan, check out securely on Selar, and your subscription activates once your payment is confirmed." />
      <Container>
        <div className="mx-auto grid max-w-5xl gap-5 pb-8 md:grid-cols-3">
          {PLANS.map((p) => (
            <article key={p.key} className="flex flex-col rounded-[2rem] border border-line bg-white p-8">
              <h2 className="font-heading text-xl font-semibold text-forest">{p.name}</h2>
              <p className="mt-4 font-heading text-6xl font-medium tracking-tight text-forest">${p.priceUsd}</p>
              <p className="mt-1 text-sm text-ink-muted">per month, billed monthly in USD</p>
              <p className="mt-5 text-sm leading-relaxed text-ink-muted">{p.description}</p>
              {!!p.features.length && <ul className="mt-5 space-y-2 text-sm">{p.features.map((f) => <li key={f}>{f}</li>)}</ul>}
              <div className="mt-auto pt-8"><Pill href={p.checkoutUrl} external>Subscribe to {p.name}</Pill></div>
            </article>))}
        </div>
        <p className="mx-auto max-w-2xl pb-20 text-center text-sm text-ink-muted">Recurring payment. You will be charged every month, you will get an email before every charge, and you can cancel the subscription at any time.</p>
      </Container>
      <Container className="max-w-3xl pb-20">
        <div className="divide-y divide-line rounded-[1.5rem] border border-line bg-white">{FAQ.map(([q, a]) => <div key={q} className="px-6 py-5"><h3 className="font-medium text-forest">{q}</h3><p className="mt-2 leading-relaxed text-ink-muted">{a}</p></div>)}</div>
      </Container>
      <FinalCta />
    </>
  );
}
