/**
 * Per-user progress isolation + account-security tests.
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
  migratePersistedState,
  SUBMISSIONS_CAP,
  EMPTY_PROGRESS,
  DEMO_ACCOUNTS,
} = await import('../store/app')
const { MISSIONS } = await import('../data/missions/catalog')
const { verifyPassword, hashPassword } = await import('../lib/hash')

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

const loginAs = async (email: string, password: string) => {
  const res = await useAppStore.getState().login(email, password)
  expect(res.ok).toBe(true)
}

const start = async (missionId: string) => {
  return useAppStore.getState().startMission(missionId)
}

describe('password hashing', () => {
  it('logs in with the correct password and rejects wrong ones', async () => {
    await loginAs('zoe@auditlab.app', 'demo1234')
    expect(useAppStore.getState().user?.id).toBe('u-zoe')

    useAppStore.getState().logout()
    const wrong = await useAppStore.getState().login('zoe@auditlab.app', 'wrong-password')
    expect(wrong.ok).toBe(false)
    expect(wrong.error).toBe('Incorrect password.')
    expect(useAppStore.getState().user).toBeNull()
  })

  it('never stores raw passwords in accounts or persistence', async () => {
    await useAppStore.getState().signup('New User', 'new@example.com', 's3cret!pw')
    const account = useAppStore.getState().accounts.find((a) => a.email === 'new@example.com')!
    expect(account.passwordHash).toBeTruthy()
    expect(JSON.stringify(account)).not.toContain('s3cret!pw')
    expect(verifyPassword('s3cret!pw', account.passwordHash)).toBe(true)

    const raw = mem.get('auditlab-store-v1')!
    expect(raw).not.toContain('s3cret!pw')
    expect(raw).not.toContain('demo1234')
    expect(raw).not.toContain('admin1234')
  })

  it('migrates legacy plaintext account passwords and reapplies per-user progress', () => {
    /* a v0 payload exactly as the old store wrote it */
    const migrated = migratePersistedState(
      {
        user: { id: 'u-legacy', name: 'Old Learner', role: 'learner', createdAt: '2025-09-01T09:00:00.000Z' },
        accounts: [
          {
            email: 'old@example.com',
            password: 'plaintext-pw',
            user: { id: 'u-legacy', name: 'Old Learner', role: 'learner', createdAt: '2025-09-01T09:00:00.000Z' },
          },
        ],
        xp: 650,
        records: {
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
        },
        taskChecks: { m01: [0, 1] },
        submissions: [],
        achievements: [],
        events: [],
        findings: [],
        theme: 'dark',
      },
      0,
    ) as Record<string, unknown>

    /* progress moves into the signed-in user's slice */
    expect(migrated).not.toHaveProperty('xp')
    const slices = migrated.progressByUserId as Record<string, { xp: number }>
    expect(slices['u-legacy'].xp).toBe(650)

    /* the plaintext password is hashed and gone */
    const account = (migrated.accounts as { email: string; passwordHash: string; password?: string }[])[0]!
    expect(account.password).toBeUndefined()
    expect(account.passwordHash).not.toContain('plaintext-pw')
    expect(verifyPassword('plaintext-pw', account.passwordHash)).toBe(true)
  })

  it('migrates v2 payloads with plaintext passwords too', () => {
    const state = {
      accounts: [{ email: 'a@example.com', password: 'hunter22', user: { id: 'u-a' } }],
      progressByUserId: {},
      theme: 'dark',
    }
    const migrated = migratePersistedState(state, 2) as {
      accounts: { passwordHash: string; password?: string }[]
    }
    expect(migrated.accounts[0]!.password).toBeUndefined()
    expect(verifyPassword('hunter22', migrated.accounts[0]!.passwordHash)).toBe(true)
  })

  it('passes v3+ payloads through untouched', () => {
    const current = { progressByUserId: { 'u-a': EMPTY_PROGRESS }, theme: 'dark' }
    expect(migratePersistedState(current, 3)).toBe(current)
  })
})

