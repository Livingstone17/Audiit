/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

/* happy-dom lacks ResizeObserver (used by recharts) */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??=
  ResizeObserverStub

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

/* Seed a logged-in learner with some progress BEFORE the app module loads. */
const record = (completedAt: string, status: 'completed' | 'in-progress') => ({
  status,
  startedAt: '2025-09-24T09:00:00.000Z',
  ...(status === 'completed' ? { completedAt } : {}),
  attempts: 1,
  firstTryCorrect: true,
  hintsUsed: 0,
  hintXp: 0,
  questionsCorrect: 3,
  questionsTotal: 3,
})

localStorage.setItem(
  'auditlab-store-v1',
  JSON.stringify({
    version: 0,
    state: {
      accounts: [
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
          },
        },
      ],
      user: {
        id: 'u-zoe',
        name: 'Zoe Adeniyi',
        email: 'zoe@auditlab.app',
        role: 'learner',
        persona: 'Audit trainee',
        excelLevel: 'Intermediate',
        avatarHue: 152,
        createdAt: '2025-09-20T09:00:00.000Z',
      },
      onboarded: true,
      xp: 650,
      records: {
        m01: record('2025-09-24T10:00:00.000Z', 'completed'),
        m02: record('2025-09-24T11:00:00.000Z', 'completed'),
        m03: record('2025-09-24T12:00:00.000Z', 'completed'),
        m04: record('2025-09-25T09:00:00.000Z', 'completed'),
        m05: record('2025-09-25T10:00:00.000Z', 'in-progress'),
      },
      submissions: [
        {
          id: 's1',
          missionId: 'm01',
          questionId: 'm01-q1',
          answer: '320',
          correct: true,
          attempts: 1,
          at: '2025-09-25T10:00:00.000Z',
        },
      ],
      achievements: ['first-finding'],
      events: [
        {
          id: 'e1',
          type: 'xp_earned',
          value: 100,
          at: '2025-09-24T10:00:00.000Z',
        },
      ],
      findings: [],
      theme: 'dark',
      adminMissions: [],
      deletedMissionIds: [],
    },
  }),
)

const { default: App } = await import('../App')

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

afterEach(cleanup)

describe('app smoke tests', () => {
  it('renders the dashboard for a signed-in learner', async () => {
    renderAt('/')
    expect(await screen.findByText('Welcome back, Zoe')).toBeTruthy()
    expect(screen.getByText('Your next mission is waiting.')).toBeTruthy()
    // next mission is 05 given m01–m04 are complete
    expect(screen.getByText('MISSION 05')).toBeTruthy()
    expect(screen.getByText('COUNTIF and COUNTIFS')).toBeTruthy()
    expect(screen.getByText('Level 2: Audit Analyst')).toBeTruthy()
  })

  it('renders the mission catalogue', async () => {
    renderAt('/missions')
    expect(await screen.findByRole('heading', { name: 'Missions' })).toBeTruthy()
    expect(await screen.findByText('Duplicate Invoice Detection')).toBeTruthy()
    expect(screen.getByText('THE PROCUREMENT AUDIT')).toBeTruthy()
  })

  it('opens the mission workspace with scenario and questions', async () => {
    renderAt('/missions/m05')
    expect(await screen.findByText('MISSION 05')).toBeTruthy()
    expect(screen.getByText('Scenario')).toBeTruthy()
    expect(
      screen.getByText(/Your audit manager wants you to perform an initial duplicate invoice test/),
    ).toBeTruthy()
    expect(screen.getByText('Datasets & documents')).toBeTruthy()
    expect(screen.getByText('purchase_register.xlsx')).toBeTruthy()
    expect(screen.getByText(/Write the formula that counts how many times/)).toBeTruthy()
  })

  it('blocks locked missions with a clear explanation', async () => {
    renderAt('/missions/m11')
    expect(await screen.findByText(/Mission 15 is locked/)).toBeTruthy()
    expect(screen.getByText(/Complete "The Classic Lookup: INDEX \+ MATCH"/)).toBeTruthy()
  })

  it('renders the leaderboard with seeded peers', async () => {
    renderAt('/leaderboard')
    expect(await screen.findByRole('heading', { name: 'Leaderboard' })).toBeTruthy()
    expect(screen.getAllByText('Amara Obi').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Zoe Adeniyi/).length).toBeGreaterThan(0)
  })

  it('renders login with demo accounts', async () => {
    renderAt('/login')
    expect(await screen.findByText('Welcome back')).toBeTruthy()
    expect(screen.getByText('zoe@auditlab.app')).toBeTruthy()
    expect(screen.getByText('admin@auditlab.app')).toBeTruthy()
  })
})
