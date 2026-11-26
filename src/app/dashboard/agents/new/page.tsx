import { getContext, canManage } from "@/lib/context";
import { TEMPLATES, CUSTOM_TEMPLATE } from "@/config/templates";
import { Card, Page, PageHeader } from "@/components/dashboard/ui";
import { ActionForm, Submit } from "@/components/dashboard/ActionForm";
import { createAgent } from "../actions";

export default async function NewAgentPage() {
  const { role } = await getContext();
  if (!canManage(role)) return <Page><PageHeader title="New agent" description="Only managers and admins can create agents." /></Page>;
  return (
    <Page>
      <PageHeader title="Create an agent" description="Pick a template to start with proven instructions, then refine everything in Agent Studio." />
      <ActionForm action={createAgent}>
        <fieldset className="grid gap-3 md:grid-cols-2">
          <legend className="sr-only">Template</legend>
          {[CUSTOM_TEMPLATE, ...TEMPLATES].map((t, i) => (
            <label key={t.key} className="block cursor-pointer">
              <input type="radio" name="template" value={t.key} defaultChecked={i === 0} className="peer sr-only" />
              <Card className="h-full transition peer-checked:border-forest peer-checked:ring-2 peer-checked:ring-forest/20 peer-focus-visible:ring-2 peer-focus-visible:ring-forest">
                <p className="font-bold text-forest">{t.name}</p><p className="mt-1 text-sm text-ink-muted">{t.description}</p>
              </Card>
            </label>
          ))}
        </fieldset>
        <Card className="mt-6 grid gap-4 md:grid-cols-2">
          <div><label className="label" htmlFor="name">Agent name (optional)</label><input id="name" name="name" className="input" placeholder="Uses the template name if empty" maxLength={120} /></div>
          <div><label className="label" htmlFor="description">Description (optional)</label><input id="description" name="description" className="input" maxLength={500} /></div>
          <div className="md:col-span-2"><Submit className="btn-primary w-auto px-6">Create agent</Submit></div>
        </Card>
      </ActionForm>
    </Page>
  );
}
