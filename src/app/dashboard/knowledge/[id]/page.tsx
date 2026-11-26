import Link from "next/link";
import { notFound } from "next/navigation";
import { getContext } from "@/lib/context";
import { Badge, Card, Page, PageHeader } from "@/components/dashboard/ui";

export default async function SourcePreview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, orgId } = await getContext();
  const { data: s } = await supabase.from("assistar_knowledge_sources").select("*").eq("id", id).eq("organization_id", orgId).maybeSingle();
  if (!s) notFound();
  return (
    <Page>
      <PageHeader title={s.name} description={`${s.kind} · ${s.chunk_count} indexed sections`} actions={<><Badge value={s.status} /><Link href="/dashboard/knowledge" className="btn-secondary py-1.5 text-xs">Back</Link></>} />
      <Card>{s.status === "failed" ? <p className="text-sm text-red-700">{s.error}</p> : <pre className="max-h-[600px] overflow-auto whitespace-pre-wrap text-sm leading-relaxed">{s.content.slice(0, 20000)}{s.content.length > 20000 ? "\n\n… preview truncated, the full text is indexed" : ""}</pre>}</Card>
    </Page>
  );
}
