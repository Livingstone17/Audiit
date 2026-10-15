/**
 * Per-user progress isolation tests.
 *
 * Regression coverage for the earlier structure in which XP, records,
 * submissions … sat at the top of the persisted store, so every account on
 * the same browser shared one progress state.
 */
import { describe, expect, it, beforeEach } from 'vitest'

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

const {
  useAppStore,
  selectMyProgress,
  mergeProgress,
  migrateLegacyProgress,
  EMPTY_PROGRESS,
  DEMO_ACCOUNTS,
} = await import('../store/app')

function resetStore() {
  useAppStore.setState({
    accounts: [...DEMO_ACCOUNTS],
    user: null,
    onboarded: false,
    theme: 'dark',
    adminMissions: [],
    deletedMissionIds: [],
    progressByUserId: {},
  })
}

beforeEach(() => {
  mem.clear()
  resetStore()
})

const loginAs = (email: string, password: string) => {
  const res = useAppStore.getState().login(email, password)
  expect(res.ok).toBe(true)
}

describe('per-user progress', () => {
  it('isolates XP and records per account on the same browser', () => {
    loginAs('zoe@auditlab.app', 'demo1234')
    expect(useAppStore.getState().startMission('m01')).toBe(true)
    const earned = useAppStore.getState().completeMission('m01')
    expect(earned).not.toBeNull()
    const zoeXp = selectMyProgress(useAppStore.getState()).xp
    expect(zoeXp).toBe(earned!.earned)
    expect(selectMyProgress(useAppStore.getState()).records.m01?.status).toBe('completed')

    // switching accounts shows an entirely fresh slice
    useAppStore.getState().logout()
    loginAs('admin@auditlab.app', 'admin1234')
    const adminView = selectMyProgress(useAppStore.getState())
    expect(adminView.xp).toBe(0)
    expect(Object.keys(adminView.records)).toHaveLength(0)

    // the admin can do the same mission without touching Zoe's record
    expect(useAppStore.getState().startMission('m01')).toBe(true)
    useAppStore.getState().completeMission('m01')

    useAppStore.getState().logout()
    loginAs('zoe@auditlab.app', 'demo1234')
    const zoe = useAppStore.getState().progressByUserId['u-zoe']
    expect(zoe.records.m01?.status).toBe('completed')
    expect(zoe.xp).toBe(zoeXp)
    const admin = useAppStore.getState().progressByUserId['u-admin']
    expect(admin.records.m01?.status).toBe('completed')
    expect(admin).not.toBe(zoe)
  })

  it('default progress of a new signup starts clean and separate', () => {
    loginAs('zoe@auditlab.app', 'demo1234')
    expect(useAppStore.getState().startMission('m01')).toBe(true)
    useAppStore.getState().completeMission('m01')

    useAppStore.getState().signup('Test User', 'test@example.com', 'test1234')
    const view = selectMyProgress(useAppStore.getState())
    expect(view).toBe(EMPTY_PROGRESS)
    expect(useAppStore.getState().startMission('m02')).toBe(false) // locked until m01 done
  })

  it('ignores progression actions and events when signed out', () => {
    loginAs('zoe@auditlab.app', 'demo1234')
    expect(useAppStore.getState().startMission('m01')).toBe(true)
    useAppStore.getState().logout()

    const before = mem.get('auditlab-store-v1')
    expect(useAppStore.getState().startMission('m01')).toBe(false)
    expect(selectMyProgress(useAppStore.getState())).toBe(EMPTY_PROGRESS)
    useAppStore.getState().trackEvent('login')
    useAppStore.getState().toggleTaskCheck('m01', 0)
    useAppStore.getState().useHint('m01', 10)
    expect(mem.get('auditlab-store-v1')).toBe(before)
  })

  it('persists one slice per user under version 2', () => {
    loginAs('zoe@auditlab.app', 'demo1234')
    useAppStore.getState().startMission('m01')
    useAppStore.getState().completeMission('m01')

    const raw = JSON.parse(mem.get('auditlab-store-v1')!)
    expect(raw.version).toBe(2)
    expect(Object.keys(raw.state.progressByUserId)).toEqual(['u-zoe'])
    expect(raw.state.xp).toBeUndefined()
    expect(raw.state.records).toBeUndefined()
  })

  it('migrates legacy shared progress into the signed-in user’s slice', () => {
    const legacyUser = {
      id: 'u-legacy',
      name: 'Old Learner',
      email: 'old@auditlab.app',
      role: 'learner',
      createdAt: '2025-09-01T09:00:00.000Z',
    }
    const legacySlice = {
      m01: {
        status: 'completed',
        startedAt: '2025-09-24T09:00:00.000Z',
        completedAt: '2025-09-24T10:00:00.000Z',
        attempts: 1,
        firstTryCorrect: true,
        hintsUsed: 0,
        hintXp: 0,
        questionsCorrect: 3,
        questionsTotal: 3,
      },
    }
    const migrated = migrateLegacyProgress(
      {
        accounts: [],
        user: legacyUser,
        onboarded: true,
        xp: 650,
        records: legacySlice,
        taskChecks: { m01: [0, 1] },
        submissions: [
          { id: 's1', missionId: 'm01', questionId: 'm01-q1', answer: '320', correct: true, attempts: 1, at: '2025-09-25T10:00:00.000Z' },
        ],
        achievements: ['first-finding'],
        events: [{ id: 'e1', type: 'xp_earned', value: 100, at: '2025-09-24T10:00:00.000Z' }],
        findings: [],
        theme: 'dark',
        adminMissions: [],
        deletedMissionIds: [],
      },
      0,
    ) as Record<string, unknown>

    /* everything lands in the signed-in user's slice */
    expect(migrated).not.toHaveProperty('xp')
    expect(migrated).not.toHaveProperty('records')
    expect(migrated).not.toHaveProperty('submissions')
    const slices = migrated.progressByUserId as Record<string, { xp: number }>
    expect(Object.keys(slices)).toEqual(['u-legacy'])
    expect(slices['u-legacy'].xp).toBe(650)
    expect((slices['u-legacy'] as unknown as { records: typeof legacySlice }).records).toEqual(
      legacySlice,
    )

    /* current payloads pass through untouched */
    const current = { progressByUserId: { 'u-a': EMPTY_PROGRESS }, theme: 'dark' }
    expect(migrateLegacyProgress(current, 2)).toBe(current)
  })
})

