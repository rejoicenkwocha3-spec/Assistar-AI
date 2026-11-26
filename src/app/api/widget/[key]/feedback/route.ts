import { NextResponse } from "next/server";
import { loadWidget } from "@/lib/chat";
import { clientIp, rateLimit } from "@/lib/ratelimit";

// The visitor tells us whether the assistant resolved their issue and rates the conversation.
export async function POST(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!rateLimit(`fb:${clientIp(req)}:${key}`, 10, 60_000)) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  const { conversationId, visitorId, resolved, rating } = body as { conversationId?: string; visitorId?: string; resolved?: boolean; rating?: number };
  if (!conversationId || !visitorId || !/^[A-Za-z0-9_-]{8,64}$/.test(visitorId)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { db, widget } = await loadWidget(key);
  if (!widget) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const { data: cust } = await db.from("assistar_customers").select("id").eq("organization_id", widget.organization_id).eq("visitor_id", visitorId).maybeSingle();
  if (!cust) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const { data: conv } = await db.from("assistar_conversations").select("id, status").eq("id", conversationId).eq("customer_id", cust.id).maybeSingle();
  if (!conv) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const patch: Record<string, unknown> = {};
  if (typeof rating === "number" && rating >= 1 && rating <= 5) patch.satisfaction = Math.round(rating);
  // Only count it as resolved by AI if no person was involved.
  if (resolved === true && conv.status === "open") { patch.status = "resolved"; patch.resolved_by_ai = true; }
  if (Object.keys(patch).length) await db.from("assistar_conversations").update(patch).eq("id", conv.id);
  return NextResponse.json({ ok: true });
}
