import { getContext, isAdmin } from "@/lib/context";
import { Badge, Card, Page, PageHeader, timeAgo } from "@/components/dashboard/ui";
import { ActionForm, MiniForm, Submit } from "@/components/dashboard/ActionForm";
import { connectSlack, disconnectIntegration } from "./actions";

const PLANNED = [
  ["WhatsApp Business", "Needs a Meta approved business account and Cloud API credentials."],
  ["Twilio", "Needs an account SID, auth token and a phone number for SMS and voice."],
  ["Email provider", "Needs sending and inbound domain configuration with your email provider."],
  ["HubSpot", "Needs an OAuth app or private app token. Not built yet."],
  ["Salesforce", "Needs a connected app with OAuth. Not built yet."],
  ["Shopify", "Needs a custom app with order read access. Not built yet."],
  ["Google Calendar", "Needs a Google OAuth client and consent screen. Not built yet."],
];

export default async function IntegrationsPage() {
  const { supabase, orgId, role } = await getContext();
  if (!isAdmin(role)) return <Page><PageHeader title="Integrations" description="Only owners and admins can manage integrations." /></Page>;
  const { data: slack } = await supabase.from("assistar_integrations").select("status, last_tested_at, last_error").eq("organization_id", orgId).eq("provider", "slack").maybeSingle();
  return (
    <Page>
      <PageHeader title="Integrations" description="An integration shows as connected only after Assistar AI has authenticated with it and completed a real test." />
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-2"><div className="flex items-start justify-between gap-3"><div><h2 className="font-bold text-forest">Slack</h2><p className="text-sm text-ink-muted">Post a message to a channel whenever an assistant hands a conversation to your team.</p></div><Badge value={slack?.status ?? "disconnected"} /></div>
          {slack?.status === "connected" && <p className="mt-2 text-xs text-ink-muted">Last verified {slack.last_tested_at ? timeAgo(slack.last_tested_at) : ""}.</p>}
          {slack?.status === "error" && <p className="mt-2 text-sm text-red-700">{slack.last_error}</p>}
          <ActionForm action={connectSlack} className="mt-4"><label className="label" htmlFor="wh">Incoming webhook URL</label>
            <div className="flex flex-col gap-2 sm:flex-row"><input id="wh" name="webhook_url" className="input" placeholder="https://hooks.slack.com/services/..." autoComplete="off" /><Submit pendingText="Testing" className="btn-primary w-auto px-5">{slack ? "Reconnect and test" : "Connect and test"}</Submit></div>
            <p className="mt-2 text-xs text-ink-muted">Create one in Slack under Apps, Incoming Webhooks. We send a test message to confirm it works.</p></ActionForm>
          {slack && <div className="mt-3"><MiniForm action={disconnectIntegration} fields={{ provider: "slack" }} confirm="Disconnect Slack?" className="text-xs text-red-700 underline">Disconnect</MiniForm></div>}</Card>
        <Card className="md:col-span-2"><h2 className="font-bold text-forest">Business systems</h2><p className="mt-1 text-sm text-ink-muted">To connect an order system, CRM or booking tool today, use <a href="/dashboard/actions" className="font-semibold text-forest underline">Actions</a>: define a webhook your system exposes and your agent can request it, with approval.</p></Card>
        {PLANNED.map(([name, needs]) => (<Card key={name}><div className="flex items-start justify-between gap-3"><h2 className="font-bold text-forest">{name}</h2><Badge value="disconnected" /></div><p className="mt-2 text-sm text-ink-muted">{needs}</p></Card>))}
      </div>
    </Page>
  );
}