describe('mergeProgress (admin aggregation)', () => {
  it('merges records across users with completion outranking in-progress', () => {
    const merged = mergeProgress([
      {
        ...EMPTY_PROGRESS,
        records: {
          m01: {
            status: 'in-progress',
            startedAt: '2025-09-24T09:00:00.000Z',
            attempts: 2,
            firstTryCorrect: false,
            hintsUsed: 1,
            hintXp: 10,
            questionsCorrect: 1,
            questionsTotal: 3,
          },
        },
        submissions: [{ id: 'a', missionId: 'm01', questionId: 'm01-q1', answer: 'x', correct: false, attempts: 1, at: '2025-09-24T09:30:00.000Z' }],
      },
      {
        ...EMPTY_PROGRESS,
        records: {
          m01: {
            status: 'completed',
            startedAt: '2025-09-24T10:00:00.000Z',
            completedAt: '2025-09-24T11:00:00.000Z',
            attempts: 1,
            firstTryCorrect: true,
            hintsUsed: 0,
            hintXp: 0,
            questionsCorrect: 3,
            questionsTotal: 3,
          },
        },
        submissions: [{ id: 'b', missionId: 'm01', questionId: 'm01-q1', answer: 'y', correct: true, attempts: 1, at: '2025-09-24T10:30:00.000Z' }],
        events: [{ id: 'e2', type: 'mission_completed', missionId: 'm01', at: '2025-09-24T11:00:00.000Z' }],
      },
    ])

    expect(merged.records.m01?.status).toBe('completed')
    expect(merged.records.m01?.completedAt).toBe('2025-09-24T11:00:00.000Z')
    expect(merged.records.m01?.attempts).toBe(2)
    expect(merged.submissions.map((s) => s.id)).toEqual(['a', 'b'])
    expect(merged.events.map((e) => e.id)).toEqual(['e2'])
  })
})
