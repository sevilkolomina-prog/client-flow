-- Subscription plan fields for ClientFlow profiles.
-- Run this in the Supabase SQL Editor after onboarding.sql.
-- Do not run this file automatically from the app.

-- Existing rows receive plan = 'free' from the column default.
alter table public.profiles
  add column if not exists plan text not null default 'free';

alter table public.profiles
  add column if not exists stripe_customer_id text;

alter table public.profiles
  add column if not exists stripe_subscription_id text;

alter table public.profiles
  add column if not exists subscription_status text;

alter table public.profiles
  add column if not exists subscription_current_period_end timestamptz;

-- If this file is re-run after a partial add, keep existing paid plans.
-- Only fill a missing/blank plan with free.
update public.profiles
set plan = 'free'
where plan is null or btrim(plan) = '';

alter table public.profiles
  drop constraint if exists profiles_plan_check;

alter table public.profiles
  add constraint profiles_plan_check
  check (plan in ('free', 'pro', 'business'));
