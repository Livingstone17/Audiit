/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL — absent in local-only mode. */
  readonly VITE_SUPABASE_URL?: string
  /** Supabase anon (public) key — absent in local-only mode. */
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
