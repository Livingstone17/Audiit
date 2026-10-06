import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Award,
  Clock,
  Flame,
  Target,
  Zap,
} from 'lucide-react'
import { useAppStore } from '../store/app'
import { useProgress } from '../hooks/useProgress'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Badge, DifficultyBadge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Button } from '../components/ui/button'
import { AchievementIcon } from '../components/brand'
import { ACHIEVEMENTS } from '../data/achievements'
import { AVAILABLE_LEVELS, levelCompletion } from '../data/missions'
import { cn, timeAgo } from '../lib/utils'

export function DashboardPage() {
  const user = useAppStore((s) => s.user)
  const events = useAppStore((s) => s.events)
  const { xp, levelInfo, next, missions, completed, skills, achievements, records, missionsCompleted, totalMissions, accuracy } =
    useProgress()

  const firstName = user?.name.split(' ')[0] ?? 'there'
  const allDone = missions.every((m) => completed.has(m.id))

  const recentEvents = [...events]
    .filter((e) => ['mission_completed', 'hint_requested', 'xp_earned'].includes(e.type))
    .slice(-6)
    .reverse()

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground">Welcome back, {firstName}</p>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">
          {allDone ? 'Every case is closed. Outstanding.' : 'Your next mission is waiting.'}
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Current mission hero */}
          {!allDone && next && (
            <div className="relative overflow-hidden rounded-2xl border border-primary/25 p-6 sm:p-7 animate-slide-up">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(600px 300px at 10% 0%, color-mix(in oklab, var(--primary) 18%, transparent), transparent 65%), linear-gradient(135deg, var(--card), color-mix(in oklab, var(--card) 82%, var(--primary)))',
                }}
              />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold tracking-[0.18em] text-primary">
                    MISSION {String(next.number).padStart(2, '0')}
                  </span>
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">
                    {next.module}
                  </span>
                </div>

                <h2 className="mt-3 text-2xl font-semibold tracking-tight">{next.title}</h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {next.summary}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <DifficultyBadge difficulty={next.difficulty} />
                  <Badge variant="xp">
                    <Zap size={10} /> +{next.xp} XP
                  </Badge>
                  <Badge variant="muted">
                    <Clock size={10} /> ~{next.estMinutes} minutes
                  </Badge>
                  <Badge variant="outline">{next.category}</Badge>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link to={`/missions/${next.id}`}>
                    <Button size="lg" className="animate-pulse-ring">
                      {records[next.id] ? 'Resume Mission' : 'Start Mission'}{' '}
                      <ArrowRight size={16} />
                    </Button>
                  </Link>
                  <Link
                    to="/learn"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    View learning path
                  </Link>
                </div>
              </div>
            </div>
          )}

          {allDone && (
            <Card className="border-success/40 bg-success-soft/40 p-7 text-center">
              <Award className="mx-auto size-9 text-success" />
              <h2 className="mt-3 text-xl font-semibold">All 24 missions completed</h2>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                You have finished the Excel foundations, procurement audit, investigation
                and the final case. Re-run any mission to sharpen your accuracy, or reset
                your progress from your profile.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <Link to="/progress">
                  <Button>View your report</Button>
                </Link>
                <Link to="/leaderboard">
                  <Button variant="outline">See the leaderboard</Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Learning path */}
          <Card>
            <CardHeader>
              <CardTitle>Current Learning Path</CardTitle>
              <CardDescription>
                Excel Foundations → Procurement Audit → Investigation → Final Case
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {AVAILABLE_LEVELS.map((level, i) => {
                  const c = levelCompletion(level, completed)
                  const isNext = next?.levelId === level.id
                  const reached = missions.some(
                    (m) => m.levelId === level.id && (completed.has(m.id) || records[m.id]),
                  )
                  return (
                    <Link
                      key={level.id}
                      to="/learn"
                      className={cn(
                        'rounded-xl border p-4 transition-all hover:-translate-y-0.5',
                        isNext
                          ? 'border-primary/50 bg-primary-soft/50'
                          : reached
                            ? 'border-border bg-card'
                            : 'border-border/60 opacity-70',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-semibold text-muted-foreground">
                          LEVEL {i + 1}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground">
                          {c.done}/{c.total}
                        </span>
                      </div>
                      <div className="mt-1.5 text-sm font-semibold">{level.name}</div>
                      <div className="mt-2.5">
                        <Progress value={c.percent} size="sm" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No activity yet — start your first mission and it will show up here.
                </p>
              ) : (
                <ul className="space-y-3">
                  {recentEvents.map((e) => (
                    <li key={e.id} className="flex items-center gap-3 text-sm">
                      <span
                        className={cn(
                          'flex size-7 shrink-0 items-center justify-center rounded-lg',
                          e.type === 'mission_completed'
                            ? 'bg-success-soft text-success'
                            : e.type === 'xp_earned'
                              ? 'bg-xp/15 text-xp'
                              : 'bg-info-soft text-info',
                        )}
                      >
                        {e.type === 'mission_completed' ? (
                          <Target size={14} />
                        ) : e.type === 'xp_earned' ? (
                          <Zap size={14} />
                        ) : (
                          <Flame size={14} />
                        )}
                      </span>
                      <span className="flex-1">
                        {e.type === 'mission_completed'
                          ? `Completed ${missions.find((m) => m.id === e.missionId)?.title ?? 'a mission'}`
                          : e.type === 'xp_earned'
                            ? `Earned ${e.value} XP`
                            : 'Used a hint'}
                      </span>
                      <span className="text-xs text-muted-foreground">{timeAgo(e.at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Progress */}
          <Card>
            <CardHeader>
              <CardDescription>Your Progress</CardDescription>
              <CardTitle className="text-lg">
                Level {levelInfo.levelNumber}: {levelInfo.level.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between text-sm">
                <span className="text-muted-foreground">XP progress</span>
                <span className="font-semibold">
                  {xp.toLocaleString()}{' '}
                  <span className="text-muted-foreground font-normal">
                    / {(xp + (levelInfo.xpForLevel - levelInfo.xpIntoLevel)).toLocaleString()}
                  </span>
                </span>
              </div>
              <Progress value={levelInfo.percent} className="mt-2" size="lg" />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>{levelInfo.xpIntoLevel} XP into this level</span>
                <span>
                  {levelInfo.nextLevel
                    ? `${levelInfo.xpForLevel - levelInfo.xpIntoLevel} XP to ${levelInfo.nextLevel.name}`
                    : 'Top level'}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Missions', value: `${missionsCompleted}/${totalMissions}` },
                  { label: 'Accuracy', value: `${accuracy}%` },
                  { label: 'Badges', value: `${achievements.length}/${ACHIEVEMENTS.length}` },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg bg-muted/70 py-2.5">
                    <div className="text-lg font-semibold">{s.value}</div>
                    <div className="text-[11px] text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              {achievements.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Complete your first exception test to earn a badge.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {achievements
                    .slice(-3)
                    .reverse()
                    .map((id) => {
                      const a = ACHIEVEMENTS.find((x) => x.id === id)
                      if (!a) return null
                      return (
                        <div
                          key={id}
                          className="flex items-center gap-3 rounded-lg border border-xp/30 bg-xp/5 p-3"
                        >
                          <span
                            className={cn(
                              'flex size-9 items-center justify-center rounded-lg bg-gradient-to-br text-white',
                              a.color,
                            )}
                          >
                            <AchievementIcon icon={a.icon} size={17} />
                          </span>
                          <div>
                            <div className="text-[13px] font-semibold">{a.name}</div>
                            <div className="text-xs text-muted-foreground">{a.description}</div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
              <Link
                to="/progress"
                className="mt-3 block text-xs font-medium text-primary hover:underline"
              >
                View all badges →
              </Link>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Audit Skills</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5">
              {skills.map((s) => (
                <div key={s.id}>
                  <div className="mb-1 flex items-center justify-between text-[13px]">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {s.done}/{s.total}
                    </span>
                  </div>
                  <Progress
                    value={s.percent}
                    size="sm"
                    barClassName={
                      s.percent === 100 ? 'bg-success' : 'bg-primary'
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
