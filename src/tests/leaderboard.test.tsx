/** @vitest-environment happy-dom */
/**
 * Leaderboard page data sourcing.
 *
 * The page pulls live standings from the `leaderboard` SQL view through the
 * store, overlays the signed-in learner's *local* numbers (they can be ahead
 * of the last cloud flush), and falls back to the bundled seed peers when no
 * backend is reachable.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { act } from 'react'

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

/* we drive the poll interval with act() ourselves */
;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const { fakeSupabase } = await import('./helpers/fakeSupabase')
const { useAppStore, DEMO_ACCOUNTS } = await import('../store/app')
const { LeaderboardPage } = await import('../pages/LeaderboardPage')

beforeEach(() => {
  cleanup()
  mem.clear()
  fakeSupabase.reset()
  useAppStore.setState({
    accounts: [...DEMO_ACCOUNTS],
    user: null,
    onboarded: false,
    onboardedByUser: {},
    progressByUserId: {},
    cloudUserId: null,
    syncStatus: 'idle',
    syncError: null,
    lastSyncedAt: null,
    pendingSync: false,
    leaderboard: null,
    leaderboardLoading: false,
    leaderboardError: null,
  })
})

afterEach(cleanup)

function leaderboardRow(
  id: string,
  name: string,
  xp: number,
  extra: Record<string, unknown> = {},
) {
  return {
    id,
    name,
    persona: 'Audit trainee',
    avatar_hue: 280,
    role: 'learner',
    xp,
    missions_completed: 0,
    accuracy: 0,
    last_active_at: null,
    xp_last_7d: 0,
    missions_last_7d: 0,
    streak: 0,
    ...extra,
  }
}

describe('LeaderboardPage', () => {
  it('ranks live entries and overlays the local learner numbers', async () => {
    fakeSupabase.db.tables['leaderboard'] = [
      leaderboardRow('u-top', 'Amara Live', 4820, {
        missions_completed: 17,
        accuracy: 92,
        xp_last_7d: 410,
        missions_last_7d: 2,
        streak: 3,
      }),
      leaderboardRow('u-me', 'Board Learner', 900, { missions_completed: 4, accuracy: 80 }),
    ]
    useAppStore.setState({
      user: {
        id: 'u-me',
        name: 'Board Learner',
        email: 'board@example.com',
        role: 'learner',
        persona: 'Student',
        avatarHue: 42,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      cloudUserId: 'u-me',
      progressByUserId: {
        'u-me': {
          xp: 500,
          records: {
            m01: {
              status: 'completed',
              startedAt: '2026-09-01T09:00:00.000Z',
              completedAt: '2026-09-01T10:00:00.000Z',
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
          submissions: [
            {
              id: 's1',
              missionId: 'm01',
              questionId: 'm01-q1',
              answer: '320',
              correct: true,
              attempts: 1,
              at: '2026-09-01T09:30:00.000Z',
            },
          ],
          achievements: [],
          events: [],
          findings: [],
        },
      },
    })

    render(<LeaderboardPage />)

    /* the live leader appears on the podium *and* in the table */
    const leaders = await screen.findAllByText('Amara Live')
    expect(leaders.length).toBeGreaterThan(0)
    /* live peer keeps its cloud XP... */
    expect(screen.getByText('4.8k')).toBeTruthy()
    /* ...while the signed-in learner shows the fresher local XP (500), not the
     * stale 900 from the view */
    expect(screen.getByText('500')).toBeTruthy()
    expect(screen.getAllByText(/you\)/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Live standings synced from the cloud\./i)).toBeTruthy()
    /* the local learner cannot out-rank the seeded leader on XP */
    const rowsHtml = document.body.textContent ?? ''
    expect(rowsHtml.indexOf('Amara Live')).toBeLessThan(rowsHtml.indexOf('Board Learner'))
  })

  it('shows the row momentum stats', async () => {
    fakeSupabase.db.tables['leaderboard'] = [
      leaderboardRow('u-hot', 'On Fire', 2000, { xp_last_7d: 410, missions_last_7d: 2, streak: 3 }),
      leaderboardRow('u-cold', 'Cold Streak', 1500),
    ]
    useAppStore.setState({
      user: {
        id: 'u-cold',
        name: 'Cold Streak',
        email: 'cold@example.com',
        role: 'learner',
        persona: 'Student',
        avatarHue: 42,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      cloudUserId: 'u-cold',
    })

    render(<LeaderboardPage />)

    expect(await screen.findAllByText('On Fire').then((els) => els.length)).toBeGreaterThan(0)
    /* the hot row shows its 7-day XP and streak...
     * ...and the learner's own row, with no momentum, shows neither */
    expect(document.body.textContent).toContain('+410')
    expect(document.body.textContent).toContain('3d')
    expect(document.body.textContent).not.toContain('+0')
  })

  it('re-fetches standings on the poll interval', async () => {
    vi.useFakeTimers({ toFake: ['setInterval'] })
    try {
      fakeSupabase.db.tables['leaderboard'] = [
        leaderboardRow('u-first', 'First Leader', 1000, { missions_completed: 5, accuracy: 80 }),
      ]

      render(<LeaderboardPage />)
      expect(await screen.findAllByText('First Leader').then((els) => els.length)).toBeGreaterThan(0)

      /* someone overtakes between polls */
      fakeSupabase.db.tables['leaderboard'] = [
        leaderboardRow('u-new', 'New Challenger', 1200, { missions_completed: 6, accuracy: 85 }),
        leaderboardRow('u-first', 'First Leader', 1000, { missions_completed: 5, accuracy: 80 }),
      ]

      await act(async () => {
        vi.advanceTimersByTime(30_000)
        /* let the fetch (real timers) and the re-render settle */
        await new Promise((r) => setTimeout(r, 0))
      })

      expect(
        await screen.findAllByText('New Challenger').then((els) => els.length),
      ).toBeGreaterThan(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('falls back to the bundled seed peers when the live read fails', async () => {
    /* fetch succeeds on mount with an empty view, then simulate the backend
     * being unreachable: the page must show the bundled seed peers */
    render(<LeaderboardPage />)
    await screen.findByText(/Your current rank/i)
    act(() => {
      useAppStore.setState({ leaderboard: null, leaderboardLoading: false })
    })

    /* the seed leader appears on the podium *and* in the table */
    expect((await screen.findAllByText('Amara Obi')).length).toBeGreaterThan(0)
    expect(screen.getByText(/fellow FinQuest learners in this demo/i)).toBeTruthy()
  })

  it('names the failure in the footnote when the live read fails', async () => {
    fakeSupabase.db.failNext = { message: 'column "xp_last_7d" does not exist' }

    render(<LeaderboardPage />)

    /* the fallback shows the bundled peers *and* says exactly why */
    expect((await screen.findAllByText('Amara Obi')).length).toBeGreaterThan(0)
    expect(
      await screen.findByText(/Live standings unavailable \(column "xp_last_7d" does not exist\)/i),
    ).toBeTruthy()
  })
})
