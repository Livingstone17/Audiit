import { useEffect, useMemo, useState } from 'react'
import { Crown, Flame, Medal, Trophy, Zap } from 'lucide-react'
import { PEERS } from '../data/leaderboard'
import { accuracyOf, useAppStore, selectMyProgress } from '../store/app'
import { useProgress } from '../hooks/useProgress'
import { Avatar } from '../components/brand'
import { Badge } from '../components/ui/badge'
import { Card } from '../components/ui/card'
import { cn } from '../lib/utils'
import type { AnalyticsEvent, MissionRecord, Submission } from '../lib/types'

type Metric = 'xp' | 'missions' | 'accuracy'

/** How often the page re-reads the live standings while it is open. */
export const REFRESH_MS = 30_000

const METRICS: { id: Metric; label: string }[] = [
  { id: 'xp', label: 'XP' },
  { id: 'missions', label: 'Missions completed' },
  { id: 'accuracy', label: 'Accuracy' },
]

interface Row {
  id: string
  name: string
  persona: string
  avatarHue?: number
  xp: number
  missions: number
  accuracy: number
  /** momentum — XP/missions earned in the trailing 7 days + active-day streak */
  xp7d: number
  missions7d: number
  streak: number
  isYou: boolean
  lastActiveDaysAgo?: number
}

/** Momentum for the signed-in learner, computed locally so it is fresh before the next sync. */
function localMomentum(
  submissions: Submission[],
  events: AnalyticsEvent[],
  records: Record<string, MissionRecord>,
): { xp7d: number; missions7d: number; streak: number } {
  const cutoff = Date.now() - 7 * 86_400_000
  const xp7d = events.reduce(
    (n, e) =>
      e.type === 'xp_earned' && new Date(e.at).getTime() >= cutoff ? n + (e.value ?? 0) : n,
    0,
  )
  const missions7d = Object.values(records).filter(
    (r) => r.status === 'completed' && r.completedAt && new Date(r.completedAt).getTime() >= cutoff,
  ).length
  const days = new Set(submissions.map((s) => new Date(s.at).toISOString().slice(0, 10)))
  let cursor = new Date()
  /* today may not have a submission yet — let the streak still end yesterday */
  if (!days.has(cursor.toISOString().slice(0, 10))) {
    cursor = new Date(cursor.getTime() - 86_400_000)
  }
  let streak = 0
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1
    cursor = new Date(cursor.getTime() - 86_400_000)
  }
  /* the SQL view scans a 30-day window; mirror that cap here */
  return { xp7d, missions7d, streak: Math.min(streak, 30) }
}

