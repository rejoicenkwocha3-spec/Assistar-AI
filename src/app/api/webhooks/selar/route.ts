import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { planByPrice } from "@/config/plans";

export const dynamic = "force-dynamic";

// Payment confirmation from Selar. A subscription is activated ONLY when:
//  1. the request carries our shared secret (SELAR_WEBHOOK_SECRET) in the `x-webhook-secret` header or `?secret=`,
//  2. the payload reports a successful payment, and
//  3. the buyer email matches a registered account and the amount matches a configured plan.
// Everything else is recorded in assistar_payment_events with verified/processed flags for review.

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

// Selar's field names are not published on the checkout pages, so common shapes are accepted.
// Confirm against a real test payload in assistar_payment_events and adjust if needed.
function dig(obj: unknown, paths: string[]): unknown {
  for (const p of paths) {
    let cur: unknown = obj;
    for (const k of p.split(".")) cur = cur && typeof cur === "object" ? (cur as Record<string, unknown>)[k] : undefined;
    if (cur !== undefined && cur !== null && cur !== "") return cur;
  }
  return undefined;
}

export async function POST(req: Request) {
  const secret = process.env.SELAR_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  const url = new URL(req.url);
  const supplied = req.headers.get("x-webhook-secret") ?? url.searchParams.get("secret") ?? "";
  if (!safeEqual(supplied, secret)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const payload = await req.json().catch(() => null);
  if (!payload || typeof payload !== "object") return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  const db = createAdminClient();
  const email = String(dig(payload, ["customer_email", "email", "data.customer_email", "data.email", "customer.email", "buyer.email", "data.customer.email"]) ?? "").trim().toLowerCase();
  const reference = String(dig(payload, ["reference", "transaction_reference", "order_id", "id", "data.reference", "data.order_id", "data.id"]) ?? "") || null;
  const amount = Number(dig(payload, ["amount", "price", "data.amount", "data.price", "total", "data.total"]) ?? NaN);
  const currency = String(dig(payload, ["currency", "data.currency"]) ?? "").toUpperCase() || null;
  const eventType = String(dig(payload, ["event", "type", "status", "data.status"]) ?? "") || null;
  const status = String(dig(payload, ["status", "data.status", "payment_status"]) ?? eventType ?? "").toLowerCase();
  const success = /(success|paid|complete|charge\.success|subscription\.(create|renew|payment))/.test(status + " " + (eventType ?? "").toLowerCase());

  const base = { provider: "selar", event_type: eventType, reference, email: email || null, amount: Number.isFinite(amount) ? amount : null, currency, verified: true, payload };

  // Idempotency: the same payment reference is processed once.
  if (reference) {
    const { data: seen } = await db.from("assistar_payment_events").select("id").eq("provider", "selar").eq("reference", reference).maybeSingle();
    if (seen) return NextResponse.json({ ok: true, duplicate: true });
  }

  const reject = async (note: string) => {
    await db.from("assistar_payment_events").insert({ ...base, processed: false, note });
    return NextResponse.json({ ok: true, processed: false, note });
  };

  if (!success) return reject("Event is not a successful payment.");
  if (!email) return reject("No buyer email in payload.");
  if (!Number.isFinite(amount) || (currency && currency !== "USD")) return reject("Missing amount or unsupported currency.");
  const plan = planByPrice(amount);
  if (!plan) return reject(`Amount ${amount} does not match a configured plan.`);

  const { data: profile } = await db.from("profiles").select("id").ilike("email", email).maybeSingle();
  if (!profile) return reject("No Assistar account uses this email. Ask the buyer to sign up with the checkout email.");
  const { data: member } = await db.from("organization_members").select("organization_id").eq("user_id", profile.id).eq("role", "owner").order("created_at").limit(1).maybeSingle();
  if (!member) return reject("Account has no organization.");

  const orgId = member.organization_id as string;
  const periodEnd = new Date(Date.now() + 31 * 24 * 3600 * 1000).toISOString();
  const { error } = await db.from("assistar_subscriptions").upsert(
    { organization_id: orgId, plan_key: plan.key, status: "active", provider: "selar", provider_reference: reference, customer_email: email, current_period_end: periodEnd },
    { onConflict: "organization_id" }
  );
  if (error) return reject(`Could not save subscription: ${error.message}`);
  await db.from("organizations").update({ plan: plan.key }).eq("id", orgId);
  await db.from("assistar_payment_events").insert({ ...base, organization_id: orgId, processed: true, note: `Activated ${plan.name}` });
  await db.from("assistar_audit_logs").insert({ organization_id: orgId, action: "subscription.activated", entity: "subscription", meta: { plan: plan.key, reference } });
  return NextResponse.json({ ok: true, processed: true });
}
