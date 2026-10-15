import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type {
  Achievement,
  AnalyticsEvent,
  AnalyticsEventType,
  AuditFindingDraft,
  Mission,
  MissionRecord,
  Question,
  Submission,
  User,
} from '../lib/types'
import { MISSIONS, getMission, isMissionUnlocked, nextMission } from '../data/missions'
import { ACHIEVEMENTS } from '../data/achievements'
import { randomId } from '../lib/rng'
import type { SubmissionInput } from '../lib/validation'
import { validateAnswer } from '../lib/validation'

export interface Account {
  email: string
  password: string
  user: User
}

export const DEMO_ACCOUNTS: Account[] = [
  {
    email: 'zoe@auditlab.app',
    password: 'demo1234',
    user: {
      id: 'u-zoe',
      name: 'Zoe Adeniyi',
      email: 'zoe@auditlab.app',
      role: 'learner',
      persona: 'Audit trainee',
      excelLevel: 'Intermediate',
      avatarHue: 152,
      createdAt: '2025-09-20T09:00:00.000Z',
      demo: true,
    },
  },
  {
    email: 'admin@auditlab.app',
    password: 'admin1234',
    user: {
      id: 'u-admin',
      name: 'Adaeze Okonkwo',
      email: 'admin@auditlab.app',
      role: 'admin',
      persona: 'Internal auditor',
      excelLevel: 'Advanced',
      avatarHue: 22,
      createdAt: '2025-09-01T09:00:00.000Z',
      demo: true,
    },
  },
]

/* ------------------------------------------------------------------ */
/* Per-user progression                                                */
/* ------------------------------------------------------------------ */

/**
 * Everything a learner earns lives in one slice, keyed by `User.id`.
 * Two accounts on the same browser therefore never share XP, records or
 * submissions.
 */
export interface UserProgress {
  xp: number
  records: Record<string, MissionRecord>
  /** checked task indices per mission — the mission checklist, persisted */
  taskChecks: Record<string, number[]>
  /** newest-wins log capped at SUBMISSIONS_CAP so localStorage stays bounded */
  submissions: Submission[]
  achievements: string[]
  events: AnalyticsEvent[]
  findings: AuditFindingDraft[]
}

/** Newest-wins cap on the persisted submissions log, applied per user. */
export const SUBMISSIONS_CAP = 500

function capSubmissions(submissions: Submission[]): Submission[] {
  return submissions.length > SUBMISSIONS_CAP
    ? submissions.slice(-SUBMISSIONS_CAP)
    : submissions
}

export const EMPTY_PROGRESS: UserProgress = {
  xp: 0,
  records: {},
  taskChecks: {},
  submissions: [],
  achievements: [],
  events: [],
  findings: [],
}

/** Progress for the signed-in user, or an empty slice when signed out. */
export function selectMyProgress(
  s: Pick<AppState, 'user' | 'progressByUserId'>,
): UserProgress {
  const uid = s.user?.id
  return (uid && s.progressByUserId[uid]) || EMPTY_PROGRESS
}

/** Admin-facing aggregation across every account on this browser. */
export interface AggregateProgress {
  xp: number
  records: Record<string, MissionRecord>
  submissions: Submission[]
  events: AnalyticsEvent[]
}

export function mergeProgress(slices: UserProgress[]): AggregateProgress {
  const records: Record<string, MissionRecord> = {}
  const submissions: Submission[] = []
  const events: AnalyticsEvent[] = []
  const xpValues: number[] = []

  for (const p of slices) {
    xpValues.push(p.xp)
    submissions.push(...p.submissions)
    events.push(...p.events)
    for (const [id, r] of Object.entries(p.records)) {
      const prev = records[id]
      records[id] = prev
        ? {
            // best attempt wins; completion outranks in-progress
            status:
              prev.status === 'completed' || r.status === 'completed'
                ? 'completed'
                : 'in-progress',
            startedAt: prev.startedAt < r.startedAt ? prev.startedAt : r.startedAt,
            completedAt:
             prev.completedAt && r.completedAt
                ? prev.completedAt < r.completedAt
                  ? prev.completedAt
                  : r.completedAt
                : prev.completedAt ?? r.completedAt,
            attempts: Math.max(prev.attempts, r.attempts),
            firstTryCorrect: prev.firstTryCorrect && r.firstTryCorrect,
            hintsUsed: Math.max(prev.hintsUsed, r.hintsUsed),
            hintXp: Math.max(prev.hintXp ?? 0, r.hintXp ?? 0),
            revealedHints: [...(prev.revealedHints ?? []), ...(r.revealedHints ?? [])],
            questionsCorrect: Math.max(prev.questionsCorrect, r.questionsCorrect),
            questionsTotal: Math.max(prev.questionsTotal, r.questionsTotal),
          }
        : { ...r }
    }
  }

  submissions.sort((a, b) => a.at.localeCompare(b.at))
  events.sort((a, b) => a.at.localeCompare(b.at))
  return { xp: xpValues.length ? Math.max(...xpValues) : 0, records, submissions, events }
}

