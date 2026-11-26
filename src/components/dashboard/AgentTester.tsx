"use client";
import { useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { testAgent, type TestReply } from "@/app/dashboard/studio/actions";

type Turn = { role: "user" | "assistant"; content: string; meta?: TestReply };

export function AgentTester({ agentId, versions, current }: { agentId: string; versions: number[]; current: number }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [version, setVersion] = useState(current);
  const [pending, start] = useTransition();
  const bottom = useRef<HTMLDivElement>(null);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || pending) return;
    const next: Turn[] = [...turns, { role: "user", content: text }];
    setTurns(next); setInput("");
    start(async () => {
      const r = await testAgent(agentId, next.map(({ role, content }) => ({ role, content })), version);
      setTurns((t) => [...t, { role: "assistant", content: r.error ?? r.reply ?? "", meta: r }]);
      setTimeout(() => bottom.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">Test version
          <select value={version} onChange={(e) => { setVersion(Number(e.target.value)); setTurns([]); }} className="input w-auto py-1.5">
            {versions.map((v) => <option key={v} value={v}>{v === current ? `${v} (current)` : v}</option>)}
          </select>
        </label>
        <button onClick={() => setTurns([])} className="btn-secondary py-1.5 text-xs" type="button">Clear conversation</button>
      </div>
      <div className="h-[420px] space-y-3 overflow-y-auto rounded-xl border border-line bg-surface p-4">
        {turns.length === 0 && <p className="text-sm text-ink-muted">Try a normal question, a difficult one, and one your knowledge base does not cover. Each reply shows which knowledge it used.</p>}
        {turns.map((t, i) => (
          <div key={i} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${t.role === "user" ? "bg-forest text-white" : t.meta?.error ? "border border-red-200 bg-red-50 text-red-800" : "bg-white shadow-sm"}`}>
              <p className="whitespace-pre-wrap">{t.content}</p>
              {t.meta && !t.meta.error && (
                <p className="mt-1.5 border-t border-line pt-1.5 text-[11px] text-ink-muted">
                  {t.meta.kbHits ? `Used knowledge: ${t.meta.sources?.join(", ")}` : "No matching knowledge found"} · {t.meta.latencyMs} ms
                  {t.meta.escalate && <span className="font-semibold text-red-700"> · Would hand off to a human{t.meta.reason ? `: ${t.meta.reason}` : ""}</span>}
                  {!!t.meta.actions?.length && <span> · Requested action: {t.meta.actions.join(", ")} (not executed in tests)</span>}
                </p>
              )}
            </div>
          </div>
        ))}
        {pending && <p className="text-xs text-ink-muted">Thinking</p>}
        <div ref={bottom} />
      </div>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} className="input" placeholder="Write a customer message" aria-label="Customer message" maxLength={2000} />
        <button type="submit" disabled={pending || !input.trim()} className="btn-primary w-auto px-4" aria-label="Send"><Send size={16} /></button>
      </form>
    </div>
  );
}
