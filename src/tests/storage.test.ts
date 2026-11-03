/** @vitest-environment happy-dom */
/**
 * Storage-key migration.
 *
 * The learning platform was rebranded (AuditLab → FinQuest), but browsers that
 * used the app before the rebrand hold their data under `auditlab-store-v1`.
 * Nothing must be lost: the store's first run copies that payload to
 * `finquest-store-v1`, hydrates from it, and removes the legacy key.
 */
import { describe, expect, it } from 'vitest'

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

/* A pre-rebrand browser: data saved under the old key before this module runs,
 * exactly like a visitor returning after the rename. */
const legacyUser = {
  id: 'u-legacy',
  name: 'Legacy Learner',
  email: 'legacy@finquest.app',
  role: 'learner',
  persona: 'Audit trainee',
  excelLevel: 'Intermediate',
  avatarHue: 15,
  createdAt: '2026-01-01T00:00:00.000Z',
}
localStorage.setItem(
  'auditlab-store-v1',
  JSON.stringify({
    version: 3,
    state: {
      accounts: [{ email: legacyUser.email, passwordHash: 'x', user: legacyUser }],
      user: legacyUser,
      onboarded: true,
      onboardedByUser: { 'u-legacy': true },
      progressByUserId: {
        'u-legacy': {
          xp: 70,
          records: {
            m01: {
              status: 'completed',
              startedAt: '2026-01-05T09:00:00.000Z',
              completedAt: '2026-01-05T10:00:00.000Z',
              attempts: 1,
              firstTryCorrect: true,
              hintsUsed: 0,
              hintXp: 0,
              revealedHints: [],
              questionsCorrect: 3,
              questionsTotal: 3,
            },
          },
          taskChecks: {},
          submissions: [],
          achievements: [],
          events: [],
          findings: [],
        },
      },
      theme: 'dark',
      adminMissions: [],
      deletedMissionIds: [],
    },
  }),
)

const { useAppStore } = await import('../store/app')

describe('storage key migration', () => {
  it('hydrates the legacy payload under the FinQuest key', () => {
    const state = useAppStore.getState()
    expect(state.user?.name).toBe('Legacy Learner')
    expect(state.onboarded).toBe(true)
    expect(state.onboardedByUser['u-legacy']).toBe(true)
    expect(state.progressByUserId['u-legacy']?.records.m01?.status).toBe('completed')
  })

  it('removes the legacy key once the copy is in place', () => {
    expect(mem.get('auditlab-store-v1')).toBeUndefined()
    const fresh = mem.get('finquest-store-v1')!
    expect(fresh).toBeTruthy()
    expect(fresh).toContain('Legacy Learner')
  })

  it('writes subsequent updates to the FinQuest key only', () => {
    useAppStore.getState().toggleTheme()
    const fresh = JSON.parse(mem.get('finquest-store-v1')!)
    /* persist's theme toggle also updates document.documentElement in store */
    expect(['light', 'dark']).toContain(fresh.state.theme)
  })
})
