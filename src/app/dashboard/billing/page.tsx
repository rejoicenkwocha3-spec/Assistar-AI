import { headers } from "next/headers";
import { getContext, isAdmin } from "@/lib/context";
import { PLANS, planByKey } from "@/config/plans";
import { Badge, Card, Page, PageHeader, timeAgo } from "@/components/dashboard/ui";
import { CopyButton } from "@/components/dashboard/CopyButton";

export default async function BillingPage() {
  const { supabase, orgId, role, profile, user } = await getContext();
  const admin = isAdmin(role);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const [{ data: sub }, { data: events }, { data: usage }] = await Promise.all([
    supabase.from("assistar_subscriptions").select("*").eq("organization_id", orgId).maybeSingle(),
    admin ? supabase.from("assistar_payment_events").select("id, event_type, amount, currency, processed, note, created_at").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(10) : Promise.resolve({ data: [] }),
    supabase.from("assistar_usage_events").select("quantity").eq("organization_id", orgId).gte("created_at", monthStart),
  ]);
  const plan = sub ? planByKey(sub.plan_key) : null;
  const used = (usage ?? []).reduce((n, r) => n + r.quantity, 0);
  const h = await headers();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const email = profile?.email || user.email;

  return (
    <Page>
      <PageHeader title="Billing" description="Subscriptions are activated only after Selar confirms the payment to our server. Clicking a checkout button never activates anything." />
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2"><p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Current subscription</p>
          {sub && plan ? (<><p className="mt-2 text-2xl font-extrabold text-forest">{plan.name} <span className="text-base font-semibold text-ink-muted">${plan.priceUsd} per month</span></p>
            <div className="mt-2 flex items-center gap-3"><Badge value={sub.status} />{sub.current_period_end && <span className="text-sm text-ink-muted">Paid through {new Date(sub.current_period_end).toLocaleDateString()}</span>}</div></>)
            : <p className="mt-2 text-lg font-semibold text-forest">No active subscription</p>}</Card>
        <Card><p className="text-xs font-medium uppercase tracking-wide text-ink-muted">AI messages this month</p><p className="mt-2 text-3xl font-extrabold text-forest">{used}</p></Card>
      </div>
      <h2 className="mb-3 mt-8 font-bold text-forest">Plans</h2>
      <p className="mb-4 text-sm text-ink-muted">Use <strong className="text-ink">{email}</strong> as the email at checkout so your payment can be matched to this account.</p>
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <Card key={p.key} className={sub?.plan_key === p.key && sub.status === "active" ? "border-forest ring-2 ring-forest/20" : ""}>
            <h3 className="font-bold text-forest">{p.name}</h3><p className="mt-2 text-3xl font-extrabold text-forest">${p.priceUsd}<span className="text-sm font-semibold text-ink-muted"> / month</span></p><p className="mt-1 text-xs text-ink-muted">{p.description}</p>
            <a href={p.checkoutUrl} target="_blank" rel="noopener noreferrer" className="btn-primary mt-4">{sub?.plan_key === p.key && sub.status === "active" ? "Renew or manage on Selar" : "Subscribe on Selar"}</a></Card>))}
      </div>
      {admin && (<>
        <Card className="mt-8"><h2 className="mb-2 font-bold text-forest">Payment webhook</h2>
          <p className="text-sm text-ink-muted">In your Selar dashboard, add this webhook URL and send the shared secret in the <code>x-webhook-secret</code> header (or as <code>?secret=</code>).</p>
          <div className="mt-3 flex flex-wrap items-center gap-2"><code className="break-all rounded bg-surface px-3 py-2 text-xs">{origin}/api/webhooks/selar</code><CopyButton text={`${origin}/api/webhooks/selar`} /></div>
          <p className="mt-2 text-xs text-ink-muted">Server secret status: {process.env.SELAR_WEBHOOK_SECRET ? "SELAR_WEBHOOK_SECRET is set." : "SELAR_WEBHOOK_SECRET is not set, so the webhook rejects every request."}</p></Card>
        <Card className="mt-4"><h2 className="mb-3 font-bold text-forest">Payment events</h2>{!events?.length ? <p className="text-sm text-ink-muted">No payment events received yet.</p> : (
          <ul className="divide-y divide-line">{events.map((e) => <li key={e.id} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span>{e.amount ? `$${e.amount}` : ""} {e.event_type} <span className="text-xs text-ink-muted">{e.note}</span></span><span className="flex items-center gap-2"><Badge value={e.processed ? "succeeded" : "failed"} /><span className="text-xs text-ink-muted">{timeAgo(e.created_at)}</span></span></li>)}</ul>)}</Card></>)}
    </Page>
  );
}
