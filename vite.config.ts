import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // Tests must not depend on the developer's local `.env`: a real Supabase
    // project would send auth calls to the network. Suites that need the
    // backend mock `src/lib/supabase` (or stub these vars) themselves.
    env: {
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: '',
    },
  },
})
