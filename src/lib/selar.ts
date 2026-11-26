import { planByPrice } from "@/config/plans";

// Selar's field names are not published on the checkout pages, so common shapes are accepted.
// Confirm against a real test payload in assistar_payment_events and adjust here if needed.
function dig(obj: unknown, paths: string[]): unknown {
  for (const p of paths) {
    let cur: unknown = obj;
    for (const k of p.split(".")) cur = cur && typeof cur === "object" ? (cur as Record<string, unknown>)[k] : undefined;
    if (cur !== undefined && cur !== null && cur !== "") return cur;
  }
  return undefined;
}

export type ParsedPayment = {
  email: string; reference: string | null; amount: number; currency: string | null; eventType: string | null;
  success: boolean; plan: ReturnType<typeof planByPrice>;
};

export function parseSelarPayload(payload: unknown): ParsedPayment {
  const email = String(dig(payload, ["customer_email", "email", "data.customer_email", "data.email", "customer.email", "buyer.email", "data.customer.email"]) ?? "").trim().toLowerCase();
  const reference = String(dig(payload, ["reference", "transaction_reference", "order_id", "id", "data.reference", "data.order_id", "data.id"]) ?? "") || null;
  const amount = Number(dig(payload, ["amount", "price", "data.amount", "data.price", "total", "data.total"]) ?? NaN);
  const currency = String(dig(payload, ["currency", "data.currency"]) ?? "").toUpperCase() || null;
  const eventType = String(dig(payload, ["event", "type", "status", "data.status"]) ?? "") || null;
  const status = String(dig(payload, ["status", "data.status", "payment_status"]) ?? eventType ?? "").toLowerCase();
  const success = /(success|paid|complete|charge\.success|subscription\.(create|renew|payment))/.test(status + " " + (eventType ?? "").toLowerCase());
  return { email, reference, amount, currency, eventType, success, plan: Number.isFinite(amount) ? planByPrice(amount) : undefined };
}
