-- Core identity tables: profiles, organizations, members, workspaces.
create extension if not exists pgcrypto;

create type public.org_role as enum ('owner','admin','recruiter','hr_manager','hiring_manager','employee');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, email text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text unique,
  created_by uuid references auth.users(id),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.org_role not null default 'recruiter',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null, created_at timestamptz not null default now()
);
create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.org_role not null default 'recruiter',
  primary key (workspace_id, user_id)
);
create index on public.organization_members (user_id);
create index on public.workspaces (organization_id);

-- Membership helpers (security definer avoids recursive RLS).
create function public.is_org_member(org uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from organization_members where organization_id = org and user_id = auth.uid()) $$;
create function public.is_org_admin(org uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from organization_members where organization_id = org and user_id = auth.uid() and role in ('owner','admin')) $$;

-- On signup: profile, organization, default workspace, owner permissions.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare org_id uuid; ws_id uuid; nm text;
begin
  nm := coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email,'@',1));
  insert into profiles (id, full_name, email) values (new.id, nm, new.email);
  insert into organizations (name, created_by) values (nm || '''s Organization', new.id) returning id into org_id;
  insert into organization_members (organization_id, user_id, role) values (org_id, new.id, 'owner');
  insert into workspaces (organization_id, name) values (org_id, 'Default Workspace') returning id into ws_id;
  insert into workspace_members (workspace_id, user_id, role) values (ws_id, new.id, 'owner');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

create policy "own profile read" on public.profiles for select using (id = auth.uid());
create policy "own profile update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "org read" on public.organizations for select using (public.is_org_member(id));
create policy "org admin update" on public.organizations for update using (public.is_org_admin(id)) with check (public.is_org_admin(id));
create policy "members read" on public.organization_members for select using (public.is_org_member(organization_id));
create policy "members admin manage" on public.organization_members for all using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));
create policy "workspaces read" on public.workspaces for select using (public.is_org_member(organization_id));
create policy "workspaces admin manage" on public.workspaces for all using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));
create policy "ws members read" on public.workspace_members for select using (user_id = auth.uid());
