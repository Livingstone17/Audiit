-- FinQuest — global leaderboard.
--
-- Run this after 0001_init.sql in the Supabase SQL editor, or with the Supabase
-- CLI (`supabase db push`). Safe to re-run: the view is dropped and recreated,
-- and grants are idempotent.
--
-- Row-level security limits every learner to their own rows (0001_init.sql),
-- but the leaderboard page needs standings across all learners. This view is
-- therefore created with `security_invoker = false`: it executes with its
-- owner's privileges and aggregates every account. It exposes only aggregate,
-- leaderboard-safe data — name, persona, XP, mission counts, accuracy, last
-- activity and momentum stats — never individual submissions, answers or
-- findings, and is granted to `authenticated` only.
--
-- Momentum stats:
--   * xp_last_7d       — XP recorded in the analytics log over 7 days
--   * missions_last_7d — missions completed over 7 days
--   * streak           — consecutive days ending today (or yesterday, while
--                        today is still open) with at least one submission,
--                        capped at the 30-day window this query scans
-- Days are UTC dates.

drop view if exists public.leaderboard;

create view public.leaderboard
with (security_invoker = false) as
with
moves as (
  select e.user_id, coalesce(sum(e.value), 0)::int as xp_last_7d
  from public.analytics_events e
  where e.type = 'xp_earned'
    and e.occurred_at >= now() - interval '7 days'
  group by e.user_id
),
weekly as (
  select mr.user_id, count(*)::int as missions_last_7d
  from public.mission_records mr
  where mr.status = 'completed'
    and mr.completed_at is not null
    and mr.completed_at >= now() - interval '7 days'
  group by mr.user_id
),
active_days as (
  select s.user_id, (s.submitted_at at time zone 'utc')::date as d
  from public.submissions s
  where s.submitted_at >= now() - interval '30 days'
  group by s.user_id, (s.submitted_at at time zone 'utc')::date
),
runs as (
  -- gap-and-island: subtracting each row's position from its date collapses
  -- consecutive days into one labelled run, so `count(*)` per label is the
  -- run's length
  select user_id, count(*)::int as run_length, max(d) as run_end
  from (
    select
      user_id,
      d,
      (d - date '1970-01-01') - row_number() over (partition by user_id order by d) as island
    from active_days
  ) grouped
  group by user_id, island
),
streaks as (
  select user_id, run_length as streak
  from runs
  where run_end in (current_date, current_date - 1)
)
select
  p.id,
  p.name,
  p.persona,
  p.avatar_hue,
  p.role,
  coalesce(up.xp, 0) as xp,
  (
    select count(*)::int
    from public.mission_records mr
    where mr.user_id = p.id and mr.status = 'completed'
  ) as missions_completed,
  (
    select coalesce(
      round(100.0 * count(*) filter (where s.correct) / nullif(count(*), 0)),
      0
    )::int
    from public.submissions s
    where s.user_id = p.id
  ) as accuracy,
  greatest(
    (select max(mr.completed_at) from public.mission_records mr where mr.user_id = p.id),
    (select max(s.submitted_at) from public.submissions s where s.user_id = p.id)
  ) as last_active_at,
  coalesce(moves.xp_last_7d, 0) as xp_last_7d,
  coalesce(weekly.missions_last_7d, 0) as missions_last_7d,
  coalesce(streaks.streak, 0) as streak
from public.profiles p
left join public.user_progress up on up.user_id = p.id
left join moves on moves.user_id = p.id
left join weekly on weekly.user_id = p.id
left join streaks on streaks.user_id = p.id;

grant select on public.leaderboard to authenticated;
