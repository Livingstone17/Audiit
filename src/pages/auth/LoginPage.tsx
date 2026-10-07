import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, KeyRound, Lock, Mail } from 'lucide-react'
import { useAppStore, DEMO_ACCOUNTS } from '../../store/app'
import { MISSIONS } from '../../data/missions'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/forms'
import { Alert } from '../../components/ui/overlays'
import { Wordmark } from '../../components/brand'

export function LoginPage() {
  const login = useAppStore((s) => s.login)
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setTimeout(() => {
      const res = login(email, password)
      setLoading(false)
      if (!res.ok) {
        setError(res.error ?? 'Login failed.')
        return
      }
      const from = (location.state as { from?: string } | null)?.from
      navigate(from && from !== '/login' ? from : '/', { replace: true })
    }, 350)
  }

  const fillDemo = (i: number) => {
    const a = DEMO_ACCOUNTS[i]!
    setEmail(a.email)
    setPassword(a.password)
    setError('')
  }

  return (
    <div className="min-h-dvh grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-[#0a0e13] p-10 lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(900px 500px at 20% 0%, rgba(16,185,129,0.16), transparent 60%), radial-gradient(700px 500px at 90% 90%, rgba(59,130,246,0.10), transparent 60%)',
          }}
        />
        <Link to="/login" className="relative">
          <Wordmark />
        </Link>
        <div className="relative max-w-md">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-emerald-300">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Manufacturing procurement audit track
          </div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white">
            Don't just learn Excel.
            <br />
            <span className="text-emerald-400">Audit like a professional.</span>
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-400">
            Investigate realistic datasets from a fictional manufacturer, run exception
            tests, document findings and earn XP — a training lab for junior internal
            auditors.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-slate-300">
            {[
              `${MISSIONS.length} practical missions across Excel, procurement audit and investigation`,
              'Realistic downloadable .xlsx datasets with controlled anomalies',
              'Instant feedback, progressive hints and audit finding templates',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 text-[11px]">
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-slate-500">
          Fictional training environment · Apex Manufacturing Group datasets are simulated
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="mb-8 lg:hidden">
            <Wordmark />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">Welcome back</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your next case file is waiting.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {error && <Alert variant="danger">{error}</Alert>}
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={15} />}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={15} />}
            />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Sign in <ArrowRight size={16} />
            </Button>
          </form>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            Forgot password? This local demo stores accounts in your browser — reset
            progress from Profile or create a fresh account.
          </p>

          <div className="mt-6 rounded-xl border border-border bg-card p-4">
            <div className="mb-2.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <KeyRound size={13} /> Demo accounts
            </div>
            <div className="grid gap-2">
              {DEMO_ACCOUNTS.map((a, i) => (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => fillDemo(i)}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-left text-xs transition-colors hover:border-primary/50"
                >
                  <span>
                    <span className="font-medium">{a.user.name}</span>
                    <span className="block text-muted-foreground">{a.email}</span>
                  </span>
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                    {a.password}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to AuditLab?{' '}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
