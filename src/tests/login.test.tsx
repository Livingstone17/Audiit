/** @vitest-environment happy-dom */
/**
 * Post-login routing.
 *
 * Only a first-time account should land on onboarding. A learner who already
 * did work (mission records, even without a stored persona) belongs on the
 * dashboard, which then points at their next mission.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

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
const { default: App } = await import('../App')

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

function renderLogin(state?: { from?: string }) {
  return render(
    <MemoryRouter initialEntries={[state ? { pathname: '/login', state } : '/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>DASHBOARD</div>} />
        <Route path="/progress" element={<div>PROGRESS</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <App />
    </MemoryRouter>,
  )
}

function signIn(email: string, password: string) {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } })
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
}

function cloudProfile(id: string, name: string, persona: string | null) {
  return {
    id,
    name,
    role: 'learner',
    persona,
    excel_level: persona ? 'Intermediate' : null,
    avatar_hue: 152,
    created_at: '2026-01-01T00:00:00.000Z',
  }
}

function cloudRecord(userId: string, missionId: string, status: 'in-progress' | 'completed') {
  return {
    user_id: userId,
    mission_id: missionId,
    status,
    started_at: '2026-09-01T09:00:00.000Z',
    completed_at: status === 'completed' ? '2026-09-01T10:00:00.000Z' : null,
    attempts: 1,
    first_try_correct: true,
    hints_used: 0,
    hint_xp: 0,
    revealed_hints: [],
    questions_correct: 3,
    questions_total: 3,
  }
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

describe('post-login routing', () => {
  it('sends a returning learner to the dashboard', async () => {
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

    expect(await screen.findByText('DASHBOARD')).toBeTruthy()
  })

  it('keeps an explicit deep-link target after signing in', async () => {
    fakeSupabase.addUser('fresh@example.com', 'pw123456')

    renderLogin({ from: '/progress' })
    signIn('fresh@example.com', 'pw123456')

    expect(await screen.findByText('PROGRESS')).toBeTruthy()
  })

  it('pulls cloud progress on a device with no local copy', async () => {
    const cloudUser = fakeSupabase.addUser('cloud@example.com', 'pw123456')
    fakeSupabase.db.tables['profiles'] = [cloudProfile(cloudUser.id, 'Cloud Learner', 'Audit trainee')]
    fakeSupabase.db.tables['mission_records'] = [
      cloudRecord(cloudUser.id, 'm01', 'completed'),
      cloudRecord(cloudUser.id, 'm02', 'in-progress'),
    ]

    renderLogin()
    signIn('cloud@example.com', 'pw123456')

    expect(await screen.findByText('DASHBOARD')).toBeTruthy()
    /* login awaits the pull, so the slice is complete before routing */
    const records = useAppStore.getState().progressByUserId[cloudUser.id]?.records ?? {}
    expect(Object.keys(records).sort()).toEqual(['m01', 'm02'])
  })

  it('treats existing mission records as finished onboarding', async () => {
    const cloudUser = fakeSupabase.addUser('returning@example.com', 'pw123456')
    /* older account: the profile row has no persona, but work was done */
    fakeSupabase.db.tables['profiles'] = [cloudProfile(cloudUser.id, 'Returning Learner', null)]
    fakeSupabase.db.tables['mission_records'] = [cloudRecord(cloudUser.id, 'm01', 'completed')]

    renderLogin()
    signIn('returning@example.com', 'pw123456')

    expect(await screen.findByText('DASHBOARD')).toBeTruthy()
    expect(useAppStore.getState().onboarded).toBe(true)
  })

  it('leaves a brand-new account not yet onboarded', async () => {
    fakeSupabase.addUser('new@example.com', 'pw123456')

    renderLogin()
    signIn('new@example.com', 'pw123456')

    expect(await screen.findByText('DASHBOARD')).toBeTruthy()
    expect(useAppStore.getState().onboarded).toBe(false)
  })
})

describe('onboarding gate through the real app', () => {
  it('shows onboarding to a first-time account', async () => {
    fakeSupabase.addUser('first@example.com', 'pw123456')

    renderApp()
    signIn('first@example.com', 'pw123456')

    expect(await screen.findByText('What best describes you?')).toBeTruthy()
  })

  it('never shows it to a returning learner with completed work', async () => {
    const cloudUser = fakeSupabase.addUser('returning2@example.com', 'pw123456')
    fakeSupabase.db.tables['profiles'] = [cloudProfile(cloudUser.id, 'Returning Learner', null)]
    fakeSupabase.db.tables['mission_records'] = [cloudRecord(cloudUser.id, 'm01', 'completed')]

    renderApp()
    fireEvent.change(await screen.findByLabelText('Email'), {
      target: { value: 'returning2@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pw123456' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Your next mission is waiting.')).toBeTruthy()
    expect(screen.queryByText(/What best describes you/i)).toBeNull()
  })
})