export function LeaderboardPage() {
  const user = useAppStore((s) => s.user)
  const submissions = useAppStore((s) => selectMyProgress(s).submissions)
  const { xp, missionsCompleted, records, events } = useProgress()
  const [metric, setMetric] = useState<Metric>('xp')
  const live = useAppStore((s) => s.leaderboard)
  const loading = useAppStore((s) => s.leaderboardLoading)
  const liveError = useAppStore((s) => s.leaderboardError)
  const loadLeaderboard = useAppStore((s) => s.loadLeaderboard)

  /* pull live standings from the leaderboard view on open */
  useEffect(() => {
    void loadLeaderboard()
  }, [loadLeaderboard])

  /* keep the ranks live: poll while the page is open and refetch when the user
   * comes back to the tab — also refreshed by the store after every sync */
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== 'hidden' && !useAppStore.getState().leaderboardLoading) {
        void loadLeaderboard()
      }
    }
    const id = setInterval(tick, REFRESH_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [loadLeaderboard])

  const rows = useMemo<Row[]>(() => {
    const you: Row = {
      id: user?.id ?? 'you',
      name: user?.name ?? 'You',
      persona: user?.persona ?? 'Learner',
      avatarHue: user?.avatarHue,
      xp,
      missions: missionsCompleted,
      accuracy: accuracyOf(submissions),
      ...localMomentum(submissions, events, records),
      isYou: true,
      lastActiveDaysAgo: 0,
    }

    /* first load → show just your own row; the standings arrive in a beat */
    if (loading && !live) return [you]

    /* live standings from Supabase, with your *local* numbers overlaid so a
     * freshly completed mission shows up before the next flush syncs */
    if (live) {
      const others: Row[] = live
        .filter((e) => e.id !== user?.id)
        .map((e) => ({
          id: e.id,
          name: e.name,
          persona: e.persona ?? 'Learner',
          avatarHue: e.avatarHue,
          xp: e.xp,
          missions: e.missionsCompleted,
          accuracy: e.accuracy,
          xp7d: e.xp7d,
          missions7d: e.missions7d,
          streak: e.streak,
          isYou: false,
        }))
      return [...others, you].sort((a, b) => {
        const key: keyof Row = metric === 'missions' ? 'missions' : metric
        return (b[key] as number) - (a[key] as number)
      })
    }

    /* no backend reachable — bundled seed peers so the page is never empty */
    const peers: Row[] = PEERS.map((p) => ({
      id: p.id,
      name: p.name,
      persona: p.persona,
      avatarHue: p.avatarHue,
      xp: p.xp,
      missions: p.missionsCompleted,
      accuracy: p.accuracy,
      xp7d: 0,
      missions7d: 0,
      streak: 0,
      isYou: false,
      lastActiveDaysAgo: p.lastActiveDaysAgo,
    }))
    // new learners sit below seeded peers until they build progress
    const hasProgress = Object.keys(records).length > 0
    const all = hasProgress || you.xp > 0 ? [...peers, you] : [you, ...peers]
    return all.sort((a, b) => {
      const key: keyof Row = metric === 'missions' ? 'missions' : metric
      return (b[key] as number) - (a[key] as number)
    })
  }, [loading, live, metric, user, xp, missionsCompleted, submissions, records, events])

  const yourRank = rows.findIndex((r) => r.isYou) + 1

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leaderboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ranked by demonstrated skill — XP, completed missions and accuracy. Speed is
            not a scoring factor.
          </p>
        </div>
        <div className="flex gap-1.5">
          {METRICS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMetric(m.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors',
                metric === m.id
                  ? 'bg-primary-soft text-primary-soft-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Podium */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[rows[0], rows[1], rows[2]].map((r, i) => {
          if (!r) return null
          const medals = [Crown, Medal, Medal]
          const Icon = medals[i]!
          const tones = [
            'border-xp/50 bg-xp/5',
            'border-border bg-card',
            'border-border bg-card',
          ]
          return (
            <Card key={r.id} className={cn('p-4 text-center', tones[i])}>
              <Icon
                size={20}
                className={cn('mx-auto', i === 0 ? 'text-xp' : 'text-muted-foreground')}
              />
              <div className="mt-2 flex justify-center">
                <Avatar name={r.name} hue={r.avatarHue} size={44} />
              </div>
              <div className="mt-2 text-sm font-semibold">
                {r.name} {r.isYou && <span className="text-primary">(you)</span>}
              </div>
              <div className="text-xs text-muted-foreground">{r.persona}</div>
              <Badge variant={i === 0 ? 'xp' : 'muted'} className="mt-2">
                #{i + 1} ·{' '}
                {metric === 'xp'
                  ? `${r.xp.toLocaleString()} XP`
                  : metric === 'missions'
                    ? `${r.missions} missions`
                    : `${r.accuracy}% accuracy`}
              </Badge>
            </Card>
          )
        })}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-12 gap-3 border-b border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <div className="col-span-1">#</div>
          <div className="col-span-9 sm:col-span-4">Learner</div>
          <div className="hidden text-right sm:col-span-2 sm:block">Missions</div>
          <div className="hidden text-right sm:col-span-2 sm:block">Accuracy</div>
          <div className="hidden text-right sm:col-span-2 sm:block">Momentum</div>
          <div className="col-span-2 text-right sm:col-span-1">XP</div>
        </div>
        {rows.map((r, i) => (
          <div
            key={r.id}
            className={cn(
              'grid grid-cols-12 items-center gap-3 border-b border-border px-4 py-3 text-sm last:border-0',
              r.isYou && 'bg-primary-soft/40',
            )}
          >
            <div className="col-span-1">
              {i < 3 ? (
                <Trophy
                  size={15}
                  className={i === 0 ? 'text-xp' : i === 1 ? 'text-muted-foreground' : 'text-warning'}
                />
              ) : (
                <span className="text-xs text-muted-foreground">{i + 1}</span>
              )}
            </div>
            <div className="col-span-9 flex min-w-0 items-center gap-2.5 sm:col-span-4">
              <Avatar name={r.name} hue={r.avatarHue} size={30} />
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium">
                  {r.name} {r.isYou && <span className="text-primary">(you)</span>}
                </div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {r.persona}
                </div>
                <div className="truncate text-[11px] text-muted-foreground sm:hidden">
                  {r.missions} missions · {r.accuracy}% accuracy
                </div>
                {(r.xp7d > 0 || r.streak > 0) && (
                  <div className="truncate text-[11px] text-muted-foreground sm:hidden">
                    {r.xp7d > 0 && <>+{r.xp7d} XP this week</>}
                    {r.xp7d > 0 && r.streak > 0 && ' · '}
                    {r.streak > 0 && `${r.streak}-day streak`}
                  </div>
                )}
              </div>
            </div>
            <div className="hidden text-right sm:col-span-2 sm:block">
              <div className="flex items-center justify-end gap-2">
                <span
                  className={cn(
                    'flex items-center gap-0.5 tabular-nums',
                    r.xp7d > 0 ? 'text-success' : 'text-muted-foreground',
                  )}
                >
                  {r.xp7d > 0 ? `+${r.xp7d}` : '0'}
                  <span className="text-[10px] font-normal text-muted-foreground">XP · 7d</span>
                </span>
                <span
                  className={cn(
                    'flex items-center gap-0.5 text-[11px] tabular-nums',
                    r.streak > 0 ? 'text-warning' : 'text-muted-foreground',
                  )}
                >
                  <Flame size={12} />
                  {r.streak > 0 ? `${r.streak}d` : '–'}
                </span>
              </div>
            </div>
            <div className="hidden text-right text-[13px] sm:col-span-2 sm:block">{r.missions}</div>
            <div className="hidden text-right text-[13px] sm:col-span-2 sm:block">
              <span
                className={cn(
                  r.accuracy >= 90 ? 'text-success' : r.accuracy >= 75 ? 'text-foreground' : 'text-warning',
                )}
              >
                {r.accuracy}%
              </span>
            </div>
            <div className="col-span-2 flex items-center justify-end gap-1 text-[13px] font-semibold sm:col-span-1">
              <Zap size={11} className="hidden text-xp lg:block" />
              <span className="truncate">{r.xp >= 1000 ? `${(r.xp / 1000).toFixed(1)}k` : r.xp}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Your current rank: #{yourRank} by {METRICS.find((m) => m.id === metric)?.label} ·{' '}
        {live
          ? 'Live standings synced from the cloud.'
          : liveError
            ? `Live standings unavailable (${liveError}) — showing bundled demo peers.`
            : 'rankings include fellow FinQuest learners in this demo.'}
      </p>
    </div>
  )
}
