import Link from "next/link";
import { canManage, getContext } from "@/lib/context";
import { Badge, Card, EmptyState, Page, PageHeader, timeAgo } from "@/components/dashboard/ui";
import { ActionForm, MiniForm, Submit } from "@/components/dashboard/ActionForm";
import { addKnowledge, deleteSource } from "./actions";

export default async function KnowledgePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const { supabase, orgId, role } = await getContext();
  const manage = canManage(role);
  const [{ data: sources }, search] = await Promise.all([
    supabase.from("assistar_knowledge_sources").select("id, name, kind, status, error, size_bytes, chunk_count, created_at").eq("organization_id", orgId).order("created_at", { ascending: false }),
    q.trim() ? supabase.rpc("assistar_search_knowledge", { org: orgId, q: q.trim().slice(0, 300), lim: 8 }) : Promise.resolve({ data: null }),
  ]);
  return (
    <Page>
      <PageHeader title="Knowledge Base" description="Your agents answer from this content. Upload documents or paste text, and it is indexed for retrieval." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <form className="flex gap-2"><input name="q" defaultValue={q} className="input" placeholder="Search your knowledge, for example: refund policy" aria-label="Search knowledge" /><button className="btn-secondary" type="submit">Search</button></form>
            {search.data && (
              <div className="mt-4 space-y-3">
                {search.data.length === 0 ? <p className="text-sm text-ink-muted">No matches. An agent asked this would say it does not know, and the question would show up as a knowledge gap in Monitoring.</p> :
                  search.data.map((r: { id: string; source_name: string; content: string }) => (<div key={r.id} className="rounded-lg bg-surface p-3 text-sm"><p className="text-xs font-semibold text-forest">{r.source_name}</p><p className="mt-1 whitespace-pre-wrap">{r.content.slice(0, 400)}{r.content.length > 400 ? "…" : ""}</p></div>))}
              </div>
            )}
          </Card>
          {!sources?.length ? <EmptyState title="No knowledge yet" body="Add your policies, FAQs, product information or help articles. Agents will not invent company facts without them." /> : (
            <Card className="p-0"><ul className="divide-y divide-line">
              {sources.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0"><Link href={`/dashboard/knowledge/${s.id}`} className="block truncate font-medium hover:underline">{s.name}</Link>
                    <p className="text-xs text-ink-muted">{s.kind} · {(s.size_bytes / 1024).toFixed(1)} KB · {s.chunk_count} sections · {timeAgo(s.created_at)}</p>
                    {s.status === "failed" && <p className="mt-1 text-xs text-red-700">{s.error}</p>}</div>
                  <div className="flex items-center gap-2"><Badge value={s.status} />{manage && <MiniForm action={deleteSource} fields={{ id: s.id }} confirm={`Delete ${s.name}?`} className="btn-secondary py-1.5 text-xs text-red-700">Delete</MiniForm>}</div>
                </li>))}</ul></Card>
          )}
        </div>
        <Card className="h-fit"><h2 className="mb-1 font-bold text-forest">Add knowledge</h2>
          <p className="mb-4 text-xs text-ink-muted">PDF, DOCX, TXT, MD, CSV or JSON up to 3 MB. Scanned PDFs without text cannot be read.</p>
          {manage ? (
            <ActionForm action={addKnowledge} resetOnSuccess encType="multipart/form-data">
              <div className="space-y-3">
                <div><label className="label" htmlFor="name">Name</label><input id="name" name="name" className="input" maxLength={160} placeholder="Returns policy" /></div>
                <div><label className="label" htmlFor="file">File</label><input id="file" name="file" type="file" accept=".pdf,.docx,.txt,.md,.csv,.json" className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-surface file:px-4 file:py-2 file:text-sm file:font-semibold" /></div>
                <p className="text-center text-xs text-ink-muted">or paste text</p>
                <div><label className="sr-only" htmlFor="content">Text</label><textarea id="content" name="content" rows={5} className="input" placeholder="Paste FAQs, policies or help articles" /></div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="kind" value="faq" className="accent-forest" /> This is an FAQ</label>
                <Submit pendingText="Processing" className="btn-primary">Add to knowledge base</Submit>
              </div>
            </ActionForm>
          ) : <p className="text-sm text-ink-muted">Only managers and admins can add knowledge.</p>}
        </Card>
      </div>
    </Page>
  );
}
