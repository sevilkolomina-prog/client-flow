-- Onboarding fields for ClientFlow profiles.
-- Run this in the Supabase SQL Editor after profiles.sql.
-- Do not run this file automatically from the app.

-- Business type collected during first-time setup.
alter table public.profiles
  add column if not exists business_type text not null default '';

alter table public.profiles
  drop constraint if exists profiles_business_type_check;

alter table public.profiles
  add constraint profiles_business_type_check
  check (
    business_type in (
      '',
      'Freelancer',
      'Agency',
      'Consultant',
      'Small Business',
      'Other'
    )
  );

-- Existing profiles must stay onboarded.
-- ADD COLUMN ... DEFAULT true backfills current rows as complete.
-- SET DEFAULT false applies only to rows inserted after this migration
-- (new signups). Re-running this block is a no-op if the column exists,
-- so later incomplete signups are not overwritten.
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'onboarding_complete'
  ) then
    alter table public.profiles
      add column onboarding_complete boolean not null default true;

    alter table public.profiles
      alter column onboarding_complete set default false;
  end if;
end $$;
