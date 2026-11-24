-- Assistar AI: auth foundation (profiles, organizations, members, workspaces) with RLS.
-- Shared project: all objects we own are prefixed assistar_ so other apps are untouched.
-- Safe for an existing project: uses IF NOT EXISTS, adds missing columns, never drops data.
-- BEFORE running on an old project, run supabase/check_existing_schema.sql and review it.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text,
  avatar_url text,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  website text,
  industry text,
  description text,
  support_needs text[] not null default '{}',
  preferred_channels text[] not null default '{}',
  plan text not null default 'none',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'agent' check (role in ('owner', 'admin', 'manager', 'agent')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create index if not exists organization_members_user_idx on public.organization_members (user_id);

create table if not exists public.assistar_workspaces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index if not exists assistar_workspaces_org_idx on public.assistar_workspaces (organization_id);

-- If these tables already existed, make sure the columns this app needs are present.
alter table public.profiles add column if not exists full_name text not null default '';
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists onboarded boolean not null default false;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();
alter table public.organizations add column if not exists website text;
alter table public.organizations add column if not exists industry text;
alter table public.organizations add column if not exists description text;
alter table public.organizations add column if not exists support_needs text[] not null default '{}';
alter table public.organizations add column if not exists preferred_channels text[] not null default '{}';
alter table public.organizations add column if not exists plan text not null default 'none';
alter table public.organizations add column if not exists created_by uuid references auth.users (id) on delete set null;
alter table public.organizations add column if not exists created_at timestamptz not null default now();
alter table public.organizations add column if not exists updated_at timestamptz not null default now();

-- Helper functions (security definer avoids RLS recursion on organization_members).
create or replace function public.assistar_is_org_member(org uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.organization_members
                 where organization_id = org and user_id = auth.uid());
$$;

create or replace function public.assistar_is_org_admin(org uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.organization_members
                 where organization_id = org and user_id = auth.uid()
                   and role in ('owner', 'admin'));
$$;

-- Runs on every new auth user: profile, organization, owner membership, default workspace.
create or replace function public.assistar_handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  org_id uuid;
  display_name text := coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1));
begin
  -- This Supabase project is shared with other apps: only act on Assistar signups.
  if coalesce(new.raw_user_meta_data ->> 'app', '') <> 'assistar' then
    return new;
  end if;
  insert into public.profiles (id, full_name, email) values (new.id, display_name, new.email)
    on conflict (id) do nothing;
  insert into public.organizations (name, created_by) values (display_name || '''s Workspace', new.id)
    returning id into org_id;
  insert into public.organization_members (organization_id, user_id, role) values (org_id, new.id, 'owner');
  insert into public.assistar_workspaces (organization_id, name) values (org_id, 'Main workspace');
  return new;
end;
$$;

drop trigger if exists assistar_on_auth_user_created on auth.users;
create trigger assistar_on_auth_user_created
  after insert on auth.users
  for each row execute function public.assistar_handle_new_user();

create or replace function public.assistar_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists assistar_profiles_touch on public.profiles;
create trigger assistar_profiles_touch before update on public.profiles for each row execute function public.assistar_touch_updated_at();
drop trigger if exists assistar_organizations_touch on public.organizations;
create trigger assistar_organizations_touch before update on public.organizations for each row execute function public.assistar_touch_updated_at();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.assistar_workspaces enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles for select using (id = auth.uid());
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "orgs: members read" on public.organizations;
create policy "orgs: members read" on public.organizations for select using (public.assistar_is_org_member(id));
drop policy if exists "orgs: admins update" on public.organizations;
create policy "orgs: admins update" on public.organizations for update
  using (public.assistar_is_org_admin(id)) with check (public.assistar_is_org_admin(id));

drop policy if exists "members: read same org" on public.organization_members;
create policy "members: read same org" on public.organization_members for select using (public.assistar_is_org_member(organization_id));

drop policy if exists "assistar_workspaces: members read" on public.assistar_workspaces;
create policy "assistar_workspaces: members read" on public.assistar_workspaces for select using (public.assistar_is_org_member(organization_id));
drop policy if exists "assistar_workspaces: admins write" on public.assistar_workspaces;
create policy "assistar_workspaces: admins write" on public.assistar_workspaces for all
  using (public.assistar_is_org_admin(organization_id)) with check (public.assistar_is_org_admin(organization_id));
