import { useMemo } from 'react'
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
import { getMission, isMissionUnlocked, nextMission } from '../data/missions'
import { ACHIEVEMENTS } from '../data/achievements'
import { hashPassword, verifyPassword } from '../lib/hash'
import { randomId } from '../lib/rng'
import type { SubmissionInput } from '../lib/validation'
import { validateAnswer } from '../lib/validation'
import { supabase } from '../lib/supabase'
import {
  deleteCloudProgress,
  fetchProfile,
  mergeMissionRecord,
  mergeUserProgress,
  pullSnapshot,
  pushProfile,
  pushSnapshot,
  SUBMISSIONS_CAP,
  userFromCloud,
  type AuthUserLike,
} from '../lib/sync'

export interface Account {
  email: string
  /** salted SHA-256 — the raw password never persists (see lib/hash.ts) */  passwordHash: string
  user: User
}

/** Fixed salt for the demo accounts, whose credentials are printed in the README. */
const DEMO_PASSWORD_SALT = 'auditlab'

export const DEMO_ACCOUNTS: Account[] = [
  {
    email: 'zoe@auditlab.app',
    passwordHash: hashPassword('demo1234', DEMO_PASSWORD_SALT),
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
    passwordHash: hashPassword('admin1234', DEMO_PASSWORD_SALT),
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
/* Per-user progression                                               */
/* ------------------------------------------------------------------ */

/** Everything a learner earns lives in one slice, keyed by `User.id`. */
/* Two accounts on the same browser therefore never share XP, records or submissions. */
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
  /** watermark set by "Reset progress" — see `mergeUserProgress` */
  resetAt?: string
}

/* Re-exported for existing importers; the value lives beside the sync layer,
 * which also enforces it when merging a cloud slice. */
export { SUBMISSIONS_CAP }

function capSubmissions(submissions: Submission[]): Submission[] {
  return submissions.length > SUBMISSIONS_CAP ? submissions.slice(-SUBMISSIONS_CAP) : submissions
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
      // best attempt wins; completion outranks in-progress
      records[id] = prev ? mergeMissionRecord(prev, r) : { ...r }
    }
  }

  submissions.sort((a, b) => a.at.localeCompare(b.at))
  events.sort((a, b) => a.at.localeCompare(b.at))
  return { xp: xpValues.length ? Math.max(...xpValues) : 0, records, submissions, events }
}

/** Cloud-connection state, surfaced in the UI as a sync indicator. */
export type SyncStatus = 'disabled' | 'idle' | 'syncing' | 'synced' | 'offline' | 'error'

interface AppState {
  /* auth */
  accounts: Account[]
  user: User | null
  onboarded: boolean

  /* cloud sync — `cloudUserId` is the Supabase auth id, null in local-only mode */
  cloudUserId: string | null
  syncStatus: SyncStatus
  syncError: string | null
  lastSyncedAt: string | null
  /** true while local changes have not reached Postgres yet */
  pendingSync: boolean

  /* progression — one slice per user, keyed by User.id */
  progressByUserId: Record<string, UserProgress>

  /* lazily-loaded seed catalogue — populated by ensureCatalogue(), never persisted */
  catalogue: Mission[] | null

  /* ui */
  theme: 'dark' | 'light'

  /* admin content overrides */
  adminMissions: Mission[]
  deletedMissionIds: string[]

  /* auth actions */
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  signup: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string; needsConfirmation?: boolean }>
  /** Re-send the Supabase signup confirmation email for a pending account. */
  resendConfirmation: (email: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  /** Re-hydrate the Supabase session on boot and merge the cloud slice down. */
  restoreSession: () => Promise<void>
  /** Push local state up, then merge the cloud copy back down. Safe to replay. */
  syncNow: () => Promise<void>
  completeOnboarding: (persona: string, excelLevel: 'Beginner' | 'Intermediate' | 'Advanced') => void
  updateUser: (patch: Partial<User>) => void

  /* theme */
  toggleTheme: () => void

  /* progression actions */
  startMission: (missionId: string) => Promise<boolean>
  toggleTaskCheck: (missionId: string, index: number) => void
  useHint: (missionId: string, cost: number, hintId?: string) => void
  submitAnswer: (
    mission: Mission,
    question: Question,
    input: SubmissionInput,
  ) => { correct: boolean; malformed?: string; expected?: string | number | string[] }
  completeMission: (missionId: string) => Promise<{ earned: number; newAchievements: Achievement[] } | null>
  addFinding: (finding: Omit<AuditFindingDraft, 'id' | 'createdAt'>) => string
  updateFinding: (id: string, patch: Partial<AuditFindingDraft>) => void
  removeFinding: (id: string) => void
  trackEvent: (type: AnalyticsEventType, props?: { missionId?: string; questionId?: string; value?: number }) => void

  /* demo helpers */
  resetProgress: () => void
  unlockAll: () => Promise<void>

  /* admin */
  upsertAdminMission: (mission: Mission) => void
  deleteAdminMission: (id: string) => void
}

