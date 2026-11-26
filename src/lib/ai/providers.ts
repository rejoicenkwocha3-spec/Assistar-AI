import "server-only";

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type ModelResult = { text: string; inputTokens?: number; outputTokens?: number };

export class ConfigError extends Error {}

export function providerStatus() {
  return { anthropic: !!process.env.ANTHROPIC_API_KEY, openai: !!process.env.OPENAI_API_KEY };
}

export const DEFAULT_MODELS = {
  anthropic: ["claude-haiku-5-5", "claude-sonnet-5-5", "claude-opus-5-5"],
  openai: ["gpt-4o-mini", "gpt-4o"],
};

export async function callModel(opts: {
  provider: "anthropic" | "openai";
  model: string;
  system: string;
  messages: ChatMessage[];
}): Promise<ModelResult> {
  const { provider, model, system, messages } = opts;
  const signal = AbortSignal.timeout(45_000);

  if (provider === "anthropic") {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new ConfigError("ANTHROPIC_API_KEY is not configured on the server.");
    const res = await fetch(`${process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com"}/v1/messages`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 1024, system, messages }),
      signal,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${json?.error?.message ?? "request failed"}`);
    const text = (json.content ?? []).filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("");
    return { text, inputTokens: json.usage?.input_tokens, outputTokens: json.usage?.output_tokens };
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new ConfigError("OPENAI_API_KEY is not configured on the server.");
  const res = await fetch(`${process.env.OPENAI_BASE_URL ?? "https://api.openai.com"}/v1/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, max_completion_tokens: 1024, messages: [{ role: "system", content: system }, ...messages] }),
    signal,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${json?.error?.message ?? "request failed"}`);
  return {
    text: json.choices?.[0]?.message?.content ?? "",
    inputTokens: json.usage?.prompt_tokens,
    outputTokens: json.usage?.completion_tokens,
  };
}
