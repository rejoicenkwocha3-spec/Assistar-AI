import "server-only";

export const isSlackWebhook = (u: string) => /^https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9/_-]+$/.test(u);

export async function postSlack(webhookUrl: string, text: string) {
  if (!isSlackWebhook(webhookUrl)) return { ok: false, error: "Not a valid Slack incoming webhook URL." };
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(10_000),
    });
    const body = await res.text();
    return res.ok ? { ok: true as const } : { ok: false as const, error: `Slack responded ${res.status}: ${body.slice(0, 120)}` };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "request failed" };
  }
}
