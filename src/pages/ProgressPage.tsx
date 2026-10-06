import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Award,
  BarChart3,
  Flame,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useProgress } from '../hooks/useProgress'
import { ACHIEVEMENTS } from '../data/achievements'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Button } from '../components/ui/button'
import { EmptyState } from '../components/ui/overlays'
import { AchievementIcon, SectionHeading } from '../components/brand'
import { AVAILABLE_LEVELS, countHintsUsed, levelCompletion } from '../data/missions'
import { cn } from '../lib/utils'

const CHART_NOW = Date.now()

export function ProgressPage() {
  const {
    xp,
    levelInfo,
    records,
    missionsCompleted,
    totalMissions,
    accuracy,
    hintsUsed,
    achievements,
    events,
    skills,
    completed,
    missions,
  } = useProgress()

  const xpSeries = useMemo(() => {
    const xpEvents = events.filter((e) => e.type === 'xp_earned')
    const data = xpEvents.reduce<{ t: number; xp: number }[]>(
      (acc, e) => [
        ...acc,
        {
          t: new Date(e.at).getTime(),
          xp: (acc[acc.length - 1]?.xp ?? 0) + (e.value ?? 0),
        },
      ],
      [],
    )
    if (data.length >= 2) return data
    // fallback: progress snapshot so the chart is never empty
    return [
      { t: CHART_NOW - 86_400_000, xp: 0 },
      { t: CHART_NOW, xp },
    ]
  }, [events, xp])

  const stats = [
    { label: 'Total XP', value: xp.toLocaleString(), icon: Zap, tone: 'text-xp' },
    { label: 'Missions completed', value: `${missionsCompleted}/${totalMissions}`, icon: Target, tone: 'text-primary' },
    { label: 'Accuracy', value: `${accuracy}%`, icon: TrendingUp, tone: 'text-info' },
    { label: 'Hints used', value: String(hintsUsed), icon: Flame, tone: 'text-warning' },
  ]

  const areaStats = AVAILABLE_LEVELS.map((l) => ({ level: l, ...levelCompletion(l, completed) }))

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Progress</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Level {levelInfo.levelNumber}: {levelInfo.level.name} · {levelInfo.percent}% toward{' '}
          {levelInfo.nextLevel?.name ?? 'the top level'}
        </p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon size={15} className={s.tone} />
              </div>
              <div className="mt-1.5 text-2xl font-semibold tracking-tight">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* XP chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>XP earned over time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={xpSeries} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                  <defs>
                    <linearGradient id="xpFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="t"
                    type="number"
                    scale="time"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(t: number) =>
                      new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                    }
                    tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-popover)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 10,
                      fontSize: 12,
                      color: 'var(--color-popover-foreground)',
                    }}
                    labelFormatter={(label) =>
                      new Date(Number(label)).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    }
                    formatter={(value) => `${value} XP earned`}
                  />
                  <Area
                    type="monotone"
                    dataKey="xp"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    fill="url(#xpFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Audit areas */}
        <Card>
          <CardHeader>
            <CardTitle>Audit areas completed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {areaStats.map((a) => (
              <div key={a.level.id}>
                <div className="mb-1 flex justify-between text-[13px]">
                  <span className="font-medium">{a.level.name}</span>
                  <span className="text-muted-foreground">
                    {a.done}/{a.total}
                  </span>
                </div>
                <Progress
                  value={a.percent}
                  size="sm"
                  barClassName={a.percent === 100 ? 'bg-success' : 'bg-primary'}
                />
              </div>
            ))}
            <div className="border-t border-border pt-3 text-xs text-muted-foreground">
              Skills unlocked:{' '}
              {skills
                .filter((s) => s.percent === 100)
                .map((s) => s.name)
                .join(' · ') || 'none yet — complete Level 1 to unlock your first skills.'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <div className="mt-8">
        <SectionHeading
          title="Achievements"
          subtitle={`${achievements.length} of ${ACHIEVEMENTS.length} badges earned`}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ACHIEVEMENTS.map((a) => {
            const earned = achievements.includes(a.id)
            return (
              <div
                key={a.id}
                className={cn(
                  'rounded-xl border p-4 text-center transition-all',
                  earned
                    ? 'border-xp/40 bg-xp/5'
                    : 'border-dashed border-border opacity-60 grayscale',
                )}
              >
                <span
                  className={cn(
                    'mx-auto flex size-12 items-center justify-center rounded-xl text-white',
                    earned ? `bg-gradient-to-br ${a.color}` : 'bg-muted text-muted-foreground',
                  )}
                >
                  <AchievementIcon icon={a.icon} size={22} />
                </span>
                <div className="mt-2.5 text-sm font-semibold">{a.name}</div>
                <div className="mt-0.5 text-xs leading-snug text-muted-foreground">
                  {a.description}
                </div>
                {earned ? (
                  <Badge variant="success" className="mt-2">
                    Earned
                  </Badge>
                ) : (
                  <Badge variant="muted" className="mt-2">
                    Locked
                  </Badge>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Completed missions */}
      <div className="mt-8">
        <SectionHeading
          title="Completed missions"
          subtitle="Every case you have closed so far"
          action={
            <Link to="/missions">
              <Button variant="secondary" size="sm">
                Browse missions
              </Button>
            </Link>
          }
        />
        {missionsCompleted === 0 ? (
          <EmptyState
            icon={<BarChart3 size={32} />}
            title="No completed missions yet"
            description="Finish your first mission and it will appear here with your XP and accuracy."
            action={
              <Link to="/">
                <Button>Start your first mission</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {missions
              .filter((m) => completed.has(m.id))
              .map((m) => {
                const rec = records[m.id]
                return (
                  <Link
                    key={m.id}
                    to={`/missions/${m.id}`}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-success/50"
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-success-soft text-success">
                      <Award size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{m.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {m.xp} XP base · {countHintsUsed(m, rec?.revealedHints)} hints used
                      </div>
                    </div>
                    <Badge variant="success">Done</Badge>
                  </Link>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}