interface AppState {
  /* auth */
  accounts: Account[]
  user: User | null
  onboarded: boolean

  /* progression — one slice per user, keyed by User.id */
  progressByUserId: Record<string, UserProgress>

  /* ui */
  theme: 'dark' | 'light'

  /* admin content overrides */
  adminMissions: Mission[]
  deletedMissionIds: string[]

  /* auth actions */
  login: (email: string, password: string) => { ok: boolean; error?: string }
  signup: (name: string, email: string, password: string) => { ok: boolean; error?: string }
  logout: () => void
  completeOnboarding: (persona: string, excelLevel: 'Beginner' | 'Intermediate' | 'Advanced') => void
  updateUser: (patch: Partial<User>) => void

  /* theme */
  toggleTheme: () => void

  /* progression actions */
  startMission: (missionId: string) => boolean
  toggleTaskCheck: (missionId: string, index: number) => void
  useHint: (missionId: string, cost: number, hintId?: string) => void
  submitAnswer: (
    mission: Mission,
    question: Question,
    input: SubmissionInput,
  ) => { correct: boolean; malformed?: string; expected?: string | number | string[] }
  completeMission: (missionId: string) => { earned: number; newAchievements: Achievement[] } | null
  addFinding: (finding: Omit<AuditFindingDraft, 'id' | 'createdAt'>) => string
  updateFinding: (id: string, patch: Partial<AuditFindingDraft>) => void
  removeFinding: (id: string) => void
  trackEvent: (type: AnalyticsEventType, props?: { missionId?: string; questionId?: string; value?: number }) => void

  /* demo helpers */
  resetProgress: () => void
  unlockAll: () => void

  /* admin */
  upsertAdminMission: (mission: Mission) => void
  deleteAdminMission: (id: string) => void
}

function nowIso(): string {
  return new Date().toISOString()
}

/**
 * v0/v1 persisted store: XP, records, submissions … at the top level, so every
 * account on the browser shared one progress state. Move it into the
 * signed-in user's slice; signed-out legacy progress is not claimable.
 */
export function migrateLegacyProgress(persisted: unknown, version: number): unknown {
  const stored = (persisted ?? {}) as Record<string, unknown>
  if (version >= 2) return stored
  const legacy: UserProgress = {
    xp: (stored.xp as number) ?? 0,
    records: (stored.records as Record<string, MissionRecord>) ?? {},
    taskChecks: (stored.taskChecks as Record<string, number[]>) ?? {},
    submissions: capSubmissions((stored.submissions as Submission[]) ?? []),
    achievements: (stored.achievements as string[]) ?? [],
    events: (stored.events as AnalyticsEvent[]) ?? [],
    findings: (stored.findings as AuditFindingDraft[]) ?? [],
  }
  const uid = (stored.user as User | undefined)?.id
  const migrated: Record<string, unknown> = {
    ...stored,
    progressByUserId: uid ? { [uid]: legacy } : {},
  }
  for (const key of ['xp', 'records', 'taskChecks', 'submissions', 'achievements', 'events', 'findings']) {
    delete migrated[key]
  }
  return migrated
}

/**
 * Return the partial state that replaces the signed-in user's progress slice.
 * No-op (empty object) when signed out, so `set(updateActive(...))` is safe.
 */
