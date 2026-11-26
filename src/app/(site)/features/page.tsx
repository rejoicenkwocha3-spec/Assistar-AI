import type { Metadata } from "next";
import { Container, FinalCta, Pill, SiblingLinks } from "@/components/site/ui";
import { PageHero } from "@/components/site/Rows";
import { ActionCard, AnalyticsCard, BuilderCard, ChannelsCard, ContextCard, HandoffCard, InboxCard, IntegrationsCard, KnowledgeCard, MonitorCard, SecurityCard, TeamCard, TestingCard, WidgetCard } from "@/components/site/Visuals";

export const metadata: Metadata = { title: "Features | Assistar AI", description: "Everything in Assistar AI: agent builder, studio, widget, knowledge base, handoff, actions, testing, analytics and more." };

const FEATURES = [
  { t: "AI Agent Builder", d: "Create an assistant from a template or from scratch. Name it, describe its job, set its tone, and add the rules it must follow. No programming needed.", v: BuilderCard },
  { t: "Agent Studio", d: "A focused workspace for instructions, personality, guardrails and model choice. Every save becomes a version, and you can roll back at any time.", v: BuilderCard },
  { t: "Website Chat Widget", d: "Add your logo, colors and welcome message, preview it, then paste one line of code on your site. Visitors talk to the published version of your assistant.", v: WidgetCard },
  { t: "Multichannel Support", d: "Website chat today. Email, WhatsApp, SMS and voice connect through provider credentials, and show as connected only after they pass a real test.", v: ChannelsCard },
  { t: "Knowledge Base", d: "Upload PDF, Word, text and CSV files. Content is processed, indexed and searched for every question, so answers come from your own information.", v: KnowledgeCard },
  { t: "Customer Memory", d: "Store preferences and open issues for each customer. Assistants use them to personalize replies, and you can remove anything at any time.", v: ContextCard },
  { t: "Human Handoff", d: "Assistants transfer conversations with a summary when they cannot resolve them. Your team assigns, replies, adds notes and closes from a shared inbox.", v: HandoffCard },
  { t: "Shared Inbox", d: "Every conversation with status filters, search, customer history and internal notes. AI and human replies appear in one thread.", v: InboxCard },
  { t: "AI Actions", d: "Define approved tasks that call your systems through webhooks. Inputs are validated, every run is logged, and sensitive actions wait for approval.", v: ActionCard },
  { t: "Agent Testing", d: "Save scenarios, run them against any version, and mark answers correct or incorrect. Changes are never published without your approval.", v: TestingCard },
  { t: "Conversation Analytics", d: "Volume, resolution, escalations, response time and satisfaction, calculated from your own conversations over 7, 30 or 90 days.", v: AnalyticsCard },
  { t: "Monitoring", d: "Find unanswered questions, repeated complaints, failed actions and slow replies, with recommendations that point to what to improve next.", v: MonitorCard },
  { t: "Team Collaboration", d: "Invite colleagues with owner, admin, manager or agent roles. Assign conversations and see who is handling what.", v: TeamCard },
  { t: "Integrations", d: "Get Slack notifications when conversations need people, and connect your own systems through webhook actions.", v: IntegrationsCard },
  { t: "Security and Permissions", d: "Row level security isolates every organization. Roles limit what each person can do, and AI provider keys never leave the server.", v: SecurityCard },
];

export default function FeaturesPage() {
  return (
    <>
      <PageHero eyebrow="Features" title="Everything you need to run great AI customer service." body="From the first template to the last analytics chart, here is what Assistar AI gives your team."><Pill href="/signup">Build Your Assistant</Pill><Pill href="/platform" variant="outline">Explore Platform</Pill></PageHero>
      <Container>
        <div className="grid grid-cols-1 gap-6 pb-20 md:grid-cols-2">
          {FEATURES.map(({ t, d, v: V }) => (
            <article key={t} className="flex min-w-0 flex-col rounded-[2rem] bg-white p-6 sm:p-8"><div className="rounded-[1.5rem] bg-surface p-4"><V /></div><h2 className="mt-6 font-heading text-2xl font-medium tracking-tight text-forest">{t}</h2><p className="mt-2 leading-relaxed text-ink-muted">{d}</p></article>))}
        </div>
      </Container>
      <SiblingLinks current="features" />
      <FinalCta />
    </>
  );
}