function nowIso(): string {
  return new Date().toISOString()
}

/** v0/v1 persisted store: XP, records, submissions … at the top level, so every account on the browser shared one progress state. Move it into the signed-in user's slice; signed-out legacy progress is not claimable. */
export function migrateLegacyProgress(stored: Record<string, unknown>): Record<string, unknown> {
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

/** v2 persisted accounts stored the raw password. Salt-hash it and drop the plaintext so it never re-persists. */
function hashLegacyAccountPasswords(state: Record<string, unknown>): void {
  const accounts = state.accounts
  if (!Array.isArray(accounts)) return
  for (const a of accounts as Account[]) {
    const legacy = a as unknown as { password?: string; passwordHash?: string }
    if (legacy.password && !legacy.passwordHash) {
      legacy.passwordHash = hashPassword(legacy.password, randomId())
      delete legacy.password
    }
  }
}

/** Combined persisted-state migration: v0/v1 → per-user progress, v2 → hashed passwords. */
export function migratePersistedState(persisted: unknown, version: number): unknown {
  let state: Record<string, unknown>
  if (version < 2) {
    state = migrateLegacyProgress((persisted ?? {}) as Record<string, unknown>)
  } else {
    state = (persisted ?? {}) as Record<string, unknown>
  }
  if (version < 3) hashLegacyAccountPasswords(state)
  return state
}

/** Return the partial state that replaces the signed-in user's progress slice. No-op (empty object) when signed out, so `set(updateActive(...))` is safe. */
function updateActive(
  state: Pick<AppState, 'user' | 'progressByUserId'>,
  update: (p: UserProgress) => Partial<UserProgress>,
): Partial<Pick<AppState, 'progressByUserId'>> {
  const uid = state.user?.id
  if (!uid) return {}
  const prev = selectMyProgress(state)
  return { progressByUserId: { ...state.progressByUserId, [uid]: { ...prev, ...update(prev) } } }
}

/** Kick the code-split load of the 40-mission seed catalogue (idempotent). */
export function ensureCatalogue(): Promise<void> {
  if (useAppStore.getState().catalogue) return Promise.resolve()
  cataloguePromise ??= import('../data/missions/catalog').then((m) => {
    useAppStore.setState({ catalogue: m.MISSIONS })
  })
  return cataloguePromise
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

/** Subscribed accessor for components — re-renders once the catalogue loads. */
export function useMissions(): Mission[] {
  const catalogue = useAppStore((s) => s.catalogue)
  const adminMissions = useAppStore((s) => s.adminMissions)
  const deletedMissionIds = useAppStore((s) => s.deletedMissionIds)
  return useMemo(
    () => applyMissionOverrides(catalogue, adminMissions, deletedMissionIds),
    [catalogue, adminMissions, deletedMissionIds],
  )
}

/* ------------------------------------------------------------------ */
/* Mission list (lazily loaded seed + admin overrides)                */
/* ------------------------------------------------------------------ */

function applyMissionOverrides(
  catalogue: Mission[] | null,
  adminMissions: Mission[],
  deletedMissionIds: string[],
): Mission[] {
  const deleted = new Set(deletedMissionIds)
  const overrides = new Map(adminMissions.map((m) => [m.id, m]))
  const seedCum = catalogue ?? []
  const seeds = seedCum
    .filter((m) => !deleted.has(m.id))
    .map((m) => overrides.get(m.id) ?? m)
  const custom = adminMissions.filter(
    (m) => !seedCum.some((s) => s.id === m.id) && !deleted.has(m.id),
  )
  return [...seeds, ...custom]
}

/** Imperative accessor — an empty list until the catalogue finishes loading. */
export function allMissions(): Mission[] {
  const { catalogue, adminMissions, deletedMissionIds } = useAppStore.getState()
  return applyMissionOverrides(catalogue, adminMissions, deletedMissionIds)
}

let cataloguePromise: Promise<void> | null = null

/* ------------------------------------------------------------------ */
/* Cloud sync plumbing                                                */
/* ------------------------------------------------------------------ */

/** Match a submitted email/password against the local (offline) accounts. */
function matchLocalAccount(
  accounts: Account[],
  email: string,
  password: string,
): { ok: true; account: Account } | { ok: false; error: string } {
  const account = accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase())
  if (!account) return { ok: false, error: 'No account found for that email.' }
  if (!account.passwordHash || !verifyPassword(password, account.passwordHash)) {
    return { ok: false, error: 'Incorrect password.' }
  }
  return { ok: true, account }
}

const SYNC_DEBOUNCE_MS = 1200
const SYNC_MAX_BACKOFF_MS = 5 * 60_000

let syncTimer: ReturnType<typeof setTimeout> | null = null
let retryTimer: ReturnType<typeof setTimeout> | null = null
let retryDelay = 0

/** Debounced flush after a local mutation. No-op without a cloud session. */
function scheduleSync(delay = SYNC_DEBOUNCE_MS): void {
  if (!useAppStore.getState().cloudUserId) return
  useAppStore.setState({ pendingSync: true })
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    syncTimer = null
    void useAppStore.getState().syncNow()
  }, delay)
}