describe('per-user progress', () => {
  it('isolates XP and records per account on the same browser', async () => {
    await loginAs('zoe@auditlab.app', 'demo1234')
    expect(await start('m01')).toBe(true)
    const earned = await useAppStore.getState().completeMission('m01')
    expect(earned).not.toBeNull()
    const zoeXp = selectMyProgress(useAppStore.getState()).xp
    expect(zoeXp).toBe(earned!.earned)
    expect(selectMyProgress(useAppStore.getState()).records.m01?.status).toBe('completed')

    // switching accounts shows an entirely fresh slice
    useAppStore.getState().logout()
    await loginAs('admin@auditlab.app', 'admin1234')
    const adminView = selectMyProgress(useAppStore.getState())
    expect(adminView.xp).toBe(0)
    expect(Object.keys(adminView.records)).toHaveLength(0)

    // the admin can do the same mission without touching Zoe's record
    expect(await start('m01')).toBe(true)
    await useAppStore.getState().completeMission('m01')

    useAppStore.getState().logout()
    await loginAs('zoe@auditlab.app', 'demo1234')
    const zoe = useAppStore.getState().progressByUserId['u-zoe']
    expect(zoe.records.m01?.status).toBe('completed')
    expect(zoe.xp).toBe(zoeXp)
    const admin = useAppStore.getState().progressByUserId['u-admin']
    expect(admin.records.m01?.status).toBe('completed')
    expect(admin).not.toBe(zoe)
  })

  it('default progress of a new signup starts clean and separate', async () => {
    await loginAs('zoe@auditlab.app', 'demo1234')
    expect(await start('m01')).toBe(true)
    await useAppStore.getState().completeMission('m01')

    await useAppStore.getState().signup('Test User', 'test@example.com', 'test1234')
    const view = selectMyProgress(useAppStore.getState())
    // a fresh account has a clean slice of its own — the only thing recorded at
    // signup is the analytics event
    expect(view).not.toBe(EMPTY_PROGRESS)
    expect(view.xp).toBe(0)
    expect(Object.keys(view.records)).toHaveLength(0)
    expect(view.submissions).toHaveLength(0)
    expect(await start('m02')).toBe(false) // locked until m01 done
  })

  it('ignores progression actions and events when signed out', async () => {
    await loginAs('zoe@auditlab.app', 'demo1234')
    expect(await start('m01')).toBe(true)
    await useAppStore.getState().logout()

    const before = mem.get('auditlab-store-v1')
    expect(await start('m01')).toBe(false)
    expect(selectMyProgress(useAppStore.getState())).toBe(EMPTY_PROGRESS)
    useAppStore.getState().trackEvent('login')
    useAppStore.getState().toggleTaskCheck('m01', 0)
    useAppStore.getState().useHint('m01', 10)
    expect(mem.get('auditlab-store-v1')).toBe(before)
  })

  it('caps the per-user submissions log at SUBMISSIONS_CAP', async () => {
    await loginAs('zoe@auditlab.app', 'demo1234')
    expect(await start('m01')).toBe(true)

    const bloat = Array.from({ length: SUBMISSIONS_CAP + 5 }, (_, i) => ({
      id: `old-${i}`,
      missionId: 'm01',
      questionId: `m01-q${(i % 3) + 1}`,
      answer: 'x',
      correct: false,
      attempts: 1,
      at: '2025-01-01T00:00:00.000Z',
    }))
    useAppStore.setState((s) => ({
      progressByUserId: {
        ...s.progressByUserId,
        'u-zoe': { ...EMPTY_PROGRESS, submissions: bloat },
      },
    }))

    /* one more submission trims the oldest entries, not the new one */
    const mission = MISSIONS.find((m) => m.id === 'm01')!
    const question = mission.questions[0]!
    useAppStore.getState().submitAnswer(mission, question, { optionId: 'opt-a' })

    const subs = selectMyProgress(useAppStore.getState()).submissions
    expect(subs).toHaveLength(SUBMISSIONS_CAP)
    expect(subs[0]!.id).not.toBe('old-0')
    expect(subs.at(-1)?.id).not.toMatch(/^old-/)
    expect(subs.at(-1)?.missionId).toBe('m01')
  })

  it('persists one slice per user under version 3', async () => {
    await loginAs('zoe@auditlab.app', 'demo1234')
    await start('m01')
    await useAppStore.getState().completeMission('m01')

    const raw = JSON.parse(mem.get('auditlab-store-v1')!)
    expect(raw.version).toBe(3)
    expect(Object.keys(raw.state.progressByUserId)).toEqual(['u-zoe'])
    expect(raw.state.xp).toBeUndefined()
    expect(raw.state.records).toBeUndefined()
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
        submissions: [
          { id: 'a', missionId: 'm01', questionId: 'm01-q1', answer: 'x', correct: false, attempts: 1, at: '2025-09-24T09:30:00.000Z' },
        ],
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
        submissions: [
          { id: 'b', missionId: 'm01', questionId: 'm01-q1', answer: 'y', correct: true, attempts: 1, at: '2025-09-24T10:30:00.000Z' },
        ],
        events: [{ id: 'e2', type: 'mission_completed', missionId: 'm01', at: '2025-09-24T11:00:00.000Z' }],
      },
    ])

    expect(merged.records.m01?.status).toBe('completed')
    expect(merged.records.m01?.completedAt).toBe('2025-09-24T11:00:00.000Z')
    expect(merged.records.m01?.attempts).toBe(2)
    expect(merged.submissions.map((s) => s.id)).toEqual(['a', 'b'])
    expect(merged.events.map((e) => e.id)).toEqual(['e2'])
  })

  it('shows hashed demo credentials survive resetStore round-trips', () => {
    for (const account of [...DEMO_ACCOUNTS]) {
      expect(account.passwordHash).toMatch(/^\w+\$[0-9a-f]{64}$/)
      expect(JSON.stringify(account)).not.toContain('demo1234')
    }
    const clone = hashPassword('demo1234', 'auditlab')
    expect(clone).toBe(DEMO_ACCOUNTS[0]!.passwordHash)
  })
})
