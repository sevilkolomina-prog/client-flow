-- Fix onboarding/settings writes after protect-profile-billing.sql.
-- Run this in the Supabase SQL Editor after protect-profile-billing.sql.
-- Do not run this file automatically from the app.
--
-- protect-profile-billing.sql grants authenticated users column-level
-- INSERT/UPDATE on profile fields only. The billing-protection trigger
-- still ran as the invoking user and assigned plan / Stripe columns,
-- which PostgreSQL rejects as: permission denied for table profiles.
--
-- This keeps billing columns non-writable by authenticated clients.
-- The trigger runs as the function owner so it can preserve/reset those
-- columns. Stripe webhooks using service_role still skip the lock.

create or replace function public.protect_profile_billing_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role text;
begin
  jwt_role := coalesce(auth.role(), '');

  if jwt_role = 'service_role' then
    return new;
  end if;

  if jwt_role = '' and session_user in ('postgres', 'supabase_admin') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.plan := 'free';
    new.stripe_customer_id := null;
    new.stripe_subscription_id := null;
    new.subscription_status := null;
    new.subscription_current_period_end := null;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    new.plan := old.plan;
    new.stripe_customer_id := old.stripe_customer_id;
    new.stripe_subscription_id := old.stripe_subscription_id;
    new.subscription_status := old.subscription_status;
    new.subscription_current_period_end := old.subscription_current_period_end;
  end if;

  return new;
end;
$$;

revoke all on function public.protect_profile_billing_columns() from public, anon, authenticated;

drop trigger if exists profiles_protect_billing_columns on public.profiles;
create trigger profiles_protect_billing_columns
before insert or update on public.profiles
for each row
execute procedure public.protect_profile_billing_columns();
