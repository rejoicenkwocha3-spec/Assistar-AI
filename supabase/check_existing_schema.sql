-- Run in the Supabase SQL Editor on an OLD project BEFORE the migration. Read-only.

-- 1) Tables that already exist with names this app uses
select table_name, (select count(*) from information_schema.columns c
  where c.table_schema = 'public' and c.table_name = t.table_name) as columns
from information_schema.tables t
where table_schema = 'public'
  and table_name in ('profiles','organizations','organization_members','workspaces')
order by 1;

-- 2) Existing triggers on auth.users (a leftover one can break signup)
select tgname as trigger_name, pg_get_functiondef(tgfoid) as definition
from pg_trigger where tgrelid = 'auth.users'::regclass and not tgisinternal;

-- 3) Existing profiles table columns, if any
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles' order by ordinal_position;
