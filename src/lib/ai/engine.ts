import "server-only";
import { callModel, type ChatMessage } from "./providers";

// Minimal structural type so the engine works with both the user (RLS) client and the admin client.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

export type AgentConfig = {
  id?: string;
  name: string;
  instructions: string;
  personality: string;
  tone: string;
  provider: "anthropic" | "openai";
  model: string;
  response_rules: string;
  escalation_rules: string;
  guardrails: string;
};

export type ActionDef = { id: string; slug: string; name: string; description: string; parameters: string[]; requires_confirmation: boolean };

export type EngineResult = {
  reply: string;
  escalate: boolean;
  escalationReason?: string;
  actions: { slug: string; input: Record<string, string> }[];
  kbHits: number;
  sources: string[];
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
};

const ESCALATE_RE = /\[\[ESCALATE(?::\s*([^\]]*))?\]\]/i;
const ACTION_RE = /\[\[ACTION:([a-z0-9_]+)\s*(\{[\s\S]*?\})?\]\]/gi;

export async function retrieveKnowledge(db: Db, orgId: string, query: string, limit = 5) {
  const { data } = await db.rpc("assistar_search_knowledge", { org: orgId, q: query.slice(0, 500), lim: limit });
  return (data ?? []) as { id: string; source_name: string; content: string }[];
}

export function buildSystemPrompt(agent: AgentConfig, opts: {
  knowledge: { source_name: string; content: string }[];
  actions: ActionDef[];
  customerContext: { key: string; value: string }[];
}) {
  const parts: string[] = [];
  parts.push(`You are ${agent.name}, an AI customer assistant for a business. Reply in the customer's language. Keep answers concise and helpful.`);
  if (agent.instructions) parts.push(`INSTRUCTIONS:\n${agent.instructions}`);
  if (agent.personality) parts.push(`PERSONALITY:\n${agent.personality}`);
  parts.push(`TONE: ${agent.tone}`);
  if (agent.response_rules) parts.push(`RESPONSE RULES:\n${agent.response_rules}`);
  if (agent.guardrails) parts.push(`GUARDRAILS (never break these):\n${agent.guardrails}`);
  if (opts.knowledge.length) {
    parts.push(
      "COMPANY KNOWLEDGE (use this as the source of truth; if the answer is not here or in the conversation, say you do not have that information):\n" +
        opts.knowledge.map((k, i) => `[${i + 1}] (${k.source_name}) ${k.content}`).join("\n\n")
    );
  } else {
    parts.push("COMPANY KNOWLEDGE: none matched this question. Do not invent company facts, policies, prices or availability. Say you do not have that information and offer a human.");
  }
  if (opts.customerContext.length) {
    parts.push("CUSTOMER CONTEXT:\n" + opts.customerContext.map((c) => `${c.key}: ${c.value}`).join("\n"));
  }
  parts.push(
    `HUMAN HANDOFF: If you cannot resolve the issue with confidence, the customer asks for a person, or the escalation rules apply, end your reply with [[ESCALATE: short reason]]. ${agent.escalation_rules ? `Escalation rules: ${agent.escalation_rules}` : ""}`
  );
  if (opts.actions.length) {
    parts.push(
      "ACTIONS you may request (only when the customer clearly asks and you have every required input). To request one, add [[ACTION:slug {\"param\":\"value\"}]] at the end of your reply. " +
        "Actions that require confirmation are reviewed by a person before running, so tell the customer it has been requested, not completed.\n" +
        opts.actions.map((a) => `- ${a.slug}: ${a.description || a.name}. Inputs: ${a.parameters.join(", ") || "none"}.`).join("\n")
    );
  }
  return parts.join("\n\n");
}

export async function runAgent(db: Db, args: {
  orgId: string;
  agent: AgentConfig;
  history: ChatMessage[]; // must end with the latest customer message
  customerContext?: { key: string; value: string }[];
  useActions?: boolean;
}): Promise<EngineResult> {
  const { orgId, agent, history } = args;
  const started = Date.now();
  const lastUser = [...history].reverse().find((m) => m.role === "user")?.content ?? "";
  const knowledge = await retrieveKnowledge(db, orgId, lastUser);

  let actions: ActionDef[] = [];
  if (args.useActions !== false) {
    const { data } = await db
      .from("assistar_actions")
      .select("id, slug, name, description, parameters, requires_confirmation")
      .eq("organization_id", orgId)
      .eq("enabled", true);
    actions = data ?? [];
  }

  const system = buildSystemPrompt(agent, { knowledge, actions, customerContext: args.customerContext ?? [] });
  const out = await callModel({ provider: agent.provider, model: agent.model, system, messages: history.slice(-20) });

  let reply = out.text;
  const esc = ESCALATE_RE.exec(reply);
  const requested: EngineResult["actions"] = [];
  for (const m of reply.matchAll(ACTION_RE)) {
    const def = actions.find((a) => a.slug === m[1]);
    if (!def) continue;
    let input: Record<string, string> = {};
    try {
      const parsed = m[2] ? JSON.parse(m[2]) : {};
      for (const p of def.parameters) if (parsed[p] != null) input[p] = String(parsed[p]).slice(0, 500);
    } catch {
      input = {};
    }
    requested.push({ slug: def.slug, input });
  }
  reply = reply.replace(ESCALATE_RE, "").replace(ACTION_RE, "").trim();
  if (!reply) reply = esc ? "I am connecting you with a member of our team." : "Sorry, I could not produce a reply. Please try again.";

  return {
    reply,
    escalate: !!esc,
    escalationReason: esc?.[1]?.trim() || undefined,
    actions: requested,
    kbHits: knowledge.length,
    sources: [...new Set(knowledge.map((k) => k.source_name))],
    latencyMs: Date.now() - started,
    inputTokens: out.inputTokens,
    outputTokens: out.outputTokens,
  };
}

/** Run an action webhook. Returns a log-friendly result. Never throws. */
export async function executeAction(action: { url: string; method: string; headers: Record<string, string> }, input: Record<string, string>) {
  const started = Date.now();
  try {
    const res = await fetch(action.url, {
      method: action.method,
      headers: { "content-type": "application/json", ...action.headers },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(15_000),
      redirect: "error",
    });
    const text = (await res.text()).slice(0, 2000);
    return { ok: res.ok, output: text, error: res.ok ? null : `HTTP ${res.status}`, durationMs: Date.now() - started };
  } catch (e) {
    return { ok: false, output: null, error: e instanceof Error ? e.message : "request failed", durationMs: Date.now() - started };
  }
}

/** Reject non-public targets so a webhook action cannot be used to reach internal services. */
export function isSafeWebhookUrl(raw: string) {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return false;
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return false;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) {
      const [a, b] = h.split(".").map(Number);
      if (a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) return false;
    }
    if (h.includes(":") || h.startsWith("[")) return false;
    return true;
  } catch {
    return false;
  }
}
