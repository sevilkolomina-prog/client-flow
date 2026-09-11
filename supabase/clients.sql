-- Clients table, RLS, and policies for ClientFlow.
-- Run this in the Supabase SQL Editor.

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null,
  company text not null default '',
  email text not null,
  phone text not null default '',
  status text not null default 'Active'
    check (status in ('Active', 'Lead', 'Inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_user_id_idx on public.clients (user_id);
create index if not exists clients_user_id_created_at_idx
  on public.clients (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
before update on public.clients
for each row
execute procedure public.set_updated_at();

alter table public.clients enable row level security;

revoke all on table public.clients from public, anon;
grant select, insert, update, delete on table public.clients to authenticated;

drop policy if exists "clients_select_own" on public.clients;
drop policy if exists "clients_insert_own" on public.clients;
drop policy if exists "clients_update_own" on public.clients;
drop policy if exists "clients_delete_own" on public.clients;

create policy "clients_select_own"
on public.clients
for select
to authenticated
using (auth.uid() = user_id);

create policy "clients_insert_own"
on public.clients
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "clients_update_own"
on public.clients
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "clients_delete_own"
on public.clients
for delete
to authenticated
using (auth.uid() = user_id);
