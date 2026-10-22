import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Lock, Mail, User as UserIcon } from 'lucide-react'
import { useAppStore } from '../../store/app'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/forms'
import { Alert } from '../../components/ui/overlays'
import { Wordmark } from '../../components/brand'

/** Seconds the resend action stays locked after a successful send. */
export const RESEND_COOLDOWN_SECONDS = 60

export function SignupPage() {
  const signup = useAppStore((s) => s.signup)
  const login = useAppStore((s) => s.login)
  const resendConfirmation = useAppStore((s) => s.resendConfirmation)
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmationEmail, setConfirmationEmail] = useState('')
  const [resending, setResending] = useState(false)
  const [resendNotice, setResendNotice] = useState('')
  const [resendError, setResendError] = useState('')
  const [cooldown, setCooldown] = useState(0)

  /* Tick the resend cooldown down to zero, one second at a time. The effect
   * depends on `cooling` rather than the value so a single interval does the
   * whole countdown instead of re-scheduling every second. */
  const cooling = cooldown > 0
  useEffect(() => {
    if (!cooling) return
    const timer = setInterval(() => setCooldown((seconds) => (seconds <= 1 ? 0 : seconds - 1)), 1000)
    return () => clearInterval(timer)
  }, [cooling])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signup(name, email, password)
    if (!res.ok) {
      setLoading(false)
      setError(res.error ?? 'Could not create the account.')
      return
    }
    if (res.needsConfirmation) {
      /* Supabase created the account but requires a confirmed email before it
       * will issue a session — the learner signs in after clicking the link. */
      setLoading(false)
      setConfirmationEmail(email.trim().toLowerCase())
      return
    }
    await login(email, password)
    setLoading(false)
    navigate('/onboarding')
  }

  const resend = async () => {
    setResending(true)
    setResendNotice('')
    setResendError('')
    const res = await resendConfirmation(confirmationEmail)
    setResending(false)
    if (res.ok) {
      setResendNotice('Confirmation email sent again.')
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } else {
      setResendError(res.error ?? 'Could not resend the email.')
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm animate-fade-in">
        <Link to="/login" className="mb-8 inline-block">
          <Wordmark />
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Join the audit team</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your account — it takes about 10 seconds.
        </p>

        {confirmationEmail ? (
          <div className="mt-6 space-y-4">
            <Alert variant="success">Account created — check your inbox.</Alert>
            <p className="text-sm text-muted-foreground">
              We sent a confirmation link to{' '}
              <span className="font-medium text-foreground">{confirmationEmail}</span>. Open it to
              confirm your email, then sign in. Progress starts syncing to the cloud after that.
            </p>
            {resendError && <Alert variant="danger">{resendError}</Alert>}
            {resendNotice && (
              <p role="status" className="text-xs text-success">
                {resendNotice}
              </p>
            )}
            <div className="space-y-2">
              <Button className="w-full" size="lg" onClick={() => navigate('/login')}>
                Go to sign in <ArrowRight size={16} />
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                loading={resending}
                disabled={cooldown > 0}
                onClick={() => void resend()}
              >
                <Mail size={15} />
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            {error && <Alert variant="danger">{error}</Alert>}
            <Input
              label="Full name"
              placeholder="Zoe Adeniyi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<UserIcon size={15} />}
            />
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
              autoComplete="new-password"
              placeholder="At least 6 characters"
              hint="Stored locally in this demo — no data leaves your browser."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={15} />}
            />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Create account <ArrowRight size={16} />
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already registered?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
