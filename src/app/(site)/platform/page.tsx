import type { Metadata } from "next";
import { Container, FinalCta, Pill, SectionHead, SiblingLinks } from "@/components/site/ui";
import { FeatureRow, PageHero } from "@/components/site/Rows";
import { ActionCard, AnalyticsCard, BuilderCard, ChannelsCard, ContextCard, DashboardPreview, HandoffCard, IntegrationsCard, KnowledgeCard, MonitorCard, SecurityCard, TestingCard } from "@/components/site/Visuals";

export const metadata: Metadata = { title: "Platform | Assistar AI", description: "One platform to build, test, run and improve AI assistants for customer conversations." };

const FLOW = [
  ["Knowledge", "Your documents and policies become the source of truth."],
  ["Assistant", "Instructions, tone and guardrails shape how it answers."],
  ["Channels", "Customers reach it on your website chat today."],
  ["Handoff", "Your team steps in with a full summary when needed."],
  ["Insight", "Analytics and monitoring show what to fix next."],
];

export default function PlatformPage() {
  return (
    <>
      <PageHero eyebrow="Platform" title="One platform for every customer conversation." body="Assistar AI brings your assistants, knowledge, conversations, team and insights into a single workspace, so each part makes the others better."><Pill href="/signup">Build Your Assistant</Pill><Pill href="/features" variant="outline">See features</Pill></PageHero>

      <Container><DashboardPreview /></Container>

      <section className="py-20 sm:py-28">
        <Container>
          <SectionHead title="How the pieces work together" body="Every module shares the same data, so improving one improves the whole." />
          <ol className="mt-12 grid gap-4 md:grid-cols-5">
            {FLOW.map(([t, d], i) => (<li key={t} className="rounded-2xl border border-line bg-white p-5"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-sm font-bold text-white">{i + 1}</span><p className="mt-4 font-heading font-semibold text-forest">{t}</p><p className="mt-1 text-sm leading-relaxed text-ink-muted">{d}</p></li>))}
          </ol>
        </Container>
      </section>

      <Container className="space-y-20 pb-24 sm:space-y-28">
        <FeatureRow id="studio" title="Agent Studio and Agent Builder" body="Create an assistant from a template or from scratch, then refine it in a dedicated workspace. Every save becomes a version you can compare and roll back." bullets={["Ten ready made templates for common business needs", "Instructions, personality, tone, guardrails and model choice", "Publishing is a deliberate step, never automatic"]} visual={<BuilderCard />} />
        <FeatureRow id="knowledge" reverse title="Knowledge Base" body="Upload the documents your business already has. Assistar AI reads and indexes them, then retrieves the relevant passages for every question so answers reflect your real policies." bullets={["PDF, Word, text, Markdown and CSV files", "Processing status, previews, search and deletion", "No matching knowledge means an honest answer, not a guess"]} visual={<KnowledgeCard />} />
        <FeatureRow id="context" title="Customer Context" body="Assistants can use what you know about a customer: preferences, open issues and earlier conversations, so people are not asked the same thing twice." bullets={["Notes and preferences stored per customer", "Conversation history in one place", "You control what is stored and can remove it"]} visual={<ContextCard />} />
        <FeatureRow id="channels" reverse title="Multichannel Communication" body="Website chat is ready today with a widget you brand and install in minutes. Email, WhatsApp, SMS and voice connect through provider credentials, and appear as connected only after a real test." bullets={["Customizable website chat widget", "One inbox for every conversation", "Clear setup requirements for each additional channel"]} visual={<ChannelsCard />} />
        <FeatureRow id="handoff" title="Human Handoff" body="When an assistant cannot resolve something, it transfers the conversation with a summary. Your team replies from a shared inbox, assigns work, and keeps internal notes." bullets={["Escalation rules you define", "Assignment, status and internal notes", "Transfer history for every conversation"]} visual={<HandoffCard />} />
        <FeatureRow id="actions" reverse title="AI Actions" body="Let assistants request approved tasks in your systems through webhooks you control. Each action has defined inputs, a log of every run, and optional human approval." bullets={["Validated inputs and clear error handling", "Approval required for sensitive actions", "Full execution history"]} visual={<ActionCard />} />
        <FeatureRow id="testing" title="Testing and Simulation" body="Save the questions your customers really ask and run them against any version of an assistant. Mark answers correct or incorrect before anything reaches a customer." bullets={["Saved scenarios, including hard questions", "Compare behavior across versions", "Test conversations are never published"]} visual={<TestingCard />} />
        <FeatureRow id="monitoring" reverse title="Monitoring" body="See where assistants fall short: unanswered questions, repeated complaints, failed actions and slow replies, with recommendations drawn from your own conversations." bullets={["Knowledge gaps from real questions", "Escalation patterns and reasons", "Errors and response times"]} visual={<MonitorCard />} />
        <FeatureRow id="analytics" title="Analytics" body="Understand volume, resolution, escalations, response time and satisfaction. Every number is calculated from your own database, never from sample data." bullets={["Conversation trends over 7, 30 and 90 days", "Performance by channel and by agent", "Common customer questions"]} visual={<AnalyticsCard />} />
        <FeatureRow id="security" reverse title="Security and permissions" body="Each organization is isolated at the database level. Roles decide who can build, who can reply, and who can manage billing and people." bullets={["Row level security on every table", "Owner, admin, manager and agent roles", "Provider keys kept on the server"]} visual={<SecurityCard />} />
        <FeatureRow id="integrations" title="Integrations" body="Connect Slack to be notified when conversations need people. Use webhook actions to reach your order, booking and CRM systems. More native integrations arrive as they are built and tested." bullets={["Slack notifications for handoffs", "Webhook actions for your own systems", "Nothing shows as connected until it works"]} visual={<IntegrationsCard />} />
      </Container>

      <SiblingLinks current="platform" />
      <FinalCta />
    </>
  );
}
