export const SNAPSHOT_KEYS = ["name", "description", "instructions", "personality", "tone", "provider", "model", "welcome_message", "response_rules", "escalation_rules", "guardrails"] as const;
export const snapshotOf = (a: Record<string, unknown>) => Object.fromEntries(SNAPSHOT_KEYS.map((k) => [k, a[k]]));
export const TONES = ["professional", "friendly", "calm", "confident", "playful", "formal"];
