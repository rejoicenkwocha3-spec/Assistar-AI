import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { runAgent, executeAction, type AgentConfig } from "@/lib/ai/engine";
import { postSlack } from "@/lib/notify";
import { ConfigError } from "@/lib/ai/providers";

const MAX_MESSAGE = 2000;

export async function loadWidget(key: string) {
  const db = createAdminClient();
  const { data: widget } = await db
    .from("assistar_widgets")
    .select("id, organization_id, agent_id, public_key, name, assistant_name, brand_color, welcome_message, logo_url, active")
    .eq("public_key", key)
    .maybeSingle();
  return { db, widget };
}

export async function handleWidgetMessage(key: string, input: { message: string; visitorId: string; conversationId?: string | null }) {
  const message = input.message.trim().slice(0, MAX_MESSAGE);
  if (!message) return { status: 400, body: { error: "Message is empty." } };
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(input.visitorId)) return { status: 400, body: { error: "Invalid visitor." } };

  const { db, widget } = await loadWidget(key);
  if (!widget || !widget.active) return { status: 404, body: { error: "Chat is not available." } };
  const orgId = widget.organization_id as string;

  const { data: agentRow } = widget.agent_id
    ? await db.from("assistar_agents").select("*").eq("id", widget.agent_id).eq("organization_id", orgId).maybeSingle()
    : { data: null };
  if (!agentRow || agentRow.status !== "published") {
    return { status: 503, body: { error: "This assistant is not published yet.", unavailable: true } };
  }

  // Customer (anonymous visitor)
  let { data: customer } = await db.from("assistar_customers").select("id").eq("organization_id", orgId).eq("visitor_id", input.visitorId).maybeSingle();
  if (!customer) {
    ({ data: customer } = await db.from("assistar_customers").insert({ organization_id: orgId, visitor_id: input.visitorId }).select("id").single());
  }
  if (!customer) return { status: 500, body: { error: "Could not start the conversation." } };

  // Conversation (must belong to this widget's organization and this visitor)
  let conv: { id: string; status: string } | null = null;
  if (input.conversationId) {
    const { data } = await db
      .from("assistar_conversations")
      .select("id, status")
      .eq("id", input.conversationId)
      .eq("organization_id", orgId)
      .eq("customer_id", customer.id)
      .maybeSingle();
    conv = data;
  }
  if (!conv) {
    const { data } = await db
      .from("assistar_conversations")
      .insert({ organization_id: orgId, agent_id: agentRow.id, customer_id: customer.id, channel: "web", subject: message.slice(0, 80) })
      .select("id, status")
      .single();
    conv = data;
  }
  if (!conv) return { status: 500, body: { error: "Could not start the conversation." } };

  await db.from("assistar_messages").insert({ organization_id: orgId, conversation_id: conv.id, role: "customer", content: message });
  await db.from("assistar_conversations").update({ last_message_at: new Date().toISOString(), ...(conv.status === "resolved" ? { status: "open", resolved_by_ai: false } : {}) }).eq("id", conv.id);

  // Once a person owns the conversation the AI stays quiet.
  if (conv.status === "escalated" || conv.status === "pending") {
    return { status: 200, body: { conversationId: conv.id, handoff: true, reply: null } };
  }

  const { data: hist } = await db
    .from("assistar_messages")
    .select("role, content")
    .eq("conversation_id", conv.id)
    .in("role", ["customer", "assistant", "human"])
    .order("created_at", { ascending: false })
    .limit(20);
  const history = (hist ?? []).reverse().map((m) => ({ role: m.role === "customer" ? ("user" as const) : ("assistant" as const), content: m.content as string }));
  const { data: ctx } = await db.from("assistar_customer_context").select("key, value").eq("customer_id", customer.id).limit(20);

  try {
    const liveConfig = { ...agentRow, ...(agentRow.published_config ?? {}) } as AgentConfig;
    const result = await runAgent(db, { orgId, agent: liveConfig, history, customerContext: ctx ?? [] });

    await db.from("assistar_messages").insert({
      organization_id: orgId, conversation_id: conv.id, role: "assistant", content: result.reply, latency_ms: result.latencyMs,
      meta: { kb_hits: result.kbHits, sources: result.sources, escalated: result.escalate, model: liveConfig.model, agent_version: agentRow.published_version ?? agentRow.version },
    });
    await db.from("assistar_usage_events").insert({ organization_id: orgId, kind: "ai_message", agent_id: agentRow.id });

    for (const a of result.actions) {
      const { data: def } = await db.from("assistar_actions").select("*").eq("organization_id", orgId).eq("slug", a.slug).eq("enabled", true).maybeSingle();
      if (!def) continue;
      const { data: exec } = await db.from("assistar_action_executions")
        .insert({ organization_id: orgId, action_id: def.id, conversation_id: conv.id, input: a.input, requested_by: "agent" }).select("id").single();
      if (exec && !def.requires_confirmation) {
        const r = await executeAction(def, a.input);
        await db.from("assistar_action_executions").update({ status: r.ok ? "succeeded" : "failed", output: r.output, error: r.error, duration_ms: r.durationMs }).eq("id", exec.id);
      }
    }

    if (result.escalate) await escalate(db, orgId, conv.id, agentRow.name, result.escalationReason ?? "Agent requested a human", message);
    return { status: 200, body: { conversationId: conv.id, reply: result.reply, handoff: result.escalate } };
  } catch (e) {
    const detail = e instanceof Error ? e.message : "unknown error";
    await db.from("assistar_messages").insert({
      organization_id: orgId, conversation_id: conv.id, role: "system", content: "The assistant could not reply.", meta: { error: detail, config_error: e instanceof ConfigError },
    });
    // Do not leak provider details to website visitors.
    return { status: 502, body: { error: "The assistant is unavailable right now. Please try again shortly.", unavailable: true, conversationId: conv.id } };
  }
}

export async function escalate(db: ReturnType<typeof createAdminClient>, orgId: string, conversationId: string, agentName: string, reason: string, lastCustomerMessage: string) {
  const { data: recent } = await db.from("assistar_messages").select("role, content").eq("conversation_id", conversationId).in("role", ["customer", "assistant"]).order("created_at", { ascending: false }).limit(6);
  const summary = (recent ?? []).reverse().map((m) => `${m.role === "customer" ? "Customer" : "Assistant"}: ${String(m.content).slice(0, 200)}`).join("\n");
  await db.from("assistar_conversations").update({ status: "escalated", summary }).eq("id", conversationId);
  await db.from("assistar_handoffs").insert({ organization_id: orgId, conversation_id: conversationId, reason, summary, requested_by: "agent" });
  await db.from("assistar_messages").insert({ organization_id: orgId, conversation_id: conversationId, role: "system", content: `Transferred to a human: ${reason}` });

  const { data: slack } = await db.from("assistar_integrations").select("config, status").eq("organization_id", orgId).eq("provider", "slack").maybeSingle();
  const hook = (slack?.config as { webhook_url?: string } | undefined)?.webhook_url;
  if (slack?.status === "connected" && hook) {
    await postSlack(hook, `Assistar AI: ${agentName} escalated a conversation.\nReason: ${reason}\nLast customer message: ${lastCustomerMessage.slice(0, 200)}`);
  }
}
