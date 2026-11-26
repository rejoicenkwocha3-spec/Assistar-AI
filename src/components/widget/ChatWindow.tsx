"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

type Msg = { id: string; role: "customer" | "assistant" | "human"; content: string };
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

function safeStore() {
  try { return window.localStorage; } catch { return null; }
}

export function ChatWindow({ widgetKey, assistantName, color, welcome, logoUrl, preview }: {
  widgetKey: string; assistantName: string; color: string; welcome: string; logoUrl: string | null; preview: boolean;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handoff, setHandoff] = useState(false);
  const [done, setDone] = useState(false);
  const visitor = useRef("");
  const convId = useRef<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  const sync = useCallback(async () => {
    if (!convId.current) return;
    const r = await fetch(`/api/widget/${widgetKey}/chat?conversationId=${convId.current}&visitorId=${visitor.current}`).then((x) => x.json()).catch(() => null);
    if (r?.messages) {
      setMessages(r.messages);
      if (r.status === "escalated" || r.status === "pending") setHandoff(true);
    }
  }, [widgetKey]);

  useEffect(() => {
    const store = safeStore();
    visitor.current = store?.getItem("assistar_visitor") || uid();
    store?.setItem("assistar_visitor", visitor.current);
    if (!preview) { convId.current = store?.getItem(`assistar_conv_${widgetKey}`) ?? null; sync(); }
  }, [widgetKey, preview, sync]);

  useEffect(() => {
    if (!handoff) return;
    const t = setInterval(sync, 5000);
    return () => clearInterval(t);
  }, [handoff, sync]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput(""); setError(null); setBusy(true);
    setMessages((m) => [...m, { id: uid(), role: "customer", content: text }]);
    try {
      const res = await fetch(`/api/widget/${widgetKey}/chat`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text, visitorId: visitor.current, conversationId: convId.current }),
      });
      const data = await res.json();
      if (data.conversationId) { convId.current = data.conversationId; if (!preview) safeStore()?.setItem(`assistar_conv_${widgetKey}`, data.conversationId); }
      if (!res.ok) { setError(data.error ?? "Something went wrong."); }
      else {
        if (data.reply) setMessages((m) => [...m, { id: uid(), role: "assistant", content: data.reply }]);
        if (data.handoff) setHandoff(true);
      }
    } catch { setError("Could not reach the assistant. Check your connection."); }
    finally { setBusy(false); }
  }

  async function feedback(body: { resolved?: boolean; rating?: number }) {
    if (!convId.current) return;
    await fetch(`/api/widget/${widgetKey}/feedback`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, conversationId: convId.current, visitorId: visitor.current }) }).catch(() => null);
    setDone(true);
  }

  const canRate = messages.some((m) => m.role === "assistant") && !handoff && !done && !preview;

  return (
    <div className="flex h-screen flex-col bg-white text-[#172C27]" style={{ fontFamily: "system-ui, sans-serif" }}>
      <header className="flex items-center gap-3 px-4 py-3 text-white" style={{ background: color }}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-8 w-8 rounded-full bg-white object-cover" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold">{assistantName.slice(0, 1).toUpperCase()}</div>
        )}
        <div>
          <p className="text-sm font-semibold leading-tight">{assistantName}</p>
          <p className="text-xs opacity-80">{handoff ? "A team member will reply here" : "AI assistant"}{preview ? " (preview)" : ""}</p>
        </div>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto bg-[#F5F7F3] px-4 py-4">
        <Bubble role="assistant" color={color}>{welcome}</Bubble>
        {messages.map((m) => <Bubble key={m.id} role={m.role} color={color}>{m.content}</Bubble>)}
        {busy && <p className="text-xs text-[#718078]">{assistantName} is typing</p>}
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
        {handoff && <p className="rounded-lg bg-white px-3 py-2 text-xs text-[#718078]">You have been connected to our team. Keep this window open to see their reply.</p>}
        {canRate && (
          <div className="rounded-lg bg-white px-3 py-2 text-xs text-[#718078]">
            Did this answer your question?
            <button onClick={() => feedback({ resolved: true, rating: 5 })} className="ml-2 font-semibold" style={{ color }}>Yes, thanks</button>
          </div>
        )}
        {done && <p className="text-xs text-[#718078]">Thank you for your feedback.</p>}
        <div ref={bottom} />
      </div>
      <form onSubmit={send} className="flex items-center gap-2 border-t border-[#E5EAE4] p-3">
        <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={2000} placeholder="Type your message" aria-label="Message"
          className="flex-1 rounded-full border border-[#E5EAE4] px-4 py-2 text-sm outline-none focus:border-[#123D32]" />
        <button type="submit" disabled={busy || !input.trim()} aria-label="Send" className="flex h-9 w-9 items-center justify-center rounded-full text-white disabled:opacity-50" style={{ background: color }}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

function Bubble({ role, color, children }: { role: string; color: string; children: React.ReactNode }) {
  const mine = role === "customer";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${mine ? "text-white" : "bg-white shadow-sm"}`} style={mine ? { background: color } : undefined}>
        {role === "human" && <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-[#718078]">Team member</span>}
        {children}
      </div>
    </div>
  );
}
