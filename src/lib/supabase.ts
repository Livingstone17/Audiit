import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

/** True when both env vars are present, so the app can reach Supabase. */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey)
}

/**
 * Browser Supabase client, or `null` when the project is not configured.
 *
 * AuditLab is local-first: when this is `null` every feature still runs off
 * localStorage and the sync layer is simply disabled, so the app, the test
 * suite and offline use never depend on a backend being reachable.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export type { SupabaseClient }
