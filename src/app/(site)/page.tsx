import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PLANS } from "@/config/plans";
import { CardLink, Container, FinalCta, Pill, SectionHead } from "@/components/site/ui";
import { InfoCard } from "@/components/site/Rows";

const INDUSTRIES = ["Ecommerce", "Financial services", "Healthcare", "Telecommunications", "Retail", "Travel and hospitality", "SaaS companies", "Customer support teams", "Enterprise organizations"];

const FAQ = [
  ["What is Assistar AI?", "Assistar AI is a platform for building AI assistants that answer customer questions, hand difficult conversations to your team, and complete approved business tasks. You manage everything from one workspace."],
  ["Do I need to write code?", "No. You create an assistant from a template or from scratch, add your documents, set its tone and rules, test it, and publish it. Installing the website chat takes one line of code that you paste into your site."],
  ["Will the assistant make things up?", "Assistants are instructed to answer only from your knowledge base and the conversation. When nothing matches, they say they do not know and can hand the conversation to a person. Monitoring then shows you the gap so you can fill it."],
  ["Which AI models can I use?", "Assistar AI works with Anthropic and OpenAI models. You choose the provider and model for each assistant. Requests are made from our servers, so your provider keys are never exposed in a browser."],
  ["Which channels are supported?", "Website live chat works today. Email, WhatsApp, SMS and voice need provider credentials and approvals, and each one is shown as connected only after it has been set up and tested."],
  ["Can my team take over a conversation?", "Yes. When an assistant cannot resolve something, it transfers the conversation with a summary. Your team replies from a shared inbox, can assign it, add internal notes, and close it."],
  ["How does billing work?", "Plans are monthly subscriptions in US dollars, paid through Selar. A subscription is activated only after Selar confirms your payment to our server."],
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <Container className="pt-4 sm:pt-6">
        <section className="relative overflow-hidden rounded-[2rem] bg-forest-deep px-6 pb-10 pt-16 sm:px-12 sm:pb-14 sm:pt-24 lg:min-h-[560px]">
          <svg aria-hidden className="pointer-events-none absolute -right-24 -top-24 hidden h-[520px] w-[520px] opacity-[0.14] sm:block" viewBox="0 0 200 200" fill="none"><circle cx="100" cy="100" r="96" stroke="#A8BFA8" strokeWidth="1" /><circle cx="100" cy="100" r="70" stroke="#A8BFA8" strokeWidth="1" /><circle cx="100" cy="100" r="44" stroke="#C7DE72" strokeWidth="1" /><circle cx="100" cy="100" r="18" fill="#C7DE72" /></svg>
          <div className="relative lg:pt-24">
            <h1 className="max-w-3xl font-heading text-4xl font-medium leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">Meet the AI assistants that move your business forward.</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-sage">Build intelligent AI assistants that understand your customers, resolve requests, and automate business tasks across every conversation.</p>
            <div className="mt-9 flex flex-wrap gap-3"><Pill href="/signup" variant="light">Get Started</Pill><Pill href="/login" variant="ghost">Sign in</Pill></div>
          </div>
        </section>
      </Container>

      {/* Pillars */}
      <section className="py-20 sm:py-28">
        <Container>
          <SectionHead title="Meet Assistar AI" body="The platform for building, testing and running AI assistants for your customers." />
          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
            <InfoCard title="Intelligence" body="Assistants understand customer questions, your business information and the context of each conversation." />
            <InfoCard title="Automation" body="Assistants handle repetitive support work and complete approved tasks in your systems." />
            <InfoCard title="Experience" body="Customers get faster, more personal and more consistent answers, with a real person ready when it matters." />
          </div>
        </Container>
      </section>

      {/* Build and optimize */}
      <section className="pb-20 sm:pb-28">
        <Container>
          <SectionHead title="Build with confidence. Improve with evidence." />
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-[2rem] bg-surface p-8 sm:p-10"><h3 className="font-heading text-2xl font-semibold text-forest">Build</h3><p className="mt-3 leading-relaxed text-ink-muted">Start from a template for a common business need or create a custom assistant. Upload your documents, set the tone, and define when to hand off to your team. Every change is saved as a version, and nothing reaches customers until you publish.</p><div className="mt-5"><CardLink href="/features">See every feature</CardLink></div></div>
            <div className="rounded-[2rem] bg-surface p-8 sm:p-10"><h3 className="font-heading text-2xl font-semibold text-forest">Optimize</h3><p className="mt-3 leading-relaxed text-ink-muted">Monitoring surfaces unanswered questions, repeated complaints and escalation patterns from your real conversations, with clear recommendations for what to fix next.</p><div className="mt-5"><CardLink href="/platform">How the platform works</CardLink></div></div>
          </div>
        </Container>
      </section>

      {/* Improve */}
      <section className="pb-20 sm:pb-28">
        <Container>
          <SectionHead title="Use your conversations to improve your assistants" />
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard title="Testing" body="Run saved scenarios against any version and mark answers right or wrong before you publish." />
            <InfoCard title="Monitoring" body="Find the conversations that went badly and see why." />
            <InfoCard title="Knowledge" body="Upload PDF, Word, text and CSV files. Answers come from your content." />
            <InfoCard title="Visibility" body="Inspect which knowledge was used, which actions were requested, and how long each reply took." />
          </div>
        </Container>
      </section>

      {/* Outcomes */}
      <section className="pb-20 sm:pb-28">
        <Container>
          <SectionHead title="Turn conversations into outcomes" body="Assistants remember context, take approved actions, and bring in your team at the right moment." />
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard title="Customer context" body="Preferences, history and open issues carry from one conversation to the next." />
            <InfoCard title="Approved actions" body="Connect your systems through webhooks. Sensitive actions wait for a person to approve." />
            <InfoCard title="Human handoff" body="Transfers include a summary, so customers never repeat themselves." />
            <InfoCard title="Website chat" body="Install the widget with one line of code. Email, WhatsApp, SMS and voice follow as providers are connected." />
          </div>
        </Container>
      </section>

      {/* Trust */}
      <section className="pb-20 sm:pb-28">
        <Container>
          <div className="rounded-[2rem] bg-white px-6 py-14 sm:px-12">
            <SectionHead title="Trust and control" body="Security is part of how Assistar AI is built, not an add on." />
            <ul className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
              {["Every organization is isolated at the database level with row level security.", "AI provider keys are stored on the server and never reach a browser.", "Owners, admins, managers and agents each get only the access they need.", "Editing an assistant never changes what customers see until you publish.", "Sensitive actions require a person to approve them.", "Important changes are written to an audit log."].map((t) => (
                <li key={t} className="rounded-2xl bg-surface px-5 py-4 text-sm leading-relaxed text-ink">{t}</li>))}
            </ul>
          </div>
        </Container>
      </section>

      {/* Industries */}
      <section className="pb-20 sm:pb-28">
        <Container>
          <SectionHead title="Built for the way your industry talks to customers" />
          <div className="mt-10 flex flex-wrap justify-center gap-3">{INDUSTRIES.map((i) => <Link key={i} href="/solutions" className="rounded-full border border-line bg-white px-5 py-3 text-sm font-medium text-forest transition hover:border-forest">{i}</Link>)}</div>
          <p className="mt-8 text-center"><CardLink href="/solutions">Explore solutions</CardLink></p>
        </Container>
      </section>

      {/* Pricing preview */}
      <section className="pb-20 sm:pb-28">
        <Container>
          <SectionHead title="Simple monthly pricing" body="Three monthly plans, billed in US dollars. Cancel any time." />
          <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
            {PLANS.map((p) => (
              <div key={p.key} className="rounded-[1.5rem] border border-line bg-white p-7"><p className="font-heading text-lg font-semibold text-forest">{p.name}</p><p className="mt-3 font-heading text-5xl font-medium tracking-tight text-forest">${p.priceUsd}<span className="text-base font-medium text-ink-muted"> per month</span></p><p className="mt-3 text-sm text-ink-muted">{p.description}</p></div>))}
          </div>
          <p className="mt-8 text-center"><Pill href="/pricing" variant="outline">See pricing</Pill></p>
        </Container>
      </section>

      {/* FAQ */}
      <section className="pb-20 sm:pb-28">
        <Container className="max-w-3xl">
          <SectionHead title="Questions, answered" />
          <div className="mt-10 divide-y divide-line rounded-[1.5rem] border border-line bg-white">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group px-6 py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-forest">{q}<ArrowRight size={16} className="shrink-0 transition group-open:rotate-90" /></summary><p className="mt-3 leading-relaxed text-ink-muted">{a}</p></details>))}
          </div>
        </Container>
      </section>

      <FinalCta />
    </>
  );
}