/** Retry a failed or offline flush with exponential backoff. */
function scheduleRetry(): void {
  if (retryTimer) return
  retryDelay = retryDelay ? Math.min(retryDelay * 2, SYNC_MAX_BACKOFF_MS) : 5_000
  retryTimer = setTimeout(() => {
    retryTimer = null
    if (useAppStore.getState().cloudUserId) void useAppStore.getState().syncNow()
  }, retryDelay)
}

function clearRetry(): void {
  retryDelay = 0
  if (retryTimer) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message
  return typeof error === 'string' ? error : 'Sync failed.'
}

/* ------------------------------------------------------------------ */
/* Auth actions                                                       */
/* ------------------------------------------------------------------ */

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      accounts: DEMO_ACCOUNTS,
      user: null,
      onboarded: false,
      progressByUserId: {},
      catalogue: null,
      theme: 'dark',
      adminMissions: [],
      deletedMissionIds: [],
      cloudUserId: null,
      syncStatus: supabase ? 'idle' : 'disabled',
      syncError: null,
      lastSyncedAt: null,
      pendingSync: false,

      login: async (email, password) => {
        const clean = email.trim().toLowerCase()
        const client = supabase

        if (client) {
          const { data, error } = await client.auth.signInWithPassword({
            email: clean,
            password,
          })

          if (!error && data.user) {
            const profile = await fetchProfile(client, data.user.id).catch(() => null)
            const user = userFromCloud(data.user as AuthUserLike, profile)
            set({
              user,
              cloudUserId: user.id,
              onboarded: Boolean(user.persona),
              syncStatus: 'idle',
            })
            get().trackEvent('login')
            // A device that has never held this learner's progress is empty
            // right now; wait for the pull so the caller can resume the mission
            // they left instead of offering mission 01. Local progress renders
            // immediately, so it does not hold up the sign-in.
            const known = Object.keys(get().progressByUserId[user.id]?.records ?? {}).length > 0
            if (known) void get().syncNow()
            else await get().syncNow()
            return { ok: true }
          }

          // The bundled demo accounts still sign in locally when Supabase is
          // configured — they simply have no cloud session, so sync stays off.
          const local = matchLocalAccount(get().accounts, clean, password)
          if (local.ok) {
            set({
              user: local.account.user,
              cloudUserId: null,
              onboarded: Boolean(local.account.user.persona),
            })
            get().trackEvent('login')
            return { ok: true }
          }
          return { ok: false, error: error?.message ?? 'Login failed.' }
        }

        const local = matchLocalAccount(get().accounts, clean, password)
        if (!local.ok) return { ok: false, error: local.error }
        set({ user: local.account.user, onboarded: Boolean(local.account.user.persona) })
        get().trackEvent('login')
        return { ok: true }
      },

      signup: async (name, email, password) => {
        const clean = email.trim().toLowerCase()
        if (!name.trim()) return { ok: false, error: 'Enter your name.' }
        if (!/^\S+@\S+\.\S+$/.test(clean)) return { ok: false, error: 'Enter a valid email.' }
        if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' }
        if (get().accounts.some((a) => a.email.toLowerCase() === clean))
          return { ok: false, error: 'An account already exists for that email.' }

        const client = supabase
        if (client) {
          const { data, error } = await client.auth.signUp({
            email: clean,
            password,
            options: { data: { full_name: name.trim() } },
          })

          if (!error && data.user) {
            // With "Confirm email" enabled Supabase creates the account but
            // returns no session. Without a JWT every read/write is rejected by
            // RLS, so stay signed out and let the learner confirm first.
            if (!data.session) return { ok: true, needsConfirmation: true }

            const profile = await fetchProfile(client, data.user.id).catch(() => null)
            const named: User = { ...userFromCloud(data.user as AuthUserLike, profile), name: name.trim() }
            set({ user: named, cloudUserId: named.id, onboarded: false, syncStatus: 'idle' })
            // Mirror the name immediately so it survives a device change.
            await pushProfile(client, named).catch(() => undefined)
            get().trackEvent('signup')
            void get().syncNow()
            return { ok: true }
          }
          // Fall through to a local account so a Supabase hiccup cannot block signup.
        }

        const user: User = {
          id: randomId(),
          name: name.trim(),
          email: clean,
          role: 'learner',
          avatarHue: Math.floor(Math.random() * 360),
          createdAt: new Date().toISOString(),
          demo: false,
        }

        set({
          accounts: [
            ...get().accounts,
            { email: clean, passwordHash: hashPassword(password, randomId()), user },
          ],
          user,
          onboarded: false,
        })
        get().trackEvent('signup')
        return { ok: true }
      },

      resendConfirmation: async (email) => {
        const client = supabase
        if (!client) {
          return { ok: false, error: 'Email confirmation is not available in local-only mode.' }
        }
        const { error } = await client.auth.resend({
          type: 'signup',
          email: email.trim().toLowerCase(),
        })
        if (error) return { ok: false, error: error.message }
        return { ok: true }
      },

      logout: async () => {
        const client = supabase
        if (client) {
          // Last-chance flush so offline work is not stranded; the local backup
          // keeps everything either way.
          await get().syncNow().catch(() => undefined)
          await client.auth.signOut().catch(() => undefined)
        }
        clearRetry()
        set({
          user: null,
          cloudUserId: null,
          syncStatus: client ? 'idle' : 'disabled',
          syncError: null,
          pendingSync: false,
        })
      },

      restoreSession: async () => {
        const client = supabase
        if (!client) {
          set({ syncStatus: 'disabled' })
          return
        }
        try {
          const { data } = await client.auth.getSession()
          const sessionUser = data.session?.user
          if (!sessionUser) {
            set({ syncStatus: 'idle' })
            return
          }
          const profile = await fetchProfile(client, sessionUser.id)
          const user = userFromCloud(sessionUser as AuthUserLike, profile)
          set({
            user,
            cloudUserId: user.id,
            onboarded: Boolean(user.persona),
            syncStatus: 'idle',
          })
          await get().syncNow()
        } catch (error) {
          set({ syncStatus: 'error', syncError: describeError(error) })
        }
      },

      syncNow: async () => {
        const client = supabase
        const state = get()
        const uid = state.cloudUserId
        if (!client || !uid) {
          set({ syncStatus: client ? 'idle' : 'disabled' })
          return
        }
        if (state.syncStatus === 'syncing') return
        const user = state.user
        if (!user) return

        set({ syncStatus: 'syncing', syncError: null })
        try {
          // Pull first, merge, then push the union: the cloud copy can never be
          // clobbered by a device that has been offline.
          const remote = await pullSnapshot(client, uid)
          const merged = mergeUserProgress(selectMyProgress(get()), remote)
          set((s) => ({ progressByUserId: { ...s.progressByUserId, [uid]: merged } }))
          await pushSnapshot(client, user, merged)
          set({
            syncStatus: 'synced',
            syncError: null,
            lastSyncedAt: nowIso(),
            pendingSync: false,
          })
          clearRetry()
        } catch (error) {
          const offline = typeof navigator !== 'undefined' && navigator.onLine === false
          set({
            syncStatus: offline ? 'offline' : 'error',
            syncError: describeError(error),
            pendingSync: true,
          })
          scheduleRetry()
        }
      },

      completeOnboarding: (persona, excelLevel) => {
        const user = get().user
        if (!user) return
        set({ user: { ...user, persona, excelLevel }, onboarded: true })
        get().trackEvent('onboarding_completed')
        scheduleSync()
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
        scheduleSync()
      },

      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        set({ theme: next })
        document.documentElement.classList.toggle('dark', next === 'dark')
      },

      startMission: async (missionId) => {
        const state = get()
        const uid = state.user?.id
        if (!uid) return false
        await ensureCatalogue()
        const missions = allMissions()
        const p = selectMyProgress(state)
        const completed = new Set(
          Object.entries(p.records)
            .filter(([, r]) => r.status === 'completed')
            .map(([id]) => id),
        )
        if (!isMissionUnlocked(missions, missionId, completed)) return false
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
                questionsTotal: getMission(missions, missionId)?.questions.length ?? 0,
              },
            },
          })),
        )
        state.trackEvent('mission_started', { missionId })
        scheduleSync()
        return true
      },

      toggleTaskCheck: (missionId, index) => {
        set(
          updateActive(get(), (p) => {
            const current = p.taskChecks[missionId] ?? []
            const next = current.includes(index)
              ? current.filter((i) => i !== index)
              : [...current, index]
            return { taskChecks: { ...p.taskChecks, [missionId]: next } }
          }),
        )
        scheduleSync()
      },

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
        scheduleSync()
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

        scheduleSync()
        return base
      },

      completeMission: async (missionId) => {
        const state = get()
        const uid = state.user?.id
        if (!uid) return null
        await ensureCatalogue()
        const mission =
          state.adminMissions.find((m) => m.id === missionId) ??
          getMission(allMissions(), missionId)
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

        const nxt = nextMission(allMissions(), missionId)
        if (nxt && nxt.levelId !== mission.levelId) {
          state.trackEvent('module_completed', { missionId })
        }

        scheduleSync()
        return { earned, newAchievements }
      },

      addFinding: (finding) => {
        const id = randomId()
        set(
          updateActive(get(), (p) => ({
            findings: [...p.findings, { ...finding, id, createdAt: nowIso() }],
          })),
        )
        scheduleSync()
        return id
      },

      updateFinding: (id, patch) => {
        set(
          updateActive(get(), (p) => ({
            findings: p.findings.map((f) => (f.id === id ? { ...f, ...patch } : f)),
          })),
        )
        scheduleSync()
      },

      removeFinding: (id) => {
        set(updateActive(get(), (p) => ({ findings: p.findings.filter((f) => f.id !== id) })))
        scheduleSync()
      },

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
        scheduleSync()
      },

      resetProgress: () => {
        const resetAt = nowIso()
        set(updateActive(get(), () => ({ ...EMPTY_PROGRESS, resetAt })))
        const client = supabase
        const uid = get().cloudUserId
        if (client && uid) {
          // Wipe the cloud rows too; if this cannot reach the network the
          // `resetAt` watermark still keeps the reset from being resurrected.
          void deleteCloudProgress(client, uid, resetAt)
            .then(() => get().syncNow())
            .catch(() => {
              useAppStore.setState({ pendingSync: true })
              scheduleRetry()
            })
        }
      },

      unlockAll: async () => {
        const state = get()
        if (!state.user?.id) return
        await ensureCatalogue()
        const missions = allMissions()
        set(
          updateActive(state, (p) => {
            const records = { ...p.records }
            for (const m of missions) {
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
        scheduleSync()
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
      version: 3,
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
      migrate: migratePersistedState,
    },
  ),
)

/* Keep the local session in step with Supabase — e.g. a sign-out in another tab. */
if (supabase) {
  supabase.auth.onAuthStateChange((_event, session) => {
    if (!session) {
      useAppStore.setState({ user: null, cloudUserId: null, syncStatus: 'idle' })
    }
  })
}

/* Flush as soon as the browser is back online rather than waiting on the backoff. */
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (useAppStore.getState().pendingSync) void useAppStore.getState().syncNow()
  })
}

/* ------------------------------------------------------------------ */
/* Achievement rules                                                  */
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