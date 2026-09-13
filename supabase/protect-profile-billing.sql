-- Lock ClientFlow billing columns so authenticated users cannot change them.
-- Run this in the Supabase SQL Editor after subscriptions.sql.
-- Do not run this file automatically from the app.
--
-- Existing profiles RLS only checks auth.uid() = id. That lets a signed-in
-- user UPDATE any column on their own row, including plan and Stripe ids.
-- This file keeps row-level access for settings/onboarding, but billing
-- writes are limited to service_role (Stripe webhooks).
--
-- If you re-run profiles.sql later, run this file again to restore
-- column grants. The trigger still blocks billing writes even before that.

revoke insert, update on table public.profiles from authenticated;

grant select on table public.profiles to authenticated;

grant insert (
  id,
  full_name,
  company_name,
  phone,
  business_type,
  onboarding_complete
) on table public.profiles to authenticated;

grant update (
  full_name,
  company_name,
  phone,
  business_type,
  onboarding_complete,
  updated_at
) on table public.profiles to authenticated;

grant select, insert, update on table public.profiles to service_role;

create or replace function public.protect_profile_billing_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
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

drop trigger if exists profiles_protect_billing_columns on public.profiles;
create trigger profiles_protect_billing_columns
before insert or update on public.profiles
for each row
execute procedure public.protect_profile_billing_columns();