function updateActive(
  state: Pick<AppState, 'user' | 'progressByUserId'>,
  update: (p: UserProgress) => Partial<UserProgress>,
): Partial<Pick<AppState, 'progressByUserId'>> {
  const uid = state.user?.id
  if (!uid) return {}
  const prev = selectMyProgress(state)
  return { progressByUserId: { ...state.progressByUserId, [uid]: { ...prev, ...update(prev) } } }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      accounts: DEMO_ACCOUNTS,
      user: null,
      onboarded: false,
      progressByUserId: {},
      theme: 'dark',
      adminMissions: [],
      deletedMissionIds: [],

      login: (email, password) => {
        const account = get().accounts.find(
          (a) => a.email.toLowerCase() === email.trim().toLowerCase(),
        )
        if (!account) return { ok: false, error: 'No account found for that email.' }
        if (account.password !== password) return { ok: false, error: 'Incorrect password.' }
        set({ user: account.user, onboarded: Boolean(account.user.persona) })
        get().trackEvent('login')
        return { ok: true }
      },

      signup: (name, email, password) => {
        const clean = email.trim().toLowerCase()
        if (!name.trim()) return { ok: false, error: 'Enter your name.' }
        if (!/^\S+@\S+\.\S+$/.test(clean)) return { ok: false, error: 'Enter a valid email.' }
        if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' }
        if (get().accounts.some((a) => a.email.toLowerCase() === clean))
          return { ok: false, error: 'An account already exists for that email.' }
        const user: User = {
          id: randomId(),
          name: name.trim(),
          email: clean,
          role: 'learner',
          avatarHue: Math.floor(Math.random() * 360),
          createdAt: nowIso(),
        }
        set({
          accounts: [...get().accounts, { email: clean, password, user }],
          user,
          onboarded: false,
        })
        return { ok: true }
      },

      logout: () => set({ user: null }),

      completeOnboarding: (persona, excelLevel) => {
        const user = get().user
        if (!user) return
        set({ user: { ...user, persona, excelLevel }, onboarded: true })
        get().trackEvent('onboarding_completed')
      },

      updateUser: (patch) => {
        const user = get().user
        if (!user) return
        const updated = { ...user, ...patch }
        set({
          user: updated,
          accounts: get().accounts.map((a) =>
            a.user.id === updated.id ? { ...a, user: updated } : a,
          ),
        })
      },

      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        set({ theme: next })
        document.documentElement.classList.toggle('dark', next === 'dark')
      },

      startMission: (missionId) => {
        const state = get()
        const uid = state.user?.id
        if (!uid) return false
        const p = selectMyProgress(state)
        const completed = new Set(
          Object.entries(p.records)
            .filter(([, r]) => r.status === 'completed')
            .map(([id]) => id),
        )
        if (!isMissionUnlocked(missionId, completed)) return false
        if (p.records[missionId]) return true
        set(
          updateActive(state, (cur) => ({
            records: {
              ...cur.records,
              [missionId]: {
                status: 'in-progress',
                startedAt: nowIso(),
                attempts: 0,
                firstTryCorrect: true,
                hintsUsed: 0,
                hintXp: 0,
                questionsCorrect: 0,
                questionsTotal: getMission(missionId)?.questions.length ?? 0,
              },
            },
          })),
        )
        state.trackEvent('mission_started', { missionId })
        return true
      },

      toggleTaskCheck: (missionId, index) =>
        set(
          updateActive(get(), (p) => {
            const current = p.taskChecks[missionId] ?? []
            const next = current.includes(index)
              ? current.filter((i) => i !== index)
              : [...current, index]
            return { taskChecks: { ...p.taskChecks, [missionId]: next } }
          }),
        ),

      useHint: (missionId, cost, hintId) => {
        const state = get()
        if (!state.user?.id) return
        const rec = selectMyProgress(state).records[missionId]
        if (!rec) return
        if (hintId && (rec.revealedHints ?? []).includes(hintId)) return
        set(
          updateActive(state, (p) => ({
            records: {
              ...p.records,
              [missionId]: {
                ...rec,
                hintsUsed: rec.hintsUsed + 1,
                hintXp: (rec.hintXp ?? 0) + cost,
                revealedHints: hintId ? [...(rec.revealedHints ?? []), hintId] : rec.revealedHints,
              },
            },
          })),
        )
        state.trackEvent('hint_requested', { missionId, value: cost })
      },

      submitAnswer: (mission, question, input) => {
        const result = validateAnswer(question, input)
        const base = {
          correct: result.correct,
          malformed: result.malformed,
          expected: result.expected,
        }
        const state = get()
        const uid = state.user?.id
        if (!uid) return base

        const p = selectMyProgress(state)
        const rec = p.records[mission.id]
        const submission: Submission = {
          id: randomId(),
          missionId: mission.id,
          questionId: question.id,
          answer:
            input.text ??
            input.number ??
            input.optionId ??
            input.conclusion ??
            (input.selectedIds ?? []).join(', '),
          correct: result.correct,
          attempts: (rec?.attempts ?? 0) + 1,
          at: nowIso(),
        }
        const alreadyCorrect = p.submissions.some(
          (s) => s.questionId === question.id && s.correct,
        )
        const correctNow = result.correct && !alreadyCorrect

        set(
          updateActive(state, (cur) => ({
            records: rec
              ? {
                  ...cur.records,
                  [mission.id]: {
                    ...rec,
                    attempts: rec.attempts + 1,
                    questionsCorrect: correctNow
                      ? rec.questionsCorrect + 1
                      : rec.questionsCorrect,
                    firstTryCorrect:
                      !result.correct && rec.attempts === 0 ? false : rec.firstTryCorrect,
                  },
                }
              : cur.records,
            submissions: capSubmissions([...cur.submissions, submission]),
          })),
        )

        state.trackEvent('submission_made', { missionId: mission.id, questionId: question.id })
        state.trackEvent('question_answered', { missionId: mission.id, questionId: question.id })
        state.trackEvent(result.correct ? 'correct_answer' : 'incorrect_answer', {
          missionId: mission.id,
          questionId: question.id,
        })

        if (result.correct && !alreadyCorrect && rec?.firstTryCorrect) {
          // small XP for nailing a question first try
          set(updateActive(get(), (cur) => ({ xp: cur.xp + 10 })))
          state.trackEvent('xp_earned', { missionId: mission.id, value: 10 })
        }

        return base
      },

      completeMission: (missionId) => {
        const state = get()
        const uid = state.user?.id
        if (!uid) return null
        const mission =
          state.adminMissions.find((m) => m.id === missionId) ?? getMission(missionId)
        if (!mission) return null
        const p = selectMyProgress(state)
        const rec = p.records[missionId]
        if (!rec || rec.status === 'completed') return null

        const base = mission.xp
        const penalty = rec.hintXp ?? 0
        const floor = Math.round(base * 0.5)
        const missionXp = Math.max(floor, base - penalty)
        const bonus = rec.firstTryCorrect ? 50 : 0
        const earned = missionXp + bonus

        const records: Record<string, MissionRecord> = {
          ...p.records,
          [missionId]: {
            ...rec,
            status: 'completed',
            completedAt: nowIso(),
          },
        }

        const completedIds = new Set(
          Object.entries(records)
            .filter(([, r]) => r.status === 'completed')
            .map(([id]) => id),
        )
        const newAchievements = checkAchievements(completedIds, records).filter(
          (a) => !p.achievements.includes(a.id),
        )

        set(
          updateActive(state, () => ({
            records,
            xp: p.xp + earned,
            achievements: [...p.achievements, ...newAchievements.map((a) => a.id)],
          })),
        )

        state.trackEvent('mission_completed', { missionId })
        state.trackEvent('xp_earned', { missionId, value: earned })

        const nxt = nextMission(missionId)
        if (nxt && nxt.levelId !== mission.levelId) {
          state.trackEvent('module_completed', { missionId })
        }

        return { earned, newAchievements }
      },

      addFinding: (finding) => {
        const id = randomId()
        set(
          updateActive(get(), (p) => ({
            findings: [...p.findings, { ...finding, id, createdAt: nowIso() }],
          })),
        )
        return id
      },

      updateFinding: (id, patch) =>
        set(
          updateActive(get(), (p) => ({
            findings: p.findings.map((f) => (f.id === id ? { ...f, ...patch } : f)),
          })),
        ),

      removeFinding: (id) =>
        set(updateActive(get(), (p) => ({ findings: p.findings.filter((f) => f.id !== id) }))),

      trackEvent: (type, props) => {
        const state = get()
        if (!state.user?.id) return
        const event: AnalyticsEvent = {
          id: randomId(),
          type,
          at: nowIso(),
          ...props,
        }
        set(
          updateActive(state, (p) => ({
            events: [...p.events, event].slice(-3000),
          })),
        )
      },

      resetProgress: () => set(updateActive(get(), () => ({ ...EMPTY_PROGRESS }))),

      unlockAll: () => {
        const state = get()
        if (!state.user?.id) return
        set(
          updateActive(state, (p) => {
            const records = { ...p.records }
            for (const m of allMissions()) {
              if (!records[m.id]) {
                records[m.id] = {
                  status: 'in-progress',
                  startedAt: nowIso(),
                  attempts: 0,
                  firstTryCorrect: true,
                  hintsUsed: 0,
                  hintXp: 0,
                  questionsCorrect: 0,
                  questionsTotal: m.questions.length,
                }
              }
            }
            return { records }
          }),
        )
      },

      upsertAdminMission: (mission) => {
        const existing = get().adminMissions.find((m) => m.id === mission.id)
        set({
          adminMissions: existing
            ? get().adminMissions.map((m) => (m.id === mission.id ? mission : m))
            : [...get().adminMissions, mission],
          deletedMissionIds: get().deletedMissionIds.filter((id) => id !== mission.id),
        })
      },

      deleteAdminMission: (id) =>
        set({
          deletedMissionIds: [...new Set([...get().deletedMissionIds, id])],
          adminMissions: get().adminMissions.filter((m) => m.id !== id),
        }),
    }),
    {
      name: 'auditlab-store-v1',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        accounts: s.accounts,
        user: s.user,
        onboarded: s.onboarded,
        progressByUserId: s.progressByUserId,
        theme: s.theme,
        adminMissions: s.adminMissions,
        deletedMissionIds: s.deletedMissionIds,
      }),
      migrate: migrateLegacyProgress,
    },
  ),
)

