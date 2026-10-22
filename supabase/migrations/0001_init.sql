-- AuditLab — auth-backed learner data.
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query),
-- or apply it with the Supabase CLI (`supabase db push`). It is idempotent, so
-- re-running is safe.
--
-- Every learner-owned table is protected by row-level security keyed on
-- `auth.uid()`: a user can only read/write their own rows. Administrators
-- (profiles.role = 'admin') additionally get read access to every row so the
-- admin analytics screens can aggregate across users.

-- -------------------------------------------------------------- profiles --

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default '',
  role        text not null default 'learner' check (role in ('learner', 'admin')),
  persona     text,
  excel_level text check (excel_level in ('Beginner', 'Intermediate', 'Advanced')),
  avatar_hue  integer,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- --------------------------------------------------- per-user aggregates --

-- One row per learner: total XP, the mission checklist and earned badges.
create table if not exists public.user_progress (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  xp           integer not null default 0,
  task_checks  jsonb not null default '{}'::jsonb,
  achievements jsonb not null default '[]'::jsonb,
  -- watermark: everything older than this was wiped by "Reset progress"
  reset_at     timestamptz,
  updated_at   timestamptz not null default now()
);

-- One row per (learner, mission): status, attempts, hints and score.
create table if not exists public.mission_records (
  user_id           uuid not null references auth.users(id) on delete cascade,
  mission_id        text not null,
  status            text not null check (status in ('in-progress', 'completed')),
  started_at        timestamptz not null default now(),
  completed_at      timestamptz,
  attempts          integer not null default 0,
  first_try_correct boolean not null default true,
  hints_used        integer not null default 0,
  hint_xp           integer not null default 0,
  revealed_hints    jsonb not null default '[]'::jsonb,
  questions_correct integer not null default 0,
  questions_total   integer not null default 0,
  updated_at        timestamptz not null default now(),
  primary key (user_id, mission_id)
);

-- ------------------------------------------------------- append-only logs --

create table if not exists public.submissions (
  id           text primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  mission_id   text not null,
  question_id  text not null,
  answer       text not null default '',
  correct      boolean not null default false,
  attempts     integer not null default 1,
  submitted_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null,
  mission_id  text,
  question_id text,
  value       numeric,
  occurred_at timestamptz not null default now()
);

create table if not exists public.audit_findings (
  id             text primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  mission_id     text not null,
  title          text not null default '',
  condition      text not null default '',
  criteria       text not null default '',
  cause          text not null default '',
  effect         text not null default '',
  recommendation text not null default '',
  response       text not null default '',
  owner          text not null default '',
  due_date       text not null default '',
  created_at     timestamptz not null default now()
);

-- --------------------------------------------------------------- helpers --

-- True when the signed-in caller is an administrator. SECURITY DEFINER so the
-- lookup bypasses the profiles RLS policy (which would otherwise recurse).
-- Defined after `profiles` because Postgres validates the body of a SQL
-- function at creation time, and a fresh database has no `profiles` yet.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Helpful for the per-user reads the sync layer issues on every flush.
create index if not exists submissions_user_at_idx on public.submissions (user_id, submitted_at);
create index if not exists analytics_events_user_at_idx on public.analytics_events (user_id, occurred_at);
create index if not exists audit_findings_user_idx on public.audit_findings (user_id);

-- ----------------------------------------------------- signup bootstrap --

-- Give every new auth user a profile and an (empty) progress row.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- never insert NULL into the NOT NULL `name` column, even when the provider
  -- withheld both a display name and an email
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Learner'
    )
  )
  on conflict (id) do nothing;

  insert into public.user_progress (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------- row security --

alter table public.profiles         enable row level security;
alter table public.user_progress    enable row level security;
alter table public.mission_records  enable row level security;
alter table public.submissions      enable row level security;
alter table public.analytics_events enable row level security;
alter table public.audit_findings   enable row level security;

-- profiles: owner may read/insert/update their own row; admins may read all.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Owners may edit their own profile, but never their own role — otherwise any
-- learner could promote themselves to admin and read every row through the
-- admin policies. Writes from the SQL editor / service role carry no
-- `auth.uid()` and are left alone, so an operator can still promote someone.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'only administrators may change a profile role';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- user_progress: owner-only writes, admin read-through.
drop policy if exists user_progress_select on public.user_progress;
create policy user_progress_select on public.user_progress
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists user_progress_insert on public.user_progress;
create policy user_progress_insert on public.user_progress
  for insert with check (user_id = auth.uid());

drop policy if exists user_progress_update on public.user_progress;
create policy user_progress_update on public.user_progress
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- mission_records: owner-only writes, admin read-through.
drop policy if exists mission_records_select on public.mission_records;
create policy mission_records_select on public.mission_records
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists mission_records_insert on public.mission_records;
create policy mission_records_insert on public.mission_records
  for insert with check (user_id = auth.uid());

drop policy if exists mission_records_update on public.mission_records;
create policy mission_records_update on public.mission_records
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- logs (submissions / events / findings): owner-only writes, admin read-through.
drop policy if exists submissions_select on public.submissions;
create policy submissions_select on public.submissions
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists submissions_write on public.submissions;
create policy submissions_write on public.submissions
  for insert with check (user_id = auth.uid());

drop policy if exists analytics_events_select on public.analytics_events;
create policy analytics_events_select on public.analytics_events
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists analytics_events_write on public.analytics_events;
create policy analytics_events_write on public.analytics_events
  for insert with check (user_id = auth.uid());

drop policy if exists audit_findings_select on public.audit_findings;
create policy audit_findings_select on public.audit_findings
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists audit_findings_insert on public.audit_findings;
create policy audit_findings_insert on public.audit_findings
  for insert with check (user_id = auth.uid());

drop policy if exists audit_findings_update on public.audit_findings;
create policy audit_findings_update on public.audit_findings
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists audit_findings_delete on public.audit_findings;
create policy audit_findings_delete on public.audit_findings
  for delete using (user_id = auth.uid());

-- Owners may also wipe their own slice (the "Reset progress" action).
drop policy if exists user_progress_delete on public.user_progress;
create policy user_progress_delete on public.user_progress
  for delete using (user_id = auth.uid());

drop policy if exists mission_records_delete on public.mission_records;
create policy mission_records_delete on public.mission_records
  for delete using (user_id = auth.uid());

drop policy if exists submissions_delete on public.submissions;
create policy submissions_delete on public.submissions
  for delete using (user_id = auth.uid());

drop policy if exists analytics_events_delete on public.analytics_events;
create policy analytics_events_delete on public.analytics_events
  for delete using (user_id = auth.uid());

-- ------------------------------------------------------------------ grants --

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  public.profiles,
  public.user_progress,
  public.mission_records,
  public.submissions,
  public.analytics_events,
  public.audit_findings
to authenticated;

-- Promote an administrator once their account exists:
--   update public.profiles set role = 'admin' where id = '<auth user uuid>';
