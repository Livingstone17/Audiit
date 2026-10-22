/**
 * The env contract for the Supabase backend.
 *
 * A typo in these variable names would silently leave the app in local-only
 * mode even after `.env` is filled in, so the names and the "no client without
 * credentials" rule are asserted here.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

async function loadModule() {
  vi.resetModules()
  return import('../lib/supabase')
}

describe('supabase env configuration', () => {
  it('reports unconfigured and builds no client without credentials', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
    const mod = await loadModule()
    expect(mod.isSupabaseConfigured()).toBe(false)
    expect(mod.supabase).toBeNull()
  })

  it('needs both values — a URL alone is not enough', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://project-ref.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
    const mod = await loadModule()
    expect(mod.isSupabaseConfigured()).toBe(false)
    expect(mod.supabase).toBeNull()
  })

  it('builds a client from VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://project-ref.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-public-key')
    const mod = await loadModule()
    expect(mod.isSupabaseConfigured()).toBe(true)
    expect(mod.supabase).not.toBeNull()
    /* browser sessions must persist so a reload keeps the learner signed in */
    expect(typeof mod.supabase!.auth.getSession).toBe('function')
    expect(typeof mod.supabase!.auth.signInWithPassword).toBe('function')
  })
})
