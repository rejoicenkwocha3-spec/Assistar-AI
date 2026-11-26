import { Activity, BarChart3, Bot, CreditCard, FlaskConical, LayoutDashboard, MessageSquare, Library, PlugZap, Radio, Settings, Sparkles, Users, Workflow, Code2 } from "lucide-react";

export const NAV = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "AI Agents", href: "/dashboard/agents", icon: Bot },
  { label: "Agent Studio", href: "/dashboard/studio", icon: Sparkles },
  { label: "Conversations", href: "/dashboard/conversations", icon: MessageSquare },
  { label: "Knowledge Base", href: "/dashboard/knowledge", icon: Library },
  { label: "Channels", href: "/dashboard/channels", icon: Radio },
  { label: "Website Widget", href: "/dashboard/widget", icon: Code2 },
  { label: "Actions", href: "/dashboard/actions", icon: Workflow },
  { label: "Testing", href: "/dashboard/testing", icon: FlaskConical },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Monitoring", href: "/dashboard/monitoring", icon: Activity },
  { label: "Team", href: "/dashboard/team", icon: Users },
  { label: "Integrations", href: "/dashboard/integrations", icon: PlugZap },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
] as const;
