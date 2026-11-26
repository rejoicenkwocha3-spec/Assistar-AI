"use server";
import { revalidatePath } from "next/cache";
import { getContext, type ActionState } from "@/lib/context";

const str = (fd: FormData, k: string, max = 4000) => String(fd.get(k) ?? "").trim().slice(0, max);
const refresh = (id: string) => { revalidatePath(`/dashboard/conversations/${id}`); revalidatePath("/dashboard/conversations"); };

async function guard(id: string) {
  const ctx = await getContext();
  const { data } = await ctx.supabase.from("assistar_conversations").select("id, status, assigned_to, customer_id").eq("id", id).eq("organization_id", ctx.orgId).maybeSingle();
  return { ctx, conv: data };
}

export async function replyToCustomer(_p: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id"), content = str(fd, "content", 4000);
  if (!content) return { error: "Write a reply first." };
  const { ctx, conv } = await guard(id);
  if (!conv) return { error: "Conversation not found." };
  const { error } = await ctx.supabase.from("assistar_messages").insert({ organization_id: ctx.orgId, conversation_id: id, role: "human", content, author_id: ctx.user.id });
  if (error) return { error: error.message };
  // A person has taken over: the assistant stops answering until the conversation is resolved.
  await ctx.supabase.from("assistar_conversations").update({ status: "pending", assigned_to: conv.assigned_to ?? ctx.user.id, last_message_at: new Date().toISOString() }).eq("id", id);
  refresh(id);
  return { ok: true, message: "Reply sent." };
}

export async function addNote(_p: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id"), content = str(fd, "content", 4000);
  if (!content) return { error: "Write a note first." };
  const { ctx, conv } = await guard(id);
  if (!conv) return { error: "Conversation not found." };
  const { error } = await ctx.supabase.from("assistar_messages").insert({ organization_id: ctx.orgId, conversation_id: id, role: "note", content, author_id: ctx.user.id });
  if (error) return { error: error.message };
  refresh(id);
  return { ok: true, message: "Note added. Customers never see internal notes." };
}

export async function setStatus(fd: FormData) {
  const id = str(fd, "id"), status = str(fd, "status");
  if (!["open", "pending", "escalated", "resolved"].includes(status)) return;
  const { ctx, conv } = await guard(id);
  if (!conv) return;
  await ctx.supabase.from("assistar_conversations").update({ status, ...(status === "resolved" ? {} : { resolved_by_ai: false }) }).eq("id", id);
  await ctx.supabase.from("assistar_messages").insert({ organization_id: ctx.orgId, conversation_id: id, role: "system", content: `Status changed to ${status}`, author_id: ctx.user.id });
  refresh(id);
}

export async function assign(fd: FormData) {
  const id = str(fd, "id"), userId = str(fd, "userId");
  const { ctx, conv } = await guard(id);
  if (!conv) return;
  let target: string | null = null;
  if (userId) {
    const { data: m } = await ctx.supabase.from("organization_members").select("user_id").eq("organization_id", ctx.orgId).eq("user_id", userId).maybeSingle();
    if (!m) return;
    target = userId;
  }
  await ctx.supabase.from("assistar_conversations").update({ assigned_to: target }).eq("id", id);
  await ctx.supabase.from("assistar_handoffs").update({ assigned_to: target }).eq("conversation_id", id).is("resolved_at", null);
  refresh(id);
}

export async function escalateConversation(fd: FormData) {
  const id = str(fd, "id"), reason = str(fd, "reason", 300) || "Escalated by team member";
  const { ctx, conv } = await guard(id);
  if (!conv) return;
  await ctx.supabase.from("assistar_conversations").update({ status: "escalated" }).eq("id", id);
  await ctx.supabase.from("assistar_handoffs").insert({ organization_id: ctx.orgId, conversation_id: id, reason, requested_by: "human" });
  await ctx.supabase.from("assistar_messages").insert({ organization_id: ctx.orgId, conversation_id: id, role: "system", content: `Escalated: ${reason}`, author_id: ctx.user.id });
  refresh(id);
}

export async function resolveConversation(fd: FormData) {
  const id = str(fd, "id");
  const { ctx, conv } = await guard(id);
  if (!conv) return;
  await ctx.supabase.from("assistar_conversations").update({ status: "resolved", resolved_by_ai: false }).eq("id", id);
  await ctx.supabase.from("assistar_handoffs").update({ resolved_at: new Date().toISOString() }).eq("conversation_id", id).is("resolved_at", null);
  await ctx.supabase.from("assistar_messages").insert({ organization_id: ctx.orgId, conversation_id: id, role: "system", content: "Conversation closed by a team member", author_id: ctx.user.id });
  refresh(id);
}

export async function saveCustomer(_p: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const { ctx, conv } = await guard(id);
  if (!conv?.customer_id) return { error: "No customer on this conversation." };
  const email = str(fd, "email", 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email." };
  const { error } = await ctx.supabase.from("assistar_customers").update({ name: str(fd, "name", 120) || null, email: email || null, phone: str(fd, "phone", 40) || null }).eq("id", conv.customer_id).eq("organization_id", ctx.orgId);
  if (error) return { error: error.message };
  refresh(id);
  return { ok: true, message: "Customer saved." };
}

export async function addContext(_p: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id"), key = str(fd, "key", 80), value = str(fd, "value", 2000);
  if (!key || !value) return { error: "Enter both a label and a value." };
  const { ctx, conv } = await guard(id);
  if (!conv?.customer_id) return { error: "No customer on this conversation." };
  const { error } = await ctx.supabase.from("assistar_customer_context").insert({ organization_id: ctx.orgId, customer_id: conv.customer_id, key, value, created_by: ctx.user.id });
  if (error) return { error: error.message };
  refresh(id);
  return { ok: true, message: "Saved. The assistant will use this in future replies to this customer." };
}

export async function deleteContext(fd: FormData) {
  const id = str(fd, "id"), ctxId = str(fd, "ctxId");
  const { ctx, conv } = await guard(id);
  if (!conv) return;
  await ctx.supabase.from("assistar_customer_context").delete().eq("id", ctxId).eq("organization_id", ctx.orgId);
  refresh(id);
}
