/**
 * Supabase backend coverage.
 *
 * The `../lib/supabase` module is mocked with an in-memory fake, so these tests
 * exercise the real wiring: Supabase auth on login/signup/restore, the
 * push→pull→merge sync cycle, the offline retry path and the reset watermark.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/supabase', async () => {
  const { fakeSupabase } = await import('./helpers/fakeSupabase')
  return { supabase: fakeSupabase, isSupabaseConfigured: () => true }
})

/* Reliable localStorage shim (Node's experimental global is a stub here) */
const mem = new Map<string, string>()
const storageShim = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, String(v)),
  removeItem: (k: string) => void mem.delete(k),
  clear: () => mem.clear(),
  key: (i: number) => [...mem.keys()][i] ?? null,
  get length() {
    return mem.size
  },
}
Object.defineProperty(globalThis, 'localStorage', {
  value: storageShim,
  configurable: true,
})

import type { MissionRecord } from '../lib/types'
import type { UserProgress } from '../store/app'
import type { FakeUser } from './helpers/fakeSupabase'

const { fakeSupabase } = await import('./helpers/fakeSupabase')
const { useAppStore, selectMyProgress, DEMO_ACCOUNTS } = await import('../store/app')
const { mergeMissionRecord, mergeUserProgress } = await import('../lib/sync')
const { MISSIONS } = await import('../data/missions/catalog')

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const rows = (table: string) => fakeSupabase.db.tables[table] ?? []

function progress(patch: Partial<UserProgress> = {}): UserProgress {
  return {
    xp: 0,
    records: {},
    taskChecks: {},
    submissions: [],
    achievements: [],
    events: [],
    findings: [],
    ...patch,
  }
}

const record = (patch: Partial<MissionRecord> = {}): MissionRecord => ({
  status: 'in-progress',
  startedAt: '2026-01-02T10:00:00.000Z',
  attempts: 1,
  firstTryCorrect: true,
  hintsUsed: 0,
  hintXp: 0,
  revealedHints: [],
  questionsCorrect: 0,
  questionsTotal: 3,
  ...patch,
})

function resetLocal() {
  mem.clear()
  useAppStore.setState({
    accounts: [...DEMO_ACCOUNTS],
    user: null,
    onboarded: false,
    progressByUserId: {},
    cloudUserId: null,
    syncStatus: 'idle',
    syncError: null,
    lastSyncedAt: null,
    pendingSync: false,
  })
}

/** Wait for an in-flight sync to finish (the store serialises syncs). */
async function idle(): Promise<void> {
  for (let i = 0; i < 100; i++) {
    if (useAppStore.getState().syncStatus !== 'syncing') return
    await new Promise((resolve) => setTimeout(resolve, 2))
  }
}

/** Let pending work settle, then force one final flush. */
async function flushSync(): Promise<void> {
  await idle()
  await useAppStore.getState().syncNow()
  await idle()
}

/* ------------------------------------------------------------------ */
/* pure merge rules                                                    */
/* ------------------------------------------------------------------ */

describe('mergeMissionRecord', () => {
  it('lets completion outrank in-progress and keeps the best counters', () => {
    const merged = mergeMissionRecord(
      record({ startedAt: '2026-01-02T10:00:00.000Z' }),
      record({
        status: 'completed',
        completedAt: '2026-01-03T10:00:00.000Z',
        startedAt: '2026-01-01T10:00:00.000Z',
        attempts: 5,
        firstTryCorrect: false,
        hintsUsed: 3,
        hintXp: 30,
        revealedHints: ['h2'],
        questionsCorrect: 3,
      }),
    )

    expect(merged.status).toBe('completed')
    expect(merged.startedAt).toBe('2026-01-01T10:00:00.000Z')
    expect(merged.completedAt).toBe('2026-01-03T10:00:00.000Z')
    expect(merged.attempts).toBe(5)
    expect(merged.hintsUsed).toBe(3)
    expect(merged.hintXp).toBe(30)
    expect(merged.revealedHints).toEqual(['h2'])
    expect(merged.questionsCorrect).toBe(3)
    expect(merged.firstTryCorrect).toBe(false)
  })
})

