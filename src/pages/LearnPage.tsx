import { Link } from 'react-router-dom'
import { BookOpen, CheckCircle2, Circle, Clock, Lock, PlayCircle, Zap } from 'lucide-react'
import { useProgress } from '../hooks/useProgress'
import { Card, CardContent } from '../components/ui/card'
import { Badge, DifficultyBadge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { SectionHeading } from '../components/brand'
import { AVAILABLE_LEVELS, moduleGroups } from '../data/missions'
import { missionStatus } from '../data/missions'
import { cn } from '../lib/utils'
import { COMPANY } from '../data/company'

export function LearnPage() {
  const { missions, completed, started } = useProgress()
  const done = completed.size
  const total = missions.length
  const percent = Math.round((done / total) * 100)

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Learn</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One course, four modules, 24 missions — built around a real manufacturing
          procurement audit at {COMPANY.name}.
        </p>
      </div>

      {/* Course overview */}
      <Card className="mb-8 overflow-hidden">
        <div
          className="relative p-6"
          style={{
            background:
              'linear-gradient(120deg, color-mix(in oklab, var(--primary) 14%, var(--card)), var(--card) 70%)',
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge variant="outline" className="mb-2">
                <BookOpen size={11} /> Course
              </Badge>
              <h2 className="text-lg font-semibold tracking-tight">
                Excel for Internal Audit & Manufacturing Procurement
              </h2>
              <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
                Learn Excel the way auditors actually use it: through realistic exception
                tests, dataset correlations and documented findings — not video lectures.
              </p>
            </div>
            <div className="min-w-44">
              <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                <span>Course progress</span>
                <span className="font-medium text-foreground">
                  {done}/{total}
                </span>
              </div>
              <Progress value={percent} size="lg" />
              <div className="mt-2 text-right text-xs text-muted-foreground">
                {percent}% complete
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Levels / modules */}
      <div className="space-y-8">
        {AVAILABLE_LEVELS.map((level, li) => {
          const groups = moduleGroups(level.id)
          const levelDone = missions.filter(
            (m) => m.levelId === level.id && completed.has(m.id),
          ).length
          const levelTotal = missions.filter((m) => m.levelId === level.id).length

          return (
            <section key={level.id}>
              <SectionHeading
                title={`Level ${li + 1} · ${level.name}`}
                subtitle={level.description}
                action={
                  <Badge variant={levelDone === levelTotal ? 'success' : 'muted'}>
                    {levelDone}/{levelTotal} missions
                  </Badge>
                }
              />

              <div className="space-y-5">
                {groups.map((group) => {
                  const firstLocked =
                    missionStatus(group.missions[0]!.id, completed, started) === 'locked'
                  return (
                    <Card
                      key={group.module}
                      className={cn(firstLocked && 'opacity-75')}
                    >
                      <CardContent className="p-0">
                        <div className="flex items-center justify-between border-b border-border px-5 py-3">
                          <div className="text-sm font-semibold">{group.module}</div>
                          <div className="text-xs text-muted-foreground">
                            {group.missions.filter((m) => completed.has(m.id)).length}/
                            {group.missions.length} complete
                          </div>
                        </div>

                        <ul className="divide-y divide-border">
                          {group.missions.map((m) => {
                            const status = missionStatus(m.id, completed, started)
                            const locked = status === 'locked'
                            const isDone = status === 'completed'
                            const rowClass = cn(
                              'flex items-center gap-4 px-5 py-3.5 transition-colors',
                              locked ? 'opacity-55' : 'hover:bg-accent/60 cursor-pointer',
                            )
                            const row = (
                              <>
                                <span
                                  className={cn(
                                    'flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold',
                                    isDone
                                      ? 'bg-success-soft text-success'
                                      : status === 'in-progress'
                                        ? 'bg-primary-soft text-primary-soft-foreground'
                                        : locked
                                          ? 'bg-muted text-muted-foreground'
                                          : 'bg-muted text-muted-foreground',
                                  )}
                                >
                                  {isDone ? (
                                    <CheckCircle2 size={16} />
                                  ) : locked ? (
                                    <Lock size={13} />
                                  ) : status === 'in-progress' ? (
                                    <PlayCircle size={16} />
                                  ) : (
                                    <Circle size={13} />
                                  )}
                                </span>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-[11px] text-muted-foreground">
                                      {String(m.number).padStart(2, '0')}
                                    </span>
                                    <span className="text-sm font-medium">{m.title}</span>
                                    {isDone && (
                                      <Badge variant="success">Completed</Badge>
                                    )}
                                    {status === 'in-progress' && (
                                      <Badge variant="info">In progress</Badge>
                                    )}
                                  </div>
                                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                    <DifficultyBadge difficulty={m.difficulty} />
                                    <Badge variant="xp">
                                      <Zap size={9} /> {m.xp}
                                    </Badge>
                                    <Badge variant="muted">
                                      <Clock size={9} /> {m.estMinutes} min
                                    </Badge>
                                  </div>
                                </div>

                                {!locked && (
                                  <span className="text-xs font-medium text-primary">
                                    {isDone ? 'Review' : 'Open'} →
                                  </span>
                                )}
                              </>
                            )
                            return (
                              <li key={m.id}>
                                {locked ? (
                                  <div className={rowClass}>{row}</div>
                                ) : (
                                  <Link to={`/missions/${m.id}`} className={rowClass}>
                                    {row}
                                  </Link>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
