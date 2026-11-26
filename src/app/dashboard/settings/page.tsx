import { getContext, isAdmin } from "@/lib/context";
import { providerStatus } from "@/lib/ai/providers";
import { hasServiceRole } from "@/lib/supabase/admin";
import { Badge, Card, Page, PageHeader } from "@/components/dashboard/ui";
import { ActionForm, Submit } from "@/components/dashboard/ActionForm";
import { saveOrganization, saveProfile } from "./actions";

const INDUSTRIES = ["Ecommerce", "SaaS", "Financial services", "Healthcare", "Telecommunications", "Travel and hospitality", "Retail", "Marketing agency", "Enterprise", "Other"];

export default async function SettingsPage() {
  const { org, profile, user, role } = await getContext();
  const admin = isAdmin(role);
  const p = providerStatus();
  const env = [
    ["Anthropic API key", p.anthropic, "ANTHROPIC_API_KEY"], ["OpenAI API key", p.openai, "OPENAI_API_KEY"],
    ["Supabase service role key (widget, webhooks)", hasServiceRole(), "SUPABASE_SERVICE_ROLE_KEY"], ["Selar webhook secret", !!process.env.SELAR_WEBHOOK_SECRET, "SELAR_WEBHOOK_SECRET"],
  ] as const;
  return (
    <Page>
      <PageHeader title="Settings" description="Workspace details, your profile, and the server configuration status." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><h2 className="mb-4 font-bold text-forest">Workspace</h2>
          <ActionForm action={saveOrganization}><div className="space-y-3">
            <div><label className="label" htmlFor="name">Business name</label><input id="name" name="name" defaultValue={org.name} disabled={!admin} className="input" /></div>
            <div><label className="label" htmlFor="website">Website</label><input id="website" name="website" defaultValue={org.website ?? ""} disabled={!admin} className="input" /></div>
            <div><label className="label" htmlFor="industry">Industry</label><select id="industry" name="industry" defaultValue={org.industry ?? ""} disabled={!admin} className="input"><option value="">Select</option>{INDUSTRIES.map((i) => <option key={i}>{i}</option>)}</select></div>
            <div><label className="label" htmlFor="description">Description</label><textarea id="description" name="description" rows={3} defaultValue={org.description ?? ""} disabled={!admin} className="input" /></div>
            {admin ? <Submit className="btn-primary w-auto px-6">Save workspace</Submit> : <p className="text-sm text-ink-muted">Only owners and admins can edit this.</p>}</div></ActionForm></Card>
        <div className="space-y-6">
          <Card><h2 className="mb-4 font-bold text-forest">Your profile</h2>
            <ActionForm action={saveProfile}><div className="space-y-3"><div><label className="label" htmlFor="full_name">Full name</label><input id="full_name" name="full_name" defaultValue={profile?.full_name ?? ""} className="input" /></div>
              <div><label className="label">Email</label><input value={user.email ?? ""} disabled className="input" /></div><Submit className="btn-primary w-auto px-6">Save profile</Submit></div></ActionForm></Card>
          <Card><h2 className="mb-1 font-bold text-forest">Server configuration</h2><p className="mb-3 text-xs text-ink-muted">Secrets live in your hosting environment variables and are never shown in the browser. Only whether they are set is shown here.</p>
            <ul className="divide-y divide-line">{env.map(([label, ok, key]) => <li key={key} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span>{label}<code className="block text-xs text-ink-muted">{key}</code></span><Badge value={ok ? "connected" : "disconnected"} /></li>)}</ul></Card>
        </div>
      </div>
    </Page>
  );
}
