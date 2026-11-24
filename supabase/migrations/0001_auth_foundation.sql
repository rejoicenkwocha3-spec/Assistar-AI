-- Assistar AI: auth foundation (profiles, organizations, members, workspaces) with RLS.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text,
  avatar_url text,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
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

create table public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'agent' check (role in ('owner', 'admin', 'manager', 'agent')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create index organization_members_user_idx on public.organization_members (user_id);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index workspaces_org_idx on public.workspaces (organization_id);

-- Helper functions (security definer avoids RLS recursion on organization_members).
create or replace function public.is_org_member(org uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.organization_members
                 where organization_id = org and user_id = auth.uid());
$$;

create or replace function public.is_org_admin(org uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.organization_members
                 where organization_id = org and user_id = auth.uid()
                   and role in ('owner', 'admin'));
$$;

-- Runs on every new auth user: profile, organization, owner membership, default workspace.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  org_id uuid;
  display_name text := coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1));
begin
  insert into public.profiles (id, full_name, email) values (new.id, display_name, new.email);
  insert into public.organizations (name, created_by) values (display_name || '''s Workspace', new.id)
    returning id into org_id;
  insert into public.organization_members (organization_id, user_id, role) values (org_id, new.id, 'owner');
  insert into public.workspaces (organization_id, name) values (org_id, 'Main workspace');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger organizations_touch before update on public.organizations for each row execute function public.touch_updated_at();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.workspaces enable row level security;

create policy "profiles: read own" on public.profiles for select using (id = auth.uid());
create policy "profiles: update own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "orgs: members read" on public.organizations for select using (public.is_org_member(id));
create policy "orgs: admins update" on public.organizations for update
  using (public.is_org_admin(id)) with check (public.is_org_admin(id));

create policy "members: read same org" on public.organization_members for select using (public.is_org_member(organization_id));

create policy "workspaces: members read" on public.workspaces for select using (public.is_org_member(organization_id));
create policy "workspaces: admins write" on public.workspaces for all
  using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));
