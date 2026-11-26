import { NextResponse } from "next/server";
import { handleWidgetMessage, loadWidget } from "@/lib/chat";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!rateLimit(`chat:${clientIp(req)}:${key}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many messages. Please wait a moment." }, { status: 429 });
  }
  let body: { message?: unknown; visitorId?: unknown; conversationId?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (typeof body.message !== "string" || typeof body.visitorId !== "string") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  try {
    const r = await handleWidgetMessage(key, {
      message: body.message,
      visitorId: body.visitorId,
      conversationId: typeof body.conversationId === "string" ? body.conversationId : null,
    });
    return NextResponse.json(r.body, { status: r.status });
  } catch (e) {
    console.error("widget chat failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Chat is unavailable right now." }, { status: 500 });
  }
}

// Used by the widget to restore history and to receive human replies after a handoff.
export async function GET(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!rateLimit(`poll:${clientIp(req)}:${key}`, 60, 60_000)) return NextResponse.json({ error: "Slow down." }, { status: 429 });
  const url = new URL(req.url);
  const conversationId = url.searchParams.get("conversationId");
  const visitorId = url.searchParams.get("visitorId");
  if (!conversationId || !visitorId || !/^[A-Za-z0-9_-]{8,64}$/.test(visitorId)) return NextResponse.json({ messages: [] });
  const { db, widget } = await loadWidget(key);
  if (!widget) return NextResponse.json({ messages: [] });
  const { data: cust } = await db.from("assistar_customers").select("id").eq("organization_id", widget.organization_id).eq("visitor_id", visitorId).maybeSingle();
  if (!cust) return NextResponse.json({ messages: [] });
  const { data: conv } = await db.from("assistar_conversations").select("id, status").eq("id", conversationId).eq("customer_id", cust.id).maybeSingle();
  if (!conv) return NextResponse.json({ messages: [] });
  const { data: msgs } = await db.from("assistar_messages").select("id, role, content, created_at").eq("conversation_id", conv.id).in("role", ["customer", "assistant", "human"]).order("created_at").limit(200);
  return NextResponse.json({ status: conv.status, messages: msgs ?? [] });
}
