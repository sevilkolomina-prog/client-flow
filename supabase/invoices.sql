-- Invoices table, RLS, and policies for ClientFlow.
-- Run this in the Supabase SQL Editor after clients.sql and projects.sql.

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  invoice_number text not null,
  amount numeric not null default 0,
  status text not null default 'Draft'
    check (status in ('Draft', 'Sent', 'Paid', 'Overdue')),
  issue_date date not null,
  due_date date not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoices_user_invoice_number_key unique (user_id, invoice_number)
);

create index if not exists invoices_user_id_idx on public.invoices (user_id);
create index if not exists invoices_client_id_idx on public.invoices (client_id);
create index if not exists invoices_project_id_idx on public.invoices (project_id);
create index if not exists invoices_user_id_created_at_idx
  on public.invoices (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists invoices_set_updated_at on public.invoices;
create trigger invoices_set_updated_at
before update on public.invoices
for each row
execute procedure public.set_updated_at();

create or replace function public.invoices_client_and_project_owned()
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
    raise exception 'Invoice client must belong to the same user';
  end if;

  if not exists (
    select 1
    from public.projects
    where id = new.project_id
      and user_id = new.user_id
      and client_id = new.client_id
  ) then
    raise exception 'Invoice project must belong to the same user and selected client';
  end if;

  return new;
end;
$$;

drop trigger if exists invoices_client_and_project_owned on public.invoices;
create trigger invoices_client_and_project_owned
before insert or update on public.invoices
for each row
execute procedure public.invoices_client_and_project_owned();

alter table public.invoices enable row level security;

revoke all on table public.invoices from public, anon;
grant select, insert, update, delete on table public.invoices to authenticated;

drop policy if exists "invoices_select_own" on public.invoices;
drop policy if exists "invoices_insert_own" on public.invoices;
drop policy if exists "invoices_update_own" on public.invoices;
drop policy if exists "invoices_delete_own" on public.invoices;

create policy "invoices_select_own"
on public.invoices
for select
to authenticated
using (auth.uid() = user_id);

create policy "invoices_insert_own"
on public.invoices
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.clients c
    where c.id = invoices.client_id
      and c.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.projects p
    where p.id = invoices.project_id
      and p.user_id = auth.uid()
      and p.client_id = invoices.client_id
  )
);

create policy "invoices_update_own"
on public.invoices
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.clients c
    where c.id = invoices.client_id
      and c.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.projects p
    where p.id = invoices.project_id
      and p.user_id = auth.uid()
      and p.client_id = invoices.client_id
  )
);

create policy "invoices_delete_own"
on public.invoices
for delete
to authenticated
using (auth.uid() = user_id);
