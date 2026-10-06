import { useMemo, useState } from 'react'
import { Crown, Medal, Trophy, Zap } from 'lucide-react'
import { PEERS } from '../data/leaderboard'
import { accuracyOf, useAppStore } from '../store/app'
import { useProgress } from '../hooks/useProgress'
import { Avatar } from '../components/brand'
import { Badge } from '../components/ui/badge'
import { Card } from '../components/ui/card'
import { cn } from '../lib/utils'

type Metric = 'xp' | 'missions' | 'accuracy'

const METRICS: { id: Metric; label: string }[] = [
  { id: 'xp', label: 'XP' },
  { id: 'missions', label: 'Missions completed' },
  { id: 'accuracy', label: 'Accuracy' },
]

interface Row {
  id: string
  name: string
  persona: string
  xp: number
  missions: number
  accuracy: number
  isYou: boolean
  lastActiveDaysAgo?: number
}

export function LeaderboardPage() {
  const user = useAppStore((s) => s.user)
  const submissions = useAppStore((s) => s.submissions)
  const { xp, missionsCompleted, records } = useProgress()
  const [metric, setMetric] = useState<Metric>('xp')

  const rows = useMemo<Row[]>(() => {
    const hasProgress = Object.keys(records).length > 0
    const you: Row = {
      id: 'you',
      name: user?.name ?? 'You',
      persona: user?.persona ?? 'Audit trainee',
      xp,
      missions: missionsCompleted,
      accuracy: accuracyOf(submissions),
      isYou: true,
      lastActiveDaysAgo: 0,
    }
    const peers: Row[] = PEERS.map((p) => ({
      id: p.id,
      name: p.name,
      persona: p.persona,
      xp: p.xp,
      missions: p.missionsCompleted,
      accuracy: p.accuracy,
      isYou: false,
      lastActiveDaysAgo: p.lastActiveDaysAgo,
    }))
    // new learners sit below seeded peers until they build progress
    const all = hasProgress || you.xp > 0 ? [...peers, you] : [you, ...peers]
    return all.sort((a, b) => {
      const key: keyof Row = metric === 'missions' ? 'missions' : metric
      return (b[key] as number) - (a[key] as number)
    })
  }, [metric, user, xp, missionsCompleted, submissions, records])

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
                <Avatar name={r.name} size={44} />
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
          <div className="hidden sm:col-span-2 sm:block">Persona</div>
          <div className="hidden text-right sm:col-span-2 sm:block">Missions</div>
          <div className="hidden text-right sm:col-span-2 sm:block">Accuracy</div>
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
                  className={i === 0 ? 'text-xp' : i === 1 ? 'text-muted-foreground' : 'text-warning/70'}
                />
              ) : (
                <span className="text-xs text-muted-foreground">{i + 1}</span>
              )}
            </div>
            <div className="col-span-9 flex min-w-0 items-center gap-2.5 sm:col-span-4">
              <Avatar name={r.name} size={30} />
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium">
                  {r.name} {r.isYou && <span className="text-primary">(you)</span>}
                </div>
                <div className="truncate text-[11px] text-muted-foreground sm:hidden">
                  {r.persona}
                </div>
                <div className="truncate text-[11px] text-muted-foreground sm:hidden">
                  {r.missions} missions · {r.accuracy}% accuracy
                </div>
              </div>
            </div>
            <div className="hidden col-span-2 truncate text-[13px] text-muted-foreground sm:block">
              {r.persona}
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
        rankings include fellow AuditLab learners in this demo.
      </p>
    </div>
  )
}