/* ------------------------------------------------------------------ */
/* Achievement rules                                                   */
/* ------------------------------------------------------------------ */

const EXCEPTION_TEST_MISSIONS = ['m05', 'm10', 'm12', 'm13', 'm14', 'm16', 'm17', 'm18']

export function checkAchievements(
  completed: Set<string>,
  records: Record<string, MissionRecord>,
): Achievement[] {
  const earned: Achievement[] = []
  const has = (id: string) => completed.has(id)

  if (EXCEPTION_TEST_MISSIONS.some((id) => has(id))) earned.push(ACHIEVEMENTS[0]!)

  const l1Done = ['m01', 'm02', 'm03', 'm04', 'm05'].filter((id) => has(id)).length
  if (l1Done >= 5) earned.push(ACHIEVEMENTS[1]!)

  if (has('m05') || has('m13') || has('m24')) earned.push(ACHIEVEMENTS[2]!)

  if (has('m12') || has('m21')) earned.push(ACHIEVEMENTS[3]!)

  const hintlessInvestigation = ['m19', 'm20', 'm21', 'm22', 'm23'].some(
    (id) => has(id) && (records[id]?.hintsUsed ?? 0) === 0,
  )
  if (hintlessInvestigation) earned.push(ACHIEVEMENTS[4]!)

  if (['m11', 'm12', 'm13', 'm14', 'm15', 'm16', 'm17', 'm18'].every((id) => has(id)))
    earned.push(ACHIEVEMENTS[5]!)

  if (has('m24')) earned.push(ACHIEVEMENTS[6]!)

  return earned
}

