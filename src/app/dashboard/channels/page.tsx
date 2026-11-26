import Link from "next/link";
import { Globe, Mail, MessageCircle, Phone, Smartphone } from "lucide-react";
import { getContext } from "@/lib/context";
import { Badge, Card, Page, PageHeader } from "@/components/dashboard/ui";

export default async function ChannelsPage() {
  const { supabase, orgId } = await getContext();
  const [{ data: widgets }, { count: webConvs }] = await Promise.all([
    supabase.from("assistar_widgets").select("id, active, agent_id").eq("organization_id", orgId),
    supabase.from("assistar_conversations").select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("channel", "web"),
  ]);
  const webLive = (widgets ?? []).some((w) => w.active && w.agent_id);
  const others = [
    { icon: Mail, name: "Email", needs: "An email provider with inbound parsing, for example your mail domain with a forwarding webhook." },
    { icon: MessageCircle, name: "WhatsApp", needs: "A WhatsApp Business account approved by Meta, and either the Cloud API or a provider such as Twilio." },
    { icon: Smartphone, name: "SMS", needs: "A Twilio (or similar) phone number with a webhook pointing to Assistar AI." },
    { icon: Phone, name: "Voice", needs: "A voice provider with speech to text and text to speech, plus a phone number." },
  ];
  return (
    <Page>
      <PageHeader title="Channels" description="Where customers reach your assistants. A channel is shown as connected only when it really works." />
      <div className="grid gap-4 md:grid-cols-2">
        <Card><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><Globe className="text-forest" /><h2 className="font-bold text-forest">Website live chat</h2></div><Badge value={webLive ? "connected" : "disconnected"} /></div>
          <p className="mt-3 text-sm text-ink-muted">{webLive ? `Live. ${webConvs ?? 0} conversation${webConvs === 1 ? "" : "s"} so far.` : "Create a widget, attach a published agent, and install the script on your site."}</p>
          <Link href="/dashboard/widget" className="mt-4 inline-flex rounded-full bg-forest px-5 py-2 text-sm font-semibold text-white hover:bg-forest-deep">Open widget settings</Link></Card>
        {others.map(({ icon: I, name, needs }) => (
          <Card key={name}><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><I className="text-ink-muted" /><h2 className="font-bold text-forest">{name}</h2></div><Badge value="disconnected" /></div>
            <p className="mt-3 text-sm text-ink-muted">Not connected. Requires: {needs}</p>
            <p className="mt-2 text-xs text-ink-muted">This channel needs provider credentials and testing before it can be enabled.</p></Card>
        ))}
      </div>
    </Page>
  );
}
