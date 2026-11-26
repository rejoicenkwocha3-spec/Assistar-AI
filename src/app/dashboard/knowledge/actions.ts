"use server";
import { revalidatePath } from "next/cache";
import { canManage, getContext, type ActionState } from "@/lib/context";
import { MAX_FILE_BYTES, chunkText, extractText } from "@/lib/knowledge";

export async function addKnowledge(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, orgId, user, role } = await getContext();
  if (!canManage(role)) return { error: "Only managers and admins can change the knowledge base." };
  const file = fd.get("file");
  const pasted = String(fd.get("content") ?? "").trim();
  let name = String(fd.get("name") ?? "").trim().slice(0, 160);
  const hasFile = file instanceof File && file.size > 0;
  if (!hasFile && !pasted) return { error: "Upload a file or paste some text." };
  if (hasFile && file.size > MAX_FILE_BYTES) return { error: `File is too large. The limit is ${MAX_FILE_BYTES / 1024 / 1024} MB.` };
  if (!hasFile && pasted.length > 200_000) return { error: "Pasted text is too long. Upload it as a file instead." };
  if (!name) name = hasFile ? file.name : pasted.slice(0, 40);

  const { data: src, error: insErr } = await supabase.from("assistar_knowledge_sources").insert({
    organization_id: orgId, name, kind: hasFile ? "file" : (String(fd.get("kind")) === "faq" ? "faq" : "text"),
    mime_type: hasFile ? file.type || null : "text/plain", size_bytes: hasFile ? file.size : pasted.length, status: "processing", created_by: user.id,
  }).select("id").single();
  if (insErr || !src) return { error: insErr?.message ?? "Could not create the source." };

  try {
    const text = (hasFile ? await extractText(file) : pasted).replace(/\u0000/g, "");
    const chunks = chunkText(text);
    if (!chunks.length) throw new Error("No readable text was found. Scanned PDFs need OCR first.");
    for (let i = 0; i < chunks.length; i += 100) {
      const rows = chunks.slice(i, i + 100).map((content, j) => ({ organization_id: orgId, source_id: src.id, position: i + j, content }));
      const { error } = await supabase.from("assistar_knowledge_chunks").insert(rows);
      if (error) throw new Error(error.message);
    }
    await supabase.from("assistar_knowledge_sources").update({ status: "ready", content: text.slice(0, 200_000), chunk_count: chunks.length }).eq("id", src.id);
    await supabase.from("assistar_audit_logs").insert({ organization_id: orgId, user_id: user.id, action: "knowledge.added", entity: "knowledge", entity_id: src.id, meta: { name, chunks: chunks.length } });
    revalidatePath("/dashboard/knowledge");
    return { ok: true, message: `Processed "${name}" into ${chunks.length} searchable section${chunks.length === 1 ? "" : "s"}.` };
  } catch (e) {
    await supabase.from("assistar_knowledge_chunks").delete().eq("source_id", src.id);
    await supabase.from("assistar_knowledge_sources").update({ status: "failed", error: e instanceof Error ? e.message : "Processing failed" }).eq("id", src.id);
    revalidatePath("/dashboard/knowledge");
    return { error: `Could not process this file: ${e instanceof Error ? e.message : "unknown error"}` };
  }
}

export async function deleteSource(fd: FormData) {
  const { supabase, orgId, user, role } = await getContext();
  if (!canManage(role)) return;
  const id = String(fd.get("id") ?? "");
  await supabase.from("assistar_knowledge_sources").delete().eq("id", id).eq("organization_id", orgId);
  await supabase.from("assistar_audit_logs").insert({ organization_id: orgId, user_id: user.id, action: "knowledge.deleted", entity: "knowledge", entity_id: id });
  revalidatePath("/dashboard/knowledge");
}
