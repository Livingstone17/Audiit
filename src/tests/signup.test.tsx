/** @vitest-environment happy-dom */
/**
 * Signup page behaviour.
 *
 * When Supabase has "Confirm email" enabled, `signUp` creates the account but
 * returns no session. The page must say so and stay on /signup instead of
 * pretending the learner is signed in (which used to make every sync fail on
 * RLS) or navigating into onboarding.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
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
const { useAppStore, DEMO_ACCOUNTS } = await import('../store/app')
const { SignupPage, RESEND_COOLDOWN_SECONDS } = await import('../pages/auth/SignupPage')

afterEach(() => {
  vi.useRealTimers()
})

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

function renderSignup() {
  render(
    <MemoryRouter initialEntries={['/signup']}>
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/onboarding" element={<div>ONBOARDING</div>} />
        <Route path="/login" element={<div>LOGIN</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function fillForm(email: string) {
  fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Pending User' } })
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pw123456' } })
  fireEvent.click(screen.getByRole('button', { name: /create account/i }))
}

describe('signup with email confirmation', () => {
  it('asks the learner to confirm instead of signing them in', async () => {
    fakeSupabase.requireEmailConfirmation = true
    renderSignup()
    fillForm('pending@example.com')

    expect(await screen.findByText('Account created — check your inbox.')).toBeTruthy()
    expect(screen.getByText('pending@example.com')).toBeTruthy()
    expect(screen.getByRole('button', { name: /go to sign in/i })).toBeTruthy()

    /* no form left to resubmit, no redirect, no half-signed-in state */
    expect(screen.queryByRole('button', { name: /create account/i })).toBeNull()
    expect(screen.queryByText('ONBOARDING')).toBeNull()
    expect(useAppStore.getState().user).toBeNull()
    expect(useAppStore.getState().cloudUserId).toBeNull()

    /* the learner can ask for another confirmation email */
    fireEvent.click(screen.getByRole('button', { name: /resend email/i }))
    expect(await screen.findByText('Confirmation email sent again.')).toBeTruthy()
    expect(fakeSupabase.resentEmails).toEqual(['pending@example.com'])
  })

  it('shows why the confirmation email could not be resent', async () => {
    fakeSupabase.requireEmailConfirmation = true
    fakeSupabase.failResend = { message: 'email rate limit exceeded' }
    renderSignup()
    fillForm('pending@example.com')
    expect(await screen.findByText('Account created — check your inbox.')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /resend email/i }))
    expect(await screen.findByText('email rate limit exceeded')).toBeTruthy()
    expect(useAppStore.getState().user).toBeNull()
  })

  it('locks resend during the cooldown and unlocks it afterwards', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    fakeSupabase.requireEmailConfirmation = true
    renderSignup()
    fillForm('pending@example.com')
    expect(await screen.findByText('Account created — check your inbox.')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /resend email/i }))
    expect(await screen.findByText('Confirmation email sent again.')).toBeTruthy()

    const locked = screen.getByRole('button', { name: /resend in \d+s/i })
    expect((locked as HTMLButtonElement).disabled).toBe(true)
    /* a second click while locked must not send again */
    fireEvent.click(locked)
    expect(fakeSupabase.resentEmails).toEqual(['pending@example.com'])

    await act(async () => {
      vi.advanceTimersByTime(RESEND_COOLDOWN_SECONDS * 1000)
    })

    const unlocked = screen.getByRole('button', { name: /^resend email$/i })
    expect((unlocked as HTMLButtonElement).disabled).toBe(false)
  })

  it('continues into onboarding when Supabase returns a session', async () => {
    renderSignup()
    fillForm('fresh@example.com')

    expect(await screen.findByText('ONBOARDING')).toBeTruthy()
    expect(useAppStore.getState().user?.email).toBe('fresh@example.com')
    expect(useAppStore.getState().cloudUserId).toBeTruthy()
  })
})
