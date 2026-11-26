-- Assistar AI: platform tables. All objects are prefixed assistar_ because the Supabase
-- project is shared with other apps. Requires 0001_auth_foundation.sql. Safe to re-run.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.assistar_org_role(org uuid)
returns text language sql stable security definer set search_path = '' as $$
  select role from public.organization_members where organization_id = org and user_id = auth.uid();
$$;

create or replace function public.assistar_can_manage(org uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.assistar_org_role(org) in ('owner', 'admin', 'manager'), false);
$$;

-- For people who already exist in the shared auth project but have no Assistar workspace yet.
create or replace function public.assistar_ensure_workspace()
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  org_id uuid;
  u record;
  display_name text;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  select organization_id into org_id from public.organization_members where user_id = uid limit 1;
  if org_id is not null then return org_id; end if;
  select id, email, raw_user_meta_data into u from auth.users where id = uid;
  display_name := coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), split_part(u.email, '@', 1));
  insert into public.profiles (id, full_name, email) values (uid, display_name, u.email)
    on conflict (id) do update set email = coalesce(public.profiles.email, excluded.email);
  insert into public.organizations (name, created_by) values (display_name || '''s Workspace', uid) returning id into org_id;
  insert into public.organization_members (organization_id, user_id, role) values (org_id, uid, 'owner');
  insert into public.assistar_workspaces (organization_id, name) values (org_id, 'Main workspace');
  return org_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Agents and versions
-- ---------------------------------------------------------------------------
create table if not exists public.assistar_agents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '',
  template text,
  status text not null default 'draft' check (status in ('draft', 'published', 'paused')),
  instructions text not null default '',
  personality text not null default '',
  tone text not null default 'professional',
  provider text not null default 'anthropic' check (provider in ('anthropic', 'openai')),
  model text not null default 'claude-haiku-5-5',
  welcome_message text not null default 'Hello. How can I help you today?',
  response_rules text not null default '',
  escalation_rules text not null default '',
  guardrails text not null default '',
  version int not null default 1,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists assistar_agents_org_idx on public.assistar_agents (organization_id);
-- Customers only ever see published_config. Editing an agent never changes it; publishing does.
alter table public.assistar_agents add column if not exists published_version int;
alter table public.assistar_agents add column if not exists published_config jsonb;

create table if not exists public.assistar_agent_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  agent_id uuid not null references public.assistar_agents (id) on delete cascade,
  version int not null,
  snapshot jsonb not null,
  note text not null default '',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (agent_id, version)
);
create index if not exists assistar_agent_versions_agent_idx on public.assistar_agent_versions (agent_id);

-- ---------------------------------------------------------------------------
-- Knowledge base
-- ---------------------------------------------------------------------------
create table if not exists public.assistar_knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  kind text not null default 'text' check (kind in ('text', 'file', 'faq')),
  mime_type text,
  size_bytes int not null default 0,
  status text not null default 'processing' check (status in ('processing', 'ready', 'failed')),
  error text,
  content text not null default '',
  chunk_count int not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists assistar_knowledge_sources_org_idx on public.assistar_knowledge_sources (organization_id);

create table if not exists public.assistar_knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  source_id uuid not null references public.assistar_knowledge_sources (id) on delete cascade,
  position int not null default 0,
  content text not null,
  tsv tsvector generated always as (to_tsvector('english', content)) stored
);
create index if not exists assistar_knowledge_chunks_source_idx on public.assistar_knowledge_chunks (source_id);
create index if not exists assistar_knowledge_chunks_tsv_idx on public.assistar_knowledge_chunks using gin (tsv);

create or replace function public.assistar_search_knowledge(org uuid, q text, lim int default 5)
returns table (id uuid, source_id uuid, source_name text, content text, rank real)
language sql stable set search_path = '' as $$
  -- Any matching term counts (OR), best matches first. plainto_tsquery strips stop words and punctuation.
  with query as (select replace(plainto_tsquery('english', q)::text, '&', '|')::tsquery as tq)
  select c.id, c.source_id, s.name, c.content, ts_rank(c.tsv, query.tq) as rank
  from query
  join public.assistar_knowledge_chunks c on c.tsv @@ query.tq
  join public.assistar_knowledge_sources s on s.id = c.source_id
  where c.organization_id = org
  order by rank desc
  limit least(greatest(lim, 1), 20);
$$;

-- ---------------------------------------------------------------------------
-- Customers, context, conversations, messages
-- ---------------------------------------------------------------------------
create table if not exists public.assistar_customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  visitor_id text,
  name text,
  email text,
  phone text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists assistar_customers_visitor_uidx on public.assistar_customers (organization_id, visitor_id) where visitor_id is not null;
create index if not exists assistar_customers_org_idx on public.assistar_customers (organization_id);

create table if not exists public.assistar_customer_context (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  customer_id uuid not null references public.assistar_customers (id) on delete cascade,
  key text not null check (char_length(key) between 1 and 80),
  value text not null check (char_length(value) <= 2000),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists assistar_customer_context_customer_idx on public.assistar_customer_context (customer_id);

create table if not exists public.assistar_conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  agent_id uuid references public.assistar_agents (id) on delete set null,
  customer_id uuid references public.assistar_customers (id) on delete set null,
  channel text not null default 'web' check (channel in ('web', 'email', 'whatsapp', 'sms', 'voice', 'test')),
  status text not null default 'open' check (status in ('open', 'pending', 'escalated', 'resolved')),
  subject text not null default '',
  assigned_to uuid references auth.users (id) on delete set null,
  resolved_by_ai boolean not null default false,
  satisfaction int check (satisfaction between 1 and 5),
  summary text,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);
create index if not exists assistar_conversations_org_status_idx on public.assistar_conversations (organization_id, status, last_message_at desc);
create index if not exists assistar_conversations_agent_idx on public.assistar_conversations (agent_id);

create table if not exists public.assistar_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  conversation_id uuid not null references public.assistar_conversations (id) on delete cascade,
  role text not null check (role in ('customer', 'assistant', 'human', 'system', 'note')),
  content text not null,
  author_id uuid references auth.users (id) on delete set null,
  latency_ms int,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists assistar_messages_conv_idx on public.assistar_messages (conversation_id, created_at);
create index if not exists assistar_messages_org_idx on public.assistar_messages (organization_id, created_at desc);

create table if not exists public.assistar_handoffs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  conversation_id uuid not null references public.assistar_conversations (id) on delete cascade,
  reason text not null default '',
  summary text,
  requested_by text not null default 'agent' check (requested_by in ('agent', 'customer', 'human')),
  assigned_to uuid references auth.users (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists assistar_handoffs_org_idx on public.assistar_handoffs (organization_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Widgets, actions, tests
-- ---------------------------------------------------------------------------
create table if not exists public.assistar_widgets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  agent_id uuid references public.assistar_agents (id) on delete set null,
  public_key text not null unique default replace(gen_random_uuid()::text, '-', ''),
  name text not null default 'Website chat',
  assistant_name text not null default 'Assistant',
  brand_color text not null default '#123D32' check (brand_color ~ '^#[0-9a-fA-F]{6}$'),
  welcome_message text not null default 'Hello. How can I help you today?',
  logo_url text,
  allowed_origins text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists assistar_widgets_org_idx on public.assistar_widgets (organization_id);

create table if not exists public.assistar_actions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9_]{2,40}$'),
  name text not null,
  description text not null default '',
  url text not null check (url ~ '^https://'),
  method text not null default 'POST' check (method in ('POST', 'PUT', 'PATCH')),
  headers jsonb not null default '{}'::jsonb,
  parameters text[] not null default '{}',
  requires_confirmation boolean not null default true,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table if not exists public.assistar_action_executions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  action_id uuid not null references public.assistar_actions (id) on delete cascade,
  conversation_id uuid references public.assistar_conversations (id) on delete set null,
  input jsonb not null default '{}'::jsonb,
  status text not null default 'pending_approval' check (status in ('pending_approval', 'succeeded', 'failed', 'rejected')),
  output text,
  error text,
  duration_ms int,
  requested_by text not null default 'agent',
  decided_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists assistar_action_exec_org_idx on public.assistar_action_executions (organization_id, created_at desc);

create table if not exists public.assistar_test_scenarios (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  agent_id uuid not null references public.assistar_agents (id) on delete cascade,
  name text not null,
  prompt text not null,
  expected text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists assistar_test_scenarios_agent_idx on public.assistar_test_scenarios (agent_id);

create table if not exists public.assistar_test_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  scenario_id uuid references public.assistar_test_scenarios (id) on delete cascade,
  agent_id uuid not null references public.assistar_agents (id) on delete cascade,
  agent_version int,
  prompt text not null,
  response text,
  error text,
  latency_ms int,
  verdict text check (verdict in ('pass', 'fail')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists assistar_test_runs_agent_idx on public.assistar_test_runs (agent_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Team, integrations, billing, usage, audit
-- ---------------------------------------------------------------------------
create table if not exists public.assistar_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  role text not null default 'agent' check (role in ('admin', 'manager', 'agent')),
  token text not null unique default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists assistar_invitations_org_idx on public.assistar_invitations (organization_id);

create table if not exists public.assistar_integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  provider text not null,
  status text not null default 'disconnected' check (status in ('disconnected', 'connected', 'error')),
  config jsonb not null default '{}'::jsonb,
  last_tested_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  unique (organization_id, provider)
);

create table if not exists public.assistar_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  plan_key text not null,
  status text not null default 'active' check (status in ('active', 'cancelled', 'past_due')),
  provider text not null default 'selar',
  provider_reference text,
  customer_email text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists assistar_subscriptions_org_uidx on public.assistar_subscriptions (organization_id);

create table if not exists public.assistar_payment_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete set null,
  provider text not null default 'selar',
  event_type text,
  reference text,
  email text,
  amount numeric,
  currency text,
  verified boolean not null default false,
  processed boolean not null default false,
  note text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists assistar_payment_events_org_idx on public.assistar_payment_events (organization_id, created_at desc);
create unique index if not exists assistar_payment_events_ref_uidx on public.assistar_payment_events (provider, reference) where reference is not null;

create table if not exists public.assistar_usage_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  kind text not null,
  quantity int not null default 1,
  agent_id uuid references public.assistar_agents (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists assistar_usage_org_idx on public.assistar_usage_events (organization_id, created_at desc);

create table if not exists public.assistar_audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity text,
  entity_id text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists assistar_audit_org_idx on public.assistar_audit_logs (organization_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Invitation acceptance (the invited user may not be a member yet)
-- ---------------------------------------------------------------------------
create or replace function public.assistar_accept_invitation(invite_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  inv record;
  user_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into inv from public.assistar_invitations where token = invite_token and status = 'pending';
  if not found then raise exception 'invitation not found or already used'; end if;
  if lower(inv.email) <> user_email then raise exception 'this invitation was sent to a different email address'; end if;
  insert into public.organization_members (organization_id, user_id, role)
    values (inv.organization_id, auth.uid(), inv.role)
    on conflict (organization_id, user_id) do nothing;
  update public.assistar_invitations set status = 'accepted' where id = inv.id;
  return inv.organization_id;
end;
$$;

-- Team management by owners and admins.
create or replace function public.assistar_set_member_role(org uuid, member uuid, new_role text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.assistar_is_org_admin(org) then raise exception 'not allowed'; end if;
  if new_role not in ('admin', 'manager', 'agent') then raise exception 'invalid role'; end if;
  update public.organization_members set role = new_role
    where organization_id = org and user_id = member and role <> 'owner';
end;
$$;

create or replace function public.assistar_remove_member(org uuid, member uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.assistar_is_org_admin(org) then raise exception 'not allowed'; end if;
  delete from public.organization_members where organization_id = org and user_id = member and role <> 'owner';
end;
$$;

-- Member directory for assignment and the team page.
create or replace function public.assistar_org_members(org uuid)
returns table (user_id uuid, role text, full_name text, email text, joined_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select m.user_id, m.role, p.full_name, p.email, m.created_at
  from public.organization_members m
  left join public.profiles p on p.id = m.user_id
  where m.organization_id = org and public.assistar_is_org_member(org)
  order by m.created_at;
$$;

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
drop trigger if exists assistar_agents_touch on public.assistar_agents;
create trigger assistar_agents_touch before update on public.assistar_agents for each row execute function public.assistar_touch_updated_at();
drop trigger if exists assistar_widgets_touch on public.assistar_widgets;
create trigger assistar_widgets_touch before update on public.assistar_widgets for each row execute function public.assistar_touch_updated_at();
drop trigger if exists assistar_customers_touch on public.assistar_customers;
create trigger assistar_customers_touch before update on public.assistar_customers for each row execute function public.assistar_touch_updated_at();
drop trigger if exists assistar_subscriptions_touch on public.assistar_subscriptions;
create trigger assistar_subscriptions_touch before update on public.assistar_subscriptions for each row execute function public.assistar_touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
--   read:   any member of the organization
--   write:  members for support data, managers and above for configuration,
--           admins for team, integrations and billing visibility
--   server: subscriptions and payment events are written only with the service role
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'assistar_agents','assistar_agent_versions','assistar_knowledge_sources','assistar_knowledge_chunks',
    'assistar_customers','assistar_customer_context','assistar_conversations','assistar_messages',
    'assistar_handoffs','assistar_widgets','assistar_actions','assistar_action_executions',
    'assistar_test_scenarios','assistar_test_runs','assistar_invitations','assistar_integrations',
    'assistar_subscriptions','assistar_payment_events','assistar_usage_events','assistar_audit_logs'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s read" on public.%I', t, t);
  end loop;
end $$;

-- Read policies
create policy "assistar_agents read" on public.assistar_agents for select using (public.assistar_is_org_member(organization_id));
create policy "assistar_agent_versions read" on public.assistar_agent_versions for select using (public.assistar_is_org_member(organization_id));
create policy "assistar_knowledge_sources read" on public.assistar_knowledge_sources for select using (public.assistar_is_org_member(organization_id));
create policy "assistar_knowledge_chunks read" on public.assistar_knowledge_chunks for select using (public.assistar_is_org_member(organization_id));
create policy "assistar_customers read" on public.assistar_customers for select using (public.assistar_is_org_member(organization_id));
create policy "assistar_customer_context read" on public.assistar_customer_context for select using (public.assistar_is_org_member(organization_id));
create policy "assistar_conversations read" on public.assistar_conversations for select using (public.assistar_is_org_member(organization_id));
create policy "assistar_messages read" on public.assistar_messages for select using (public.assistar_is_org_member(organization_id));
create policy "assistar_handoffs read" on public.assistar_handoffs for select using (public.assistar_is_org_member(organization_id));
create policy "assistar_widgets read" on public.assistar_widgets for select using (public.assistar_is_org_member(organization_id));
-- Action definitions can hold webhook secrets in headers, so only managers and above can read them.
create policy "assistar_actions read" on public.assistar_actions for select using (public.assistar_can_manage(organization_id));
create policy "assistar_action_executions read" on public.assistar_action_executions for select using (public.assistar_is_org_member(organization_id));
create policy "assistar_test_scenarios read" on public.assistar_test_scenarios for select using (public.assistar_is_org_member(organization_id));
create policy "assistar_test_runs read" on public.assistar_test_runs for select using (public.assistar_is_org_member(organization_id));
create policy "assistar_usage_events read" on public.assistar_usage_events for select using (public.assistar_is_org_member(organization_id));
create policy "assistar_subscriptions read" on public.assistar_subscriptions for select using (public.assistar_is_org_member(organization_id));
create policy "assistar_invitations read" on public.assistar_invitations for select using (public.assistar_is_org_admin(organization_id));
create policy "assistar_integrations read" on public.assistar_integrations for select using (public.assistar_is_org_admin(organization_id));
create policy "assistar_payment_events read" on public.assistar_payment_events for select using (organization_id is not null and public.assistar_is_org_admin(organization_id));
create policy "assistar_audit_logs read" on public.assistar_audit_logs for select using (public.assistar_is_org_admin(organization_id));

-- Write policies (managers and above): configuration
do $$
declare t text;
begin
  foreach t in array array[
    'assistar_agents','assistar_agent_versions','assistar_knowledge_sources','assistar_knowledge_chunks',
    'assistar_widgets','assistar_actions','assistar_test_scenarios','assistar_test_runs'
  ] loop
    execute format('drop policy if exists "%s write" on public.%I', t, t);
    execute format($f$create policy "%s write" on public.%I for all
      using (public.assistar_can_manage(organization_id))
      with check (public.assistar_can_manage(organization_id))$f$, t, t);
  end loop;
  -- Support data: any member
  foreach t in array array[
    'assistar_customers','assistar_customer_context','assistar_conversations','assistar_messages',
    'assistar_handoffs','assistar_action_executions','assistar_usage_events'
  ] loop
    execute format('drop policy if exists "%s write" on public.%I', t, t);
    execute format($f$create policy "%s write" on public.%I for all
      using (public.assistar_is_org_member(organization_id))
      with check (public.assistar_is_org_member(organization_id))$f$, t, t);
  end loop;
  -- Admin only
  foreach t in array array['assistar_invitations','assistar_integrations','assistar_audit_logs'] loop
    execute format('drop policy if exists "%s write" on public.%I', t, t);
    execute format($f$create policy "%s write" on public.%I for all
      using (public.assistar_is_org_admin(organization_id))
      with check (public.assistar_is_org_admin(organization_id))$f$, t, t);
  end loop;
end $$;

-- Audit logs are append only for clients.
drop policy if exists "assistar_audit_logs write" on public.assistar_audit_logs;
drop policy if exists "assistar_audit_logs insert" on public.assistar_audit_logs;
create policy "assistar_audit_logs insert" on public.assistar_audit_logs for insert
  with check (public.assistar_is_org_member(organization_id));

-- Admin policy for organization settings and member visibility is defined in 0001.
grant execute on function public.assistar_ensure_workspace() to authenticated;
grant execute on function public.assistar_accept_invitation(text) to authenticated;
grant execute on function public.assistar_set_member_role(uuid, uuid, text) to authenticated;
grant execute on function public.assistar_remove_member(uuid, uuid) to authenticated;
grant execute on function public.assistar_org_members(uuid) to authenticated;
grant execute on function public.assistar_search_knowledge(uuid, text, int) to authenticated;