/* ------------------------------------------------------------------ */
/* Mission list (seed + admin overrides)                               */
/* ------------------------------------------------------------------ */

export function allMissions(): Mission[] {
  const { adminMissions, deletedMissionIds } = useAppStore.getState()
  const deleted = new Set(deletedMissionIds)
  const overrides = new Map(adminMissions.map((m) => [m.id, m]))
  const seeds = MISSIONS.filter((m) => !deleted.has(m.id)).map(
    (m) => overrides.get(m.id) ?? m,
  )
  const custom = adminMissions.filter(
    (m) => !MISSIONS.some((s) => s.id === m.id) && !deleted.has(m.id),
  )
  return [...seeds, ...custom]
}

export function completedSet(state: Pick<UserProgress, 'records'>): Set<string> {
  return new Set(
    Object.entries(state.records)
      .filter(([, r]) => r.status === 'completed')
      .map(([id]) => id),
  )
}

export function accuracyOf(submissions: Submission[]): number {
  const byQuestion = new Map<string, boolean>()
  for (const s of submissions) {
    const prev = byQuestion.get(s.questionId) ?? false
    byQuestion.set(s.questionId, prev || s.correct)
  }
  if (byQuestion.size === 0) return 0
  const correct = [...byQuestion.values()].filter(Boolean).length
  return Math.round((correct / byQuestion.size) * 100)
}
