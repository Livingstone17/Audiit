import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  ClipboardList,
  FlaskConical,
  Lock,
  Target,
  Trophy,
  Zap,
} from 'lucide-react'
import { allMissions, useAppStore } from '../store/app'
import { isMissionUnlocked, nextMission, countHintsUsed, countSolutionsShown } from '../data/missions'
import { Badge, DifficultyBadge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import { Alert, EmptyState } from '../components/ui/overlays'
import { DatasetList } from '../components/mission/DatasetList'
import { HintPanel } from '../components/mission/HintPanel'
import { QuestionBlock, SOLUTION_XP_COST } from '../components/mission/QuestionBlock'
import { FindingsSection } from '../components/mission/FindingForm'
import { useToasts } from '../store/toasts'
import { cn } from '../lib/utils'
import { ACHIEVEMENTS } from '../data/achievements'
import { AchievementIcon } from '../components/brand'
import type { Mission } from '../lib/types'

const NO_TASK_CHECKS: number[] = []

export function MissionWorkspacePage() {
  const { id } = useParams<{ id: string }>()
  const records = useAppStore((s) => s.records)
  const missions = allMissions()
  const mission = missions.find((m) => m.id === id)

  const completed = useMemo(
    () =>
      new Set(
        Object.entries(records)
          .filter(([, r]) => r.status === 'completed')
          .map(([k]) => k),
      ),
    [records],
  )

  if (!mission) {
    return (
      <EmptyState
        icon={<FlaskConical size={34} />}
        title="Mission not found"
        description="This mission may have been removed by an administrator."
        action={
          <Link to="/missions">
            <Button variant="secondary">Back to missions</Button>
          </Link>
        }
      />
    )
  }

  if (!isMissionUnlocked(mission.id, completed)) {
    const idx = missions.findIndex((m) => m.id === mission.id)
    const prev = missions[idx - 1]
    return (
      <EmptyState
        icon={<Lock size={34} />}
        title={`Mission ${String(mission.number).padStart(2, '0')} is locked`}
        description={
          prev
            ? `Complete "${prev.title}" to unlock this mission. Missions unlock in sequence so skills build on each other.`
            : 'Complete the previous mission to unlock this one.'
        }
        action={
          prev ? (
            <Link to={`/missions/${prev.id}`}>
              <Button>Go to previous mission</Button>
            </Link>
          ) : (
            <Link to="/missions">
              <Button variant="secondary">All missions</Button>
            </Link>
          )
        }
      />
    )
  }

  return <MissionBody mission={mission} unlocked={completed} />
}

function MissionBody({ mission, unlocked }: { mission: Mission; unlocked: Set<string> }) {
  const navigate = useNavigate()
  const push = useToasts((s) => s.push)

  const user = useAppStore((s) => s.user)
  const record = useAppStore((s) => s.records[mission.id])
  const submissions = useAppStore((s) => s.submissions)
  const startMission = useAppStore((s) => s.startMission)
  const completeMission = useAppStore((s) => s.completeMission)
  const findings = useAppStore((s) => s.findings)

  const taskChecks = useAppStore((s) => s.taskChecks[mission.id] ?? NO_TASK_CHECKS)
  const toggleTaskCheck = useAppStore((s) => s.toggleTaskCheck)
  const [celebration, setCelebration] = useState<{
    earned: number
    achievements: typeof ACHIEVEMENTS
  } | null>(null)
  const completedRef = useRef(false)

  // mark the mission as started on first open
  useEffect(() => {
    if (!record && isMissionUnlocked(mission.id, unlocked)) startMission(mission.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mission.id])

  const questionCorrect = useMemo(
    () => new Set(submissions.filter((s) => s.correct).map((s) => s.questionId)),
    [submissions],
  )
  const correctCount = mission.questions.filter((q) => questionCorrect.has(q.id)).length
  const allCorrect = correctCount === mission.questions.length
  const isCompleted = record?.status === 'completed'
  const isBoss = mission.id === 'm24'
  const minFindings = isBoss ? 3 : 0
  const missionFindings = findings.filter((f) => f.missionId === mission.id)
  const canComplete = allCorrect && (!isBoss || missionFindings.length >= minFindings)
  const hintXp = record?.hintXp ?? 0
  const revealedIds = record?.revealedHints
  const hintsRevealed = countHintsUsed(mission, revealedIds)
  const solutionsShown = countSolutionsShown(revealedIds)
  const solutionsXp = solutionsShown * SOLUTION_XP_COST
  const hintsXp = Math.max(0, hintXp - solutionsXp)
  const previewXp = Math.max(Math.round(mission.xp * 0.5), mission.xp - hintXp)
  const next = nextMission(mission.id)

  // Per-criterion progress: question/findings/written milestones come straight
  // from the store; the remaining "did the Excel work" items follow the task
  // check-offs so each criterion ticks individually as the learner progresses.
  const allTaskIdx = mission.tasks.map((_, i) => i)
  const coreTaskIdx = allTaskIdx.filter((i) => !/\bsubmit\b/i.test(mission.tasks[i]!))
  const trackedTaskIdx = coreTaskIdx.length > 0 ? coreTaskIdx : allTaskIdx
  const coreTotal = trackedTaskIdx.length
  const coreChecked = trackedTaskIdx.filter((i) => taskChecks.includes(i)).length

  const textQuestions = mission.questions.filter((q) => q.type === 'text')
  const conclusionQuestions = mission.questions.filter((q) => q.type === 'conclusion')

  const criterionKind = (c: string): 'question' | 'findings' | 'written' | 'steps' | 'step' => {
    if (/questions? answered correctly/i.test(c)) return 'question'
    if (isBoss && /\bfindings?\b/i.test(c)) return 'findings'
    if (
      /summary|conclusion/i.test(c) &&
      ((/summary/i.test(c) && textQuestions.length > 0) ||
        (/conclusion/i.test(c) && conclusionQuestions.length > 0))
    ) {
      return 'written'
    }
    if (/^all\b/i.test(c)) return 'steps'
    return 'step'
  }

  const stepCriteria = mission.completion
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => criterionKind(c) === 'step')

  const criterionDone = (c: string, i: number): boolean => {
    if (isCompleted) return true
    switch (criterionKind(c)) {
      case 'question':
        return allCorrect
      case 'findings':
        return missionFindings.length >= minFindings
      case 'written': {
        const summaryOk =
          !/summary/i.test(c) || textQuestions.every((q) => questionCorrect.has(q.id))
        const conclusionOk =
          !/conclusion/i.test(c) || conclusionQuestions.every((q) => questionCorrect.has(q.id))
        return summaryOk && conclusionOk
      }
      case 'steps':
        return coreChecked >= coreTotal
      case 'step': {
        // spread the "did the Excel work" criteria evenly across task progress
        const k = stepCriteria.findIndex((s) => s.i === i) + 1
        return k > 0 && k * coreTotal <= coreChecked * stepCriteria.length
      }
    }
  }

  // auto-complete once every criterion is met
  useEffect(() => {
    if (!canComplete || isCompleted || completedRef.current) return
    completedRef.current = true
    const res = completeMission(mission.id)
    if (res) {
      setCelebration({ earned: res.earned, achievements: res.newAchievements })
      push({
        variant: 'xp',
        title: `+${res.earned} XP earned`,
        description: `Mission ${String(mission.number).padStart(2, '0')} complete: ${mission.title}`,
      })
      res.newAchievements.forEach((a) =>
        push({
          variant: 'achievement',
          title: `Badge unlocked · ${a.name}`,
          description: a.description,
        }),
      )
    }
  }, [canComplete, isCompleted, mission, completeMission, push])

  const progressPercent = Math.round(
    (correctCount / Math.max(mission.questions.length, 1)) * (isCompleted ? 100 : 85),
  )

  return (
    <div className="animate-fade-in">
      {/* Sticky mission header */}
      <div className="sticky top-14 z-30 -mx-4 mb-6 border-b border-border bg-background/92 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            to="/missions"
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={13} /> Missions
          </Link>
          <span className="font-mono text-[11px] font-bold tracking-[0.18em] text-primary">
            MISSION {String(mission.number).padStart(2, '0')}
          </span>
          <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight">
            {mission.title}
          </h1>
          <div className="flex items-center gap-1.5">
            <DifficultyBadge difficulty={mission.difficulty} />
            <Badge variant="xp">
              <Zap size={10} /> +{previewXp} XP
              {hintXp > 0 && <span className="ml-1 opacity-60 line-through">{mission.xp}</span>}
            </Badge>
            <Badge variant="muted">~{mission.estMinutes} min</Badge>
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-3">
          <Progress value={progressPercent} size="sm" className="flex-1" />
          <span className="whitespace-nowrap text-[11px] text-muted-foreground">
            {correctCount}/{mission.questions.length} solved
          </span>
        </div>
      </div>

      {/* Completion celebration */}
      {celebration && (
        <div className="mb-6 rounded-2xl border border-success/40 bg-success-soft/50 p-5 animate-scale-in">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex size-12 items-center justify-center rounded-xl bg-success text-white dark:text-black animate-confetti-pop">
              <Trophy size={24} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold tracking-tight">Case closed. Good catch.</h2>
              <p className="text-sm text-muted-foreground">
                You earned{' '}
                <span className="font-semibold text-success">+{celebration.earned} XP</span>
                {record?.firstTryCorrect ? ' including the first-try bonus' : ''}.
              </p>
              {celebration.achievements.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {celebration.achievements.map((a) => (
                    <span
                      key={a.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-xp/40 bg-xp/10 px-2.5 py-1 text-xs font-medium text-xp"
                    >
                      <AchievementIcon icon={a.icon} size={13} /> {a.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {next && (
                <Button onClick={() => navigate(`/missions/${next.id}`)}>
                  Next mission <ArrowRight size={15} />
                </Button>
              )}
              <Link to="/">
                <Button variant="secondary">Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Scenario */}
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Target size={16} className="text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Scenario
              </h2>
            </div>
            <div className="space-y-3">
              {mission.scenario.map((p, i) => (
                <p key={i} className="text-[14.5px] leading-relaxed text-foreground/90">
                  {p}
                </p>
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-primary/25 bg-primary-soft/50 p-3.5">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-primary-soft-foreground">
                Your objective
              </div>
              <p className="text-sm leading-relaxed">{mission.objective}</p>
            </div>
          </section>

          {/* Tasks */}
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <ClipboardList size={16} className="text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Your tasks
              </h2>
            </div>
            <ul className="space-y-2">
              {mission.tasks.map((task, i) => {
                const checked = taskChecks.includes(i)
                return (
                  <li key={i}>
                    <button
                      onClick={() => toggleTaskCheck(mission.id, i)}
                      className="flex w-full items-start gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-accent/60"
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                          checked
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border',
                        )}
                      >
                        {checked ? (
                          <CheckCircle2 size={13} />
                        ) : (
                          <Circle size={11} className="text-border" />
                        )}
                      </span>
                      <span
                        className={cn(
                          'text-sm leading-relaxed',
                          checked && 'text-muted-foreground line-through',
                        )}
                      >
                        {task}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>

          {/* Datasets */}
          {(mission.datasetIds.length > 0 || (mission.docIds?.length ?? 0) > 0) && (
            <section className="rounded-xl border border-border bg-card p-5">
              <div className="mb-1 flex items-center gap-2">
                <FlaskConical size={16} className="text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Datasets & documents
                </h2>
              </div>
              <p className="mb-3 text-[13px] text-muted-foreground">
                Download, work in Excel, then submit your answers below.
              </p>
              <DatasetList datasetIds={mission.datasetIds} docIds={mission.docIds} />
            </section>
          )}

          {/* Teaching blocks */}
          {mission.teaches && mission.teaches.length > 0 && (
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                What you are learning
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {mission.teaches.map((t, i) => (
                  <div key={i} className="rounded-lg border border-border bg-background/50 p-3.5">
                    <div className="text-sm font-semibold">{t.title}</div>
                    {t.formula && (
                      <code className="mt-1.5 block rounded-md border border-border bg-muted px-2.5 py-1.5 font-mono text-xs text-success">
                        {t.formula}
                      </code>
                    )}
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                      {t.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Findings (boss) */}
          {isBoss && <FindingsSection missionId={mission.id} minRequired={3} />}

          {/* Questions */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Submit your results
              </h2>
              <span className="text-xs text-muted-foreground">
                {correctCount}/{mission.questions.length} correct
              </span>
            </div>
            <div className="space-y-4">
              {mission.questions.map((q, i) => (
                <QuestionBlock key={q.id} mission={mission} question={q} index={i} />
              ))}
            </div>
          </section>

          {/* Completion criteria */}
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Completion criteria
            </h2>
            <ul className="space-y-2">
              {mission.completion.map((c, i) => {
                const done = criterionDone(c, i)
                return (
                  <li key={i} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2
                      size={15}
                      className={done ? 'text-success' : 'text-muted-foreground/40'}
                    />
                    <span className={cn(!done && 'text-muted-foreground')}>{c}</span>
                  </li>
                )
              })}
            </ul>
            {!isCompleted && !canComplete && (
              <Alert variant="warning" className="mt-3">
                <span>
                  Not quite there yet — every question must be answered correctly
                  {isBoss ? ', and at least 3 findings documented.' : ' to complete this mission.'}
                </span>
              </Alert>
            )}
            {canComplete && !isCompleted && (
              <Alert variant="success" className="mt-3">
                <span>All criteria met — the mission completes automatically.</span>
              </Alert>
            )}
          </section>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Mission status</span>
              <Badge variant={isCompleted ? 'success' : record ? 'info' : 'muted'}>
                {isCompleted ? 'Completed' : record ? 'In progress' : 'Not started'}
              </Badge>
            </div>
            <div className="mt-3 space-y-2.5 text-[13px]">
              <Row label="XP reward" value={`${previewXp} XP`} highlight />
              {hintXp > 0 && (
                <Row
                  label={`Hints used (${hintsRevealed}/${mission.hints.length})`}
                  value={`−${hintsXp} XP`}
                  danger
                />
              )}
              {solutionsShown > 0 && (
                <Row
                  label={`Solutions shown (${solutionsShown})`}
                  value={`−${solutionsXp} XP`}
                  danger
                />
              )}
              <Row
                label="Questions solved"
                value={`${correctCount}/${mission.questions.length}`}
              />
              {isBoss && <Row label="Findings documented" value={`${missionFindings.length}/3`} />}
              <Row label="Difficulty" value={mission.difficulty} />
              <Row label="Category" value={mission.category} />
            </div>
            {user?.excelLevel && (
              <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                {user.excelLevel === 'Beginner'
                  ? 'Tip: reveal hints only after a genuine attempt — they cost mission XP.'
                  : 'Tip: build the test in a helper column first, then verify with a second method.'}
              </p>
            )}
          </div>

          <HintPanel missionId={mission.id} hints={mission.hints} />

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-sm font-semibold">Next up</div>
            {next ? (
              <Link
                to={`/missions/${next.id}`}
                className="mt-3 block rounded-lg border border-border p-3 transition-colors hover:border-primary/50"
              >
                <div className="font-mono text-[11px] text-primary">
                  MISSION {String(next.number).padStart(2, '0')}
                </div>
                <div className="mt-0.5 text-sm font-medium">{next.title}</div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Zap size={11} /> {next.xp} XP · {next.estMinutes} min
                  {isMissionUnlocked(next.id, unlocked) && !unlocked.has(next.id) && (
                    <span className="text-primary">· available now</span>
                  )}
                </div>
              </Link>
            ) : (
              <p className="mt-2 text-[13px] text-muted-foreground">
                That was the last mission — you have completed the AuditLab curriculum.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  highlight,
  danger,
}: {
  label: string
  value: string
  highlight?: boolean
  danger?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-medium', highlight && 'text-primary', danger && 'text-danger')}>
        {value}
      </span>
    </div>
  )
}
