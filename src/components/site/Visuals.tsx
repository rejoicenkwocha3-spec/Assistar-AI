// Illustrative product visuals built from the real UI vocabulary. They contain sample text only:
// no metrics, no customer names, no invented results.
import { Bot, Check, FlaskConical, Library, MessageSquare, PlugZap, Radio, Sparkles, Users, Workflow, Activity, BarChart3, Code2, ShieldCheck, UserRound } from "lucide-react";

const Frame = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-line bg-white shadow-card ${className}`}>{children}</div>
);
const Tag = ({ children }: { children: React.ReactNode }) => <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-forest">{children}</span>;
const Label = ({ children }: { children: React.ReactNode }) => <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{children}</p>;

export function ChatSample({ className = "" }: { className?: string }) {
  return (
    <Frame className={`p-5 ${className}`}>
      <div className="mb-4 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-sm font-bold text-white">A</div><div><p className="text-sm font-semibold text-forest">Support assistant</p><p className="text-xs text-ink-muted">Sample conversation</p></div></div>
      <div className="space-y-3 text-sm">
        <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-forest px-4 py-2.5 text-white">Can I return an item I bought three weeks ago?</p>
        <p className="w-fit max-w-[90%] rounded-2xl rounded-bl-sm bg-surface px-4 py-2.5">Yes. Items can be returned within 30 days of delivery for a full refund. Would you like me to start the return?</p>
        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-muted"><Library size={12} /> Answered from: Returns policy</p>
      </div>
    </Frame>
  );
}

export function DashboardPreview() {
  const groups = [["Analyze", [[BarChart3, "Analytics"], [MessageSquare, "Conversations"], [Activity, "Monitoring"]]], ["Build", [[Bot, "AI Agents"], [Sparkles, "Agent Studio"], [Library, "Knowledge Base"], [FlaskConical, "Testing"], [Workflow, "Actions"]]]] as const;
  return (
    <Frame className="overflow-hidden p-2 sm:p-3">
      <div className="grid gap-3 md:grid-cols-[220px_1fr]">
        <aside className="hidden rounded-xl bg-surface p-3 md:block">
          {groups.map(([g, items]) => (<div key={g} className="mb-3"><Label>{g}</Label>{items.map(([I, name]) => <p key={name} className={`mt-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm ${name === "Agent Studio" ? "bg-forest font-medium text-white" : "text-ink"}`}><I size={15} /> {name}</p>)}</div>))}
        </aside>
        <div className="rounded-xl border border-line p-4 sm:p-6">
          <p className="text-sm text-ink-muted">Agent Studio</p><p className="font-heading text-xl font-semibold text-forest">Ecommerce Support Assistant</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl bg-surface p-4"><Label>Instructions</Label><p className="mt-2 text-sm leading-relaxed">You support shoppers of an online store. Help with order status, shipping and returns. Answer only from company knowledge.</p><div className="mt-3 flex flex-wrap gap-2"><Tag>Friendly tone</Tag><Tag>Human handoff on refund disputes</Tag></div></div>
            <div className="rounded-xl bg-surface p-4"><Label>Knowledge sources</Label>{["Returns policy", "Shipping FAQ", "Product catalogue"].map((k) => <p key={k} className="mt-2 flex items-center justify-between text-sm"><span className="flex items-center gap-2"><Library size={14} className="text-forest" /> {k}</span><span className="flex items-center gap-1 text-xs text-success"><Check size={13} /> Ready</span></p>)}</div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-muted"><Tag>Version history</Tag><Tag>Test before publishing</Tag><Tag>Publish when ready</Tag></div>
        </div>
      </div>
    </Frame>
  );
}

export function BuilderCard() {
  return (
    <Frame className="p-5"><Label>Create an assistant</Label>
      <div className="mt-3 rounded-xl border border-line bg-surface p-4 text-sm"><p className="font-semibold text-forest">Start from a template</p><div className="mt-3 flex flex-wrap gap-2"><Tag>Ecommerce support</Tag><Tag>Appointment booking</Tag><Tag>Lead qualification</Tag><Tag>Billing support</Tag><Tag>Technical support</Tag><Tag>Custom</Tag></div></div>
      <div className="mt-3 space-y-2 text-sm">{["Name your assistant and set its tone", "Add policies, FAQs and documents", "Set escalation rules and guardrails", "Test it, then publish"].map((s, i) => <p key={s} className="flex items-center gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest text-xs font-bold text-white">{i + 1}</span>{s}</p>)}</div></Frame>
  );
}

export function RecommendationCard() {
  return (
    <Frame className="p-5"><Label>Monitoring recommendations</Label>
      <div className="mt-3 space-y-2.5 text-sm">
        <p className="rounded-xl border border-line p-3.5"><strong className="text-forest">Knowledge gap.</strong> Customers asked about returns after 30 days and no source matched. Add this to your knowledge base.</p>
        <p className="rounded-xl border border-forest/30 bg-surface p-3.5"><strong className="text-forest">Escalation pattern.</strong> Refund disputes are handed to people most often. Review your escalation rules.</p>
        <p className="rounded-xl border border-line p-3.5"><strong className="text-forest">Slow replies.</strong> Some answers took over ten seconds. Try a faster model.</p></div></Frame>
  );
}

export function TestingCard() {
  return (<Frame className="h-full p-5"><Label>Testing</Label><p className="mt-3 rounded-xl bg-surface p-3.5 text-sm">&ldquo;I was charged twice. Fix it now.&rdquo;</p>
    <div className="mt-3 grid grid-cols-2 gap-2 text-sm"><div className="rounded-xl border border-line p-3"><p className="text-xs text-ink-muted">Version 3</p><p className="mt-1">Apologises, asks for the order number.</p></div><div className="rounded-xl border border-forest/40 p-3"><p className="text-xs text-ink-muted">Version 4</p><p className="mt-1">Apologises, then hands off to billing.</p></div></div>
    <div className="mt-3 flex gap-2 text-xs"><Tag>Correct</Tag><Tag>Incorrect</Tag></div></Frame>);
}
export function MonitorCard() {
  return (<Frame className="h-full p-5"><Label>Monitoring</Label><div className="mt-3 space-y-2 text-sm">{["Unsuccessful conversations", "Knowledge gaps", "Repeated complaints", "Escalation patterns"].map((x) => <p key={x} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2.5"><span>{x}</span><Activity size={14} className="text-forest" /></p>)}</div></Frame>);
}
export function KnowledgeCard() {
  return (<Frame className="h-full p-5"><Label>Knowledge base</Label><div className="mt-3 space-y-2 text-sm">{["Returns policy.pdf", "Pricing and plans.docx", "Help center FAQ.txt", "Product catalogue.csv"].map((x) => <p key={x} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2.5"><span className="flex items-center gap-2"><Library size={14} className="text-forest" /> {x}</span><span className="text-xs text-success">Indexed</span></p>)}</div></Frame>);
}
export function ObservabilityCard() {
  return (<Frame className="h-full p-5"><Label>Agent reasoning</Label><div className="mt-3 space-y-2 text-sm">{[["Knowledge", "Returns policy matched"], ["Decision", "Customer eligible"], ["Action", "Return requested, awaiting approval"], ["Reply", "Sent in 2 seconds"]].map(([a, b]) => <p key={a} className="flex items-start gap-2 rounded-lg bg-surface px-3 py-2.5"><Check size={14} className="mt-0.5 shrink-0 text-success" /><span><strong className="text-forest">{a}.</strong> {b}</span></p>)}</div></Frame>);
}
export function ContextCard() {
  return (<Frame className="h-full p-5"><Label>Customer memory</Label><div className="mt-3 space-y-2 text-sm"><p className="rounded-lg bg-surface px-3 py-2.5"><strong className="text-forest">Preference:</strong> Prefers email over calls</p><p className="rounded-lg bg-surface px-3 py-2.5"><strong className="text-forest">Open issue:</strong> Replacement for order in transit</p><p className="rounded-lg bg-surface px-3 py-2.5"><strong className="text-forest">Previous:</strong> Two earlier conversations</p></div></Frame>);
}
export function ActionCard() {
  return (<Frame className="h-full p-5"><Label>Actions</Label><div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm"><p className="font-semibold text-amber-900">Waiting for approval</p><p className="mt-1">Cancel booking for the 14th</p><div className="mt-3 flex gap-2 text-xs"><span className="rounded-full bg-forest px-3 py-1.5 font-semibold text-white">Approve</span><span className="rounded-full border border-line bg-white px-3 py-1.5 font-semibold">Reject</span></div></div><p className="mt-3 text-xs text-ink-muted">Sensitive actions always wait for a person.</p></Frame>);
}
export function HandoffCard() {
  return (<Frame className="h-full p-5"><Label>Human handoff</Label><div className="mt-3 space-y-2 text-sm"><p className="rounded-lg bg-surface px-3 py-2.5"><UserRound size={14} className="mr-2 inline text-forest" />Escalated: refund dispute</p><p className="rounded-lg bg-surface px-3 py-2.5">Summary for the team is attached, so the customer never repeats themselves.</p><p className="rounded-lg bg-surface px-3 py-2.5">Assigned to a team member</p></div></Frame>);
}
export function ChannelsCard() {
  return (<Frame className="h-full p-5"><Label>Channels</Label><div className="mt-3 grid grid-cols-2 gap-2 text-sm">{[[Code2, "Website chat"], [MessageSquare, "Email"], [Radio, "WhatsApp"], [PlugZap, "SMS and voice"]].map(([I, n]) => { const Icon = I as typeof Code2; return <p key={n as string} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2.5"><Icon size={14} className="text-forest" />{n as string}</p>; })}</div><p className="mt-3 text-xs text-ink-muted">Each channel is shown as connected only after it has been set up and tested.</p></Frame>);
}
export function InboxCard() {
  return (<Frame className="p-5"><Label>Inbox</Label><div className="mt-3 space-y-2 text-sm">{[["Where is my order?", "Open"], ["Refund for a damaged item", "Escalated"], ["Change my booking", "Pending"], ["Thanks, that fixed it", "Resolved"]].map(([s, st]) => <p key={s} className="flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2.5"><span className="truncate">{s}</span><Tag>{st}</Tag></p>)}</div></Frame>);
}
export function WidgetCard() {
  return (<Frame className="p-5"><Label>Website widget</Label><pre className="mt-3 overflow-x-auto rounded-lg bg-forest-deep p-3 text-[11px] leading-relaxed text-sage">{`<script src="https://your-app/widget.js"\n  data-key="YOUR_KEY" async></script>`}</pre><div className="mt-3 flex flex-wrap gap-2"><Tag>Your logo</Tag><Tag>Your colors</Tag><Tag>Welcome message</Tag><Tag>Live preview</Tag></div></Frame>);
}
export function TeamCard() {
  return (<Frame className="p-5"><Label>Team</Label><div className="mt-3 space-y-2 text-sm">{[["Owner", "Everything"], ["Manager", "Build and publish agents"], ["Agent", "Work the inbox"]].map(([r, d]) => <p key={r} className="flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2.5"><span className="flex items-center gap-2"><Users size={14} className="text-forest" />{r}</span><span className="text-xs text-ink-muted">{d}</span></p>)}</div></Frame>);
}
export function SecurityCard() {
  return (<Frame className="p-5"><Label>Security and permissions</Label><div className="mt-3 space-y-2 text-sm">{["Every organization is isolated at the database level", "AI provider keys stay on the server", "Role based access for every team member", "Audit log of important changes"].map((x) => <p key={x} className="flex items-start gap-2 rounded-lg bg-surface px-3 py-2.5"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-forest" />{x}</p>)}</div></Frame>);
}
export function AnalyticsCard() {
  return (<Frame className="p-5"><Label>Analytics</Label><div className="mt-3 grid grid-cols-2 gap-2 text-sm">{["Conversations", "Resolved by AI", "Human escalations", "Response time", "Resolution rate", "Customer satisfaction"].map((x) => <p key={x} className="rounded-lg bg-surface px-3 py-2.5 text-forest">{x}</p>)}</div><p className="mt-3 text-xs text-ink-muted">Calculated from your own conversations.</p></Frame>);
}
export function IntegrationsCard() {
  return (<Frame className="p-5"><Label>Integrations</Label><div className="mt-3 space-y-2 text-sm"><p className="flex items-center justify-between rounded-lg bg-surface px-3 py-2.5">Slack <span className="text-xs text-success">Connected after a real test</span></p><p className="flex items-center justify-between rounded-lg bg-surface px-3 py-2.5">Webhook actions <span className="text-xs text-ink-muted">Your systems, your rules</span></p></div></Frame>);
}
