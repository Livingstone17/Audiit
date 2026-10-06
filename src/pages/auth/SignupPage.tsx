import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Lock, Mail, User as UserIcon } from 'lucide-react'
import { useAppStore } from '../../store/app'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/forms'
import { Alert } from '../../components/ui/overlays'
import { Wordmark } from '../../components/brand'

export function SignupPage() {
  const signup = useAppStore((s) => s.signup)
  const login = useAppStore((s) => s.login)
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setTimeout(() => {
      const res = signup(name, email, password)
      if (!res.ok) {
        setLoading(false)
        setError(res.error ?? 'Could not create the account.')
        return
      }
      login(email, password)
      setLoading(false)
      navigate('/onboarding')
    }, 400)
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
