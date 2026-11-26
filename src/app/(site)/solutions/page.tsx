import type { Metadata } from "next";
import { Container, FinalCta, Pill, SiblingLinks } from "@/components/site/ui";
import { PageHero } from "@/components/site/Rows";

export const metadata: Metadata = { title: "Solutions | Assistar AI", description: "How Assistar AI helps ecommerce, finance, healthcare, telecom, retail, travel, SaaS, support teams and enterprises." };

const SOLUTIONS = [
  { id: "ecommerce", name: "Ecommerce", problem: "Shoppers ask the same questions about orders, shipping and returns all day, and slow replies cost sales.", help: ["Answer order, delivery and return questions from your policies", "Recommend products from your catalogue", "Hand refund disputes and damaged goods to your team with a summary"] },
  { id: "financial", name: "Financial Services", problem: "Customers need quick answers about accounts, fees and processes, while sensitive requests need careful handling.", help: ["Explain products, fees and procedures from approved documents", "Require a person to approve any account related action", "Escalate complaints and anything unclear immediately"], note: "Assistar AI is a customer conversation tool. Your organization remains responsible for meeting its own regulatory obligations." },
  { id: "healthcare", name: "Healthcare", problem: "Front desks spend hours on opening hours, services and booking questions that do not need a clinician.", help: ["Share practice information, services and locations", "Guide people to book or change appointments", "Send any message about symptoms or emergencies straight to your team"], note: "Assistants built for healthcare should provide information only. They must not give medical advice, and Assistar AI makes no claims about healthcare regulation." },
  { id: "telecom", name: "Telecommunications", problem: "Plan questions, billing queries and connection problems create heavy, repetitive support demand.", help: ["Explain plans, charges and coverage from your documents", "Walk customers through common troubleshooting steps", "Escalate outages and unresolved faults to technical staff"] },
  { id: "retail", name: "Retail", problem: "Store and online customers want stock, hours, returns and loyalty answers at any time of day.", help: ["Answer store, stock policy and returns questions", "Keep answers consistent across branches", "Surface the questions customers ask most so you can improve your content"] },
  { id: "travel", name: "Travel and Hospitality", problem: "Guests and travellers need fast answers about bookings, changes and local details, often outside office hours.", help: ["Answer booking, baggage and change policy questions", "Collect details for changes and pass them to your team", "Escalate disruptions close to travel dates"] },
  { id: "saas", name: "SaaS Companies", problem: "Support teams repeat the same setup, billing and troubleshooting answers while product questions pile up.", help: ["Answer product and billing questions from your help center", "Troubleshoot step by step and escalate with full context", "Show which questions your documentation fails to answer"] },
  { id: "support", name: "Customer Support Teams", problem: "Agents are buried in repetitive tickets and lose context when conversations change hands.", help: ["Resolve routine questions so people focus on complex ones", "Shared inbox with assignment, notes and status", "Handoffs arrive with a summary, so customers never repeat themselves"] },
  { id: "enterprise", name: "Enterprise Organizations", problem: "Large organizations need consistent answers, clear permissions and an audit trail across teams.", help: ["Roles for owners, admins, managers and agents", "Versioned assistants with approval before publishing", "Audit log of important changes and organization level data isolation"], note: "Assistar AI does not currently claim formal security certifications." },
];

export default function SolutionsPage() {
  return (
    <>
      <PageHero eyebrow="Solutions" title="Better conversations for every kind of business." body="Whatever you sell, customers want fast, accurate answers and a real person when it matters. Here is how Assistar AI helps in each industry."><Pill href="/signup">Build Your Assistant</Pill><Pill href="/platform" variant="outline">Explore Platform</Pill></PageHero>
      <Container>
        <nav aria-label="Industries" className="flex flex-wrap justify-center gap-2 pb-12">{SOLUTIONS.map((s) => <a key={s.id} href={`#${s.id}`} className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-forest hover:border-forest">{s.name}</a>)}</nav>
        <div className="space-y-5 pb-20">
          {SOLUTIONS.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24 grid gap-8 rounded-[2rem] bg-white p-7 sm:p-10 lg:grid-cols-[0.8fr_1.2fr]">
              <div><h2 className="font-heading text-3xl font-medium tracking-tight text-forest">{s.name}</h2><p className="mt-4 text-sm font-semibold uppercase tracking-widest text-ink-muted">The problem</p><p className="mt-2 leading-relaxed text-ink">{s.problem}</p></div>
              <div><p className="text-sm font-semibold uppercase tracking-widest text-ink-muted">How Assistar AI helps</p>
                <ul className="mt-3 space-y-3">{s.help.map((h) => <li key={h} className="rounded-2xl bg-surface px-5 py-3.5 leading-relaxed">{h}</li>)}</ul>
                {s.note && <p className="mt-4 text-sm leading-relaxed text-ink-muted">{s.note}</p>}</div>
            </section>))}
        </div>
      </Container>
      <SiblingLinks current="solutions" />
      <FinalCta />
    </>
  );
}