describe('mergeUserProgress', () => {
  const submission = (id: string, at: string) => ({
    id,
    missionId: 'm01',
    questionId: 'm01-q1',
    answer: 'x',
    correct: true,
    attempts: 1,
    at,
  })

  it('unions the append-only logs by id and takes the highest XP', () => {
    const local = progress({
      xp: 120,
      records: { m01: record() },
      taskChecks: { m01: [0, 1] },
      submissions: [submission('s1', '2026-01-01T00:00:00.000Z')],
      achievements: ['a1'],
      findings: [
        {
          id: 'f1',
          missionId: 'm01',
          title: 't',
          condition: '',
          criteria: '',
          cause: '',
          effect: '',
          recommendation: '',
          response: '',
          owner: '',
          dueDate: '',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    })
    const remote = progress({
      xp: 300,
      taskChecks: { m01: [1, 2] },
      submissions: [
        submission('s1', '2026-01-01T00:00:00.000Z'),
        submission('s2', '2026-01-02T00:00:00.000Z'),
      ],
      achievements: ['a1', 'a2'],
    })

    const merged = mergeUserProgress(local, remote)
    expect(merged.xp).toBe(300)
    expect(merged.submissions.map((s) => s.id)).toEqual(['s1', 's2'])
    expect(merged.achievements).toEqual(['a1', 'a2'])
    expect(merged.taskChecks.m01).toEqual([0, 1, 2])
    expect(merged.findings.map((f) => f.id)).toEqual(['f1'])
    expect(merged.records.m01?.status).toBe('in-progress')
  })

  it('lets the most recent reset discard the stale side in either direction', () => {
    const stale = progress({
      xp: 900,
      records: { m01: record({ status: 'completed', completedAt: '2026-01-05T00:00:00.000Z' }) },
    })
    const reset = progress({ xp: 0, resetAt: '2026-02-01T00:00:00.000Z' })

    for (const merged of [mergeUserProgress(reset, stale), mergeUserProgress(stale, reset)]) {
      expect(merged.xp).toBe(0)
      expect(merged.records).toEqual({})
      expect(merged.resetAt).toBe('2026-02-01T00:00:00.000Z')
    }
  })

  it('leaves the watermark unset when neither side has reset', () => {
    expect(mergeUserProgress(progress(), progress()).resetAt).toBeUndefined()
  })
})

/* ------------------------------------------------------------------ */
/* store ⇄ Supabase wiring                                             */
/* ------------------------------------------------------------------ */

describe('cloud sync through the store', () => {
  let user: FakeUser

  beforeEach(() => {
    fakeSupabase.reset()
    resetLocal()
    user = fakeSupabase.addUser('learner@example.com', 'pw123456', { full_name: 'Cloud Learner' })
  })

  it('signs in through Supabase and mirrors progress into Postgres', async () => {
    const res = await useAppStore.getState().login('learner@example.com', 'pw123456')
    expect(res.ok).toBe(true)
    expect(useAppStore.getState().cloudUserId).toBe(user.id)
    expect(useAppStore.getState().user?.name).toBe('Cloud Learner')

    expect(await useAppStore.getState().startMission('m01')).toBe(true)
    const mission = MISSIONS.find((m) => m.id === 'm01')!
    useAppStore.getState().submitAnswer(mission, mission.questions[0]!, { optionId: 'opt-a' })
    await useAppStore.getState().completeMission('m01')
    await flushSync()

    expect(useAppStore.getState().syncStatus).toBe('synced')
    expect(useAppStore.getState().pendingSync).toBe(false)

    expect(rows('profiles')).toHaveLength(1)
    expect(rows('profiles')[0]!.name).toBe('Cloud Learner')

    expect(rows('user_progress')).toHaveLength(1)
    expect(rows('user_progress')[0]!.xp as number).toBeGreaterThan(0)

    const records = rows('mission_records')
    expect(records).toHaveLength(1)
    expect(records[0]!.mission_id).toBe('m01')
    expect(records[0]!.status).toBe('completed')

    expect(rows('submissions').length).toBeGreaterThan(0)
    expect(rows('analytics_events').length).toBeGreaterThan(0)
  })

  it('keeps a stored onboarding answer when the profile read fails', async () => {
    fakeSupabase.db.tables['profiles'] = [
      {
        id: user.id,
        name: 'Cloud Learner',
        role: 'learner',
        persona: 'Audit trainee',
        excel_level: 'Intermediate',
        avatar_hue: 152,
        created_at: '2026-01-01T00:00:00.000Z',
      },
    ]
    /* the sign-in's profile read is the first query, and it fails */
    fakeSupabase.db.failNext = { message: 'network down' }

    const res = await useAppStore.getState().login('learner@example.com', 'pw123456')
    expect(res.ok).toBe(true)
    await flushSync()

    /* the later push must not null out what the failed read could not see */
    expect(rows('profiles')[0]!.persona).toBe('Audit trainee')
    expect(rows('profiles')[0]!.excel_level).toBe('Intermediate')
  })

  it('restores a second device from the cloud backup', async () => {
    await useAppStore.getState().login('learner@example.com', 'pw123456')
    expect(await useAppStore.getState().startMission('m01')).toBe(true)
    const earned = await useAppStore.getState().completeMission('m01')
    await flushSync()
    expect(rows('mission_records')[0]!.status).toBe('completed')

    /* a different browser: no local slice at all, only the session cookie */
    resetLocal()
    await useAppStore.getState().restoreSession()
    await idle()

    const restored = selectMyProgress(useAppStore.getState())
    expect(useAppStore.getState().cloudUserId).toBe(user.id)
    expect(restored.records.m01?.status).toBe('completed')
    expect(restored.xp).toBe(earned!.earned)
  })

  it('keeps the local backup when the cloud is unreachable, then retries', async () => {
    await useAppStore.getState().login('learner@example.com', 'pw123456')
    await flushSync()
    expect(await useAppStore.getState().startMission('m01')).toBe(true)

    fakeSupabase.db.failNext = { message: 'network unreachable' }
    await useAppStore.getState().syncNow()

    expect(useAppStore.getState().syncStatus).toBe('error')
    expect(useAppStore.getState().pendingSync).toBe(true)
    /* the local slice is untouched and still renders */
    expect(selectMyProgress(useAppStore.getState()).records.m01?.status).toBe('in-progress')

    await useAppStore.getState().syncNow()
    expect(useAppStore.getState().syncStatus).toBe('synced')
    expect(useAppStore.getState().pendingSync).toBe(false)
    expect(rows('mission_records')[0]!.status).toBe('in-progress')
  })

  it('wipes the cloud copy on reset and never resurrects it', async () => {
    await useAppStore.getState().login('learner@example.com', 'pw123456')
    await useAppStore.getState().startMission('m01')
    await useAppStore.getState().completeMission('m01')
    await flushSync()
    expect(rows('mission_records')).toHaveLength(1)

    useAppStore.getState().resetProgress()
    await flushSync()

    expect(selectMyProgress(useAppStore.getState()).xp).toBe(0)
    expect(rows('mission_records')).toHaveLength(0)
    expect(rows('submissions')).toHaveLength(0)

    /* a later pull must not bring the deleted rows back */
    await flushSync()
    expect(selectMyProgress(useAppStore.getState()).xp).toBe(0)
    expect(selectMyProgress(useAppStore.getState()).records).toEqual({})
    expect(rows('mission_records')).toHaveLength(0)
  })

  it('still signs the bundled demo accounts in without a cloud session', async () => {
    const res = await useAppStore.getState().login('zoe@auditlab.app', 'demo1234')
    expect(res.ok).toBe(true)
    expect(useAppStore.getState().user?.id).toBe('u-zoe')
    expect(useAppStore.getState().cloudUserId).toBeNull()
    expect(useAppStore.getState().syncStatus).toBe('idle')
  })

  it('stays signed out when Supabase requires email confirmation', async () => {
    fakeSupabase.requireEmailConfirmation = true
    const res = await useAppStore.getState().signup('Pending User', 'pending@example.com', 'pw123456')

    expect(res).toMatchObject({ ok: true, needsConfirmation: true })
    const state = useAppStore.getState()
    /* no broken half-session: no JWT means every sync would fail on RLS */
    expect(state.user).toBeNull()
    expect(state.cloudUserId).toBeNull()
    expect(fakeSupabase.sessionUser).toBeNull()
    expect(state.syncStatus).toBe('idle')
    /* the account lives in Supabase, not as a duplicate local account */
    expect(state.accounts.some((a) => a.email === 'pending@example.com')).toBe(false)
    expect(rows('profiles')).toHaveLength(0)
  })

  it('resends the confirmation email and surfaces Supabase errors', async () => {
    const sent = await useAppStore.getState().resendConfirmation(' Pending@Example.com ')
    expect(sent).toEqual({ ok: true })
    expect(fakeSupabase.resentEmails).toEqual(['pending@example.com'])

    fakeSupabase.failResend = { message: 'email rate limit exceeded' }
    const failed = await useAppStore.getState().resendConfirmation('pending@example.com')
    expect(failed).toEqual({ ok: false, error: 'email rate limit exceeded' })
  })

  it('registers new accounts in Supabase and clears the session on logout', async () => {
    const res = await useAppStore.getState().signup('Fresh User', 'fresh@example.com', 'pw123456')
    expect(res.ok).toBe(true)
    const created = useAppStore.getState()
    expect(created.cloudUserId).toBeTruthy()
    expect(created.user?.name).toBe('Fresh User')
    await idle()
    expect(rows('profiles')[0]!.name).toBe('Fresh User')

    await useAppStore.getState().logout()
    expect(useAppStore.getState().user).toBeNull()
    expect(useAppStore.getState().cloudUserId).toBeNull()
    expect(fakeSupabase.sessionUser).toBeNull()
  })
})
