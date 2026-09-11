-- Projects table, RLS, and policies for ClientFlow.
-- Run this in the Supabase SQL Editor after clients.sql.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null,
  description text not null default '',
  status text not null default 'Planning'
    check (status in ('Planning', 'In Progress', 'Completed', 'On Hold')),
  value numeric not null default 0,
  progress integer not null default 0
    check (progress >= 0 and progress <= 100),
  start_date date not null,
  due_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id);
create index if not exists projects_client_id_idx on public.projects (client_id);
create index if not exists projects_user_id_created_at_idx
  on public.projects (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row
execute procedure public.set_updated_at();

create or replace function public.projects_client_owned_by_user()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.clients
    where id = new.client_id
      and user_id = new.user_id
  ) then
    raise exception 'Project client must belong to the same user';
  end if;

  return new;
end;
$$;

drop trigger if exists projects_client_owned_by_user on public.projects;
create trigger projects_client_owned_by_user
before insert or update on public.projects
for each row
execute procedure public.projects_client_owned_by_user();

alter table public.projects enable row level security;

revoke all on table public.projects from public, anon;
grant select, insert, update, delete on table public.projects to authenticated;

drop policy if exists "projects_select_own" on public.projects;
drop policy if exists "projects_insert_own" on public.projects;
drop policy if exists "projects_update_own" on public.projects;
drop policy if exists "projects_delete_own" on public.projects;

create policy "projects_select_own"
on public.projects
for select
to authenticated
using (auth.uid() = user_id);

create policy "projects_insert_own"
on public.projects
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.clients
    where id = client_id
      and user_id = auth.uid()
  )
);

create policy "projects_update_own"
on public.projects
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.clients
    where id = client_id
      and user_id = auth.uid()
  )
);

create policy "projects_delete_own"
on public.projects
for delete
to authenticated
using (auth.uid() = user_id);
