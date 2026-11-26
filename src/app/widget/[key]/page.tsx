import { notFound } from "next/navigation";
import { ChatWindow } from "@/components/widget/ChatWindow";
import { loadWidget } from "@/lib/chat";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

export default async function WidgetPage({ params, searchParams }: { params: Promise<{ key: string }>; searchParams: Promise<{ preview?: string }> }) {
  const { key } = await params;
  const { preview } = await searchParams;
  const { widget } = await loadWidget(key).catch(() => ({ widget: null }));
  if (!widget || !widget.active) notFound();
  return (
    <ChatWindow
      widgetKey={widget.public_key}
      assistantName={widget.assistant_name}
      color={widget.brand_color}
      welcome={widget.welcome_message}
      logoUrl={widget.logo_url}
      preview={preview === "1"}
    />
  );
}
