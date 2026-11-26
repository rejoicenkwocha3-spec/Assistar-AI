"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { flatten, onboardingSchema, type FieldErrors } from "@/lib/validation";
import { Alert } from "./AuthShell";
import { TEMPLATES } from "@/config/templates";
import { snapshotOf } from "@/lib/agents";
import { Field } from "./Field";

const INDUSTRIES = ["Ecommerce", "SaaS", "Financial services", "Healthcare", "Telecommunications", "Travel and hospitality", "Retail", "Marketing agency", "Enterprise", "Other"];
const NEEDS = ["Answer customer questions", "Order and account support", "Appointment booking", "Lead qualification", "Technical support", "Billing support"];
const CHANNELS = ["Website live chat", "Email", "WhatsApp", "SMS", "Voice"];

function Checks({ name, options, error }: { name: string; options: string[]; error?: string }) {
  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <label key={o} className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2 text-sm">
            <input type="checkbox" name={name} value={o} className="h-4 w-4 accent-forest" /> {o}
          </label>
        ))}
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export function OnboardingForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    const parsed = onboardingSchema.safeParse({
      businessName: fd.get("businessName"), website: fd.get("website"), industry: fd.get("industry"),
      description: fd.get("description"), supportNeeds: fd.getAll("supportNeeds"), channels: fd.getAll("channels"),
    });
    if (!parsed.success) return setErrors(flatten(parsed.error));
    setErrors({});
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setFormError("Your session expired. Sign in again.");
      const { data: member, error: mErr } = await supabase
        .from("organization_members").select("organization_id").eq("user_id", user.id).eq("role", "owner").order("created_at").limit(1).single();
      if (mErr || !member) return setFormError("We could not find your workspace. Please contact support.");
      const v = parsed.data;
      const { error: oErr } = await supabase.from("organizations").update({
        name: v.businessName, website: v.website || null, industry: v.industry,
        description: v.description || null, support_needs: v.supportNeeds, preferred_channels: v.channels,
      }).eq("id", member.organization_id);
      if (oErr) return setFormError(oErr.message);
      const tplKey = String(fd.get("template") ?? "");
      const tpl = TEMPLATES.find((t) => t.key === tplKey);
      if (tpl) {
        const { data: agent } = await supabase.from("assistar_agents").insert({
          organization_id: member.organization_id, name: tpl.name, description: tpl.description, template: tpl.key,
          instructions: tpl.instructions, tone: tpl.tone, escalation_rules: tpl.escalation, welcome_message: tpl.welcome, created_by: user.id,
        }).select("*").single();
        if (agent) await supabase.from("assistar_agent_versions").insert({ organization_id: member.organization_id, agent_id: agent.id, version: 1, snapshot: snapshotOf(agent), note: "Created during onboarding", created_by: user.id });
      }
      const { error: pErr } = await supabase.from("profiles").update({ onboarded: true }).eq("id", user.id);
      if (pErr) return setFormError(pErr.message);
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setFormError("We could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && <Alert kind="error">{formError}</Alert>}
      <Field label="Business name" name="businessName" error={errors.businessName} />
      <Field label="Business website (optional)" name="website" placeholder="company.com" error={errors.website} />
      <div>
        <label className="label" htmlFor="industry">Industry</label>
        <select id="industry" name="industry" defaultValue="" className={`input ${errors.industry ? "input-error" : ""}`}>
          <option value="" disabled>Select an industry</option>
          {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
        </select>
        {errors.industry && <p className="field-error">{errors.industry}</p>}
      </div>
      <div>
        <label className="label" htmlFor="description">Business description (optional)</label>
        <textarea id="description" name="description" rows={3} className="input" />
      </div>
      <div><span className="label">Primary support needs</span><Checks name="supportNeeds" options={NEEDS} error={errors.supportNeeds} /></div>
      <div><span className="label">Preferred channels</span><Checks name="channels" options={CHANNELS} error={errors.channels} /></div>
      <div>
        <label className="label" htmlFor="template">Create your first assistant (optional)</label>
        <select id="template" name="template" defaultValue="" className="input">
          <option value="">Skip for now</option>
          {TEMPLATES.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
        </select>
        <p className="mt-1 text-xs text-ink-muted">You can edit it in Agent Studio. It stays a draft until you publish it.</p>
      </div>
      <button type="submit" disabled={loading} className="btn-primary">
        {loading && <Loader2 size={16} className="animate-spin" />} Finish setup
      </button>
    </form>
  );
}
