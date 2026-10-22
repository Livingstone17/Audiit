/** @vitest-environment happy-dom */
/**
 * Post-login routing.
 *
 * A learner who already worked through some missions must land back on the one
 * they left mid-flight, not on mission 01 or a "start again" prompt. A fresh
 * account still needs the dashboard.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'

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

const { fakeSupabase } = await import('./helpers/fakeSupabase')
const { useAppStore, DEMO_ACCOUNTS, EMPTY_PROGRESS } = await import('../store/app')
const { LoginPage } = await import('../pages/auth/LoginPage')
const { resumeMission } = await import('../data/missions/pure')
const { MISSIONS } = await import('../data/missions/catalog')

function record(status: 'in-progress' | 'completed', startedAt: string) {
  return {
    status,
    startedAt,
    ...(status === 'completed' ? { completedAt: startedAt } : {}),
    attempts: 1,
    firstTryCorrect: true,
    hintsUsed: 0,
    hintXp: 0,
    questionsCorrect: 1,
    questionsTotal: 3,
  }
}

function MissionStub() {
  const { id } = useParams<{ id: string }>()
  return <div>WORKSPACE {id}</div>
}

function renderLogin(state?: { from?: string }) {
  return render(
    <MemoryRouter initialEntries={[state ? { pathname: '/login', state } : '/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/missions/:id" element={<MissionStub />} />
        <Route path="/" element={<div>DASHBOARD</div>} />
        <Route path="/progress" element={<div>PROGRESS</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function signIn(email: string, password: string) {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } })
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
}

beforeEach(() => {
  cleanup()
  mem.clear()
  fakeSupabase.reset()
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
})

afterEach(cleanup)

describe('resume after login', () => {
  it('lands on the mission left in progress, not mission 01', async () => {
    useAppStore.setState({
      progressByUserId: {
        'u-zoe': {
          ...EMPTY_PROGRESS,
          xp: 420,
          records: {
            m01: record('completed', '2026-09-01T09:00:00.000Z'),
            m02: record('in-progress', '2026-09-02T09:00:00.000Z'),
          },
        },
      },
    })

    renderLogin()
    signIn('zoe@auditlab.app', 'demo1234')

    expect(await screen.findByText('WORKSPACE m02')).toBeTruthy()
    expect(screen.queryByText('DASHBOARD')).toBeNull()
  })

  it('sends a fresh account to the dashboard', async () => {
    fakeSupabase.addUser('fresh@example.com', 'pw123456')

    renderLogin()
    signIn('fresh@example.com', 'pw123456')

    expect(await screen.findByText('DASHBOARD')).toBeTruthy()
  })

  it('keeps an explicit deep-link target after signing in', async () => {
    fakeSupabase.addUser('fresh@example.com', 'pw123456')

    renderLogin({ from: '/progress' })
    signIn('fresh@example.com', 'pw123456')

    expect(await screen.findByText('PROGRESS')).toBeTruthy()
  })

  it('waits for the cloud pull on a device with no local progress', async () => {
    const cloudUser = fakeSupabase.addUser('cloud@example.com', 'pw123456')
    fakeSupabase.db.tables['profiles'] = [
      {
        id: cloudUser.id,
        name: 'Cloud Learner',
        role: 'learner',
        persona: 'Audit trainee',
        excel_level: 'Intermediate',
        avatar_hue: 152,
        created_at: '2026-01-01T00:00:00.000Z',
      },
    ]
    fakeSupabase.db.tables['mission_records'] = [
      {
        user_id: cloudUser.id,
        mission_id: 'm01',
        status: 'completed',
        started_at: '2026-09-01T09:00:00.000Z',
        completed_at: '2026-09-01T10:00:00.000Z',
        attempts: 1,
        first_try_correct: true,
        hints_used: 0,
        hint_xp: 0,
        revealed_hints: [],
        questions_correct: 3,
        questions_total: 3,
      },
      {
        user_id: cloudUser.id,
        mission_id: 'm02',
        status: 'in-progress',
        started_at: '2026-09-02T09:00:00.000Z',
        completed_at: null,
        attempts: 0,
        first_try_correct: true,
        hints_used: 0,
        hint_xp: 0,
        revealed_hints: [],
        questions_correct: 1,
        questions_total: 3,
      },
    ]

    renderLogin()
    signIn('cloud@example.com', 'pw123456')

    /* login awaits the pull, so the resume target is known before routing */
    expect(await screen.findByText('WORKSPACE m02')).toBeTruthy()
  })

  it('has nothing to resume once every mission is closed', () => {
    const records = Object.fromEntries(
      MISSIONS.map((m) => [m.id, record('completed', '2026-09-01T09:00:00.000Z')]),
    )
    expect(resumeMission(MISSIONS, records)).toBeUndefined()
  })
})
