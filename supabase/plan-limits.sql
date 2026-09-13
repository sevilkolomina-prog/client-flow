-- Free-plan create limits for ClientFlow clients and projects.
-- Run this in the Supabase SQL Editor after protect-profile-billing.sql.
-- Do not run this file automatically from the app.
--
-- Free users: max 3 clients and max 3 projects.
-- Pro/Business: unlimited. Invoices are not limited.
-- Existing rows over the cap are kept; only new inserts are blocked.
--
-- Advisory locks serialize concurrent inserts for the same user so two
-- requests cannot both pass a count check and exceed the Free limit.

create or replace function public.enforce_free_client_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_plan text;
  client_count integer;
begin
  perform pg_advisory_xact_lock(851734, hashtext(new.user_id::text));

  select plan
    into user_plan
  from public.profiles
  where id = new.user_id;

  if user_plan in ('pro', 'business') then
    return new;
  end if;

  select count(*)
    into client_count
  from public.clients
  where user_id = new.user_id;

  if client_count >= 3 then
    raise exception 'Free plan allows up to 3 clients. Upgrade to Pro to add more.';
  end if;

  return new;
end;
$$;

drop trigger if exists clients_enforce_free_limit on public.clients;
create trigger clients_enforce_free_limit
before insert on public.clients
for each row
execute procedure public.enforce_free_client_limit();

create or replace function public.enforce_free_project_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_plan text;
  project_count integer;
begin
  perform pg_advisory_xact_lock(851735, hashtext(new.user_id::text));

  select plan
    into user_plan
  from public.profiles
  where id = new.user_id;

  if user_plan in ('pro', 'business') then
    return new;
  end if;

  select count(*)
    into project_count
  from public.projects
  where user_id = new.user_id;

  if project_count >= 3 then
    raise exception 'Free plan allows up to 3 projects. Upgrade to Pro to add more.';
  end if;

  return new;
end;
$$;

drop trigger if exists projects_enforce_free_limit on public.projects;
create trigger projects_enforce_free_limit
before insert on public.projects
for each row
execute procedure public.enforce_free_project_limit();

revoke all on function public.enforce_free_client_limit() from public, anon;
revoke all on function public.enforce_free_project_limit() from public, anon;
