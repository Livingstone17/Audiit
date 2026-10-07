import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { useAppStore } from '../../store/app'
import { Button } from '../../components/ui/button'
import { cn } from '../../lib/utils'
import { Wordmark, Avatar } from '../../components/brand'
import { useToasts } from '../../store/toasts'

const PERSONAS = [
  { id: 'student', label: 'Student', hint: 'Accounting, finance or auditing' },
  { id: 'audit-trainee', label: 'Audit trainee', hint: 'Starting in internal/external audit' },
  { id: 'internal-auditor', label: 'Internal auditor', hint: 'Practising in-house' },
  { id: 'external-auditor', label: 'External auditor', hint: 'Audit firm practitioner' },
  { id: 'accountant', label: 'Accountant', hint: 'Financial reporting or AP/AR' },
  { id: 'finance-professional', label: 'Finance professional', hint: 'FP&A, treasury, controllership' },
  { id: 'other', label: 'Other', hint: 'Something else entirely' },
]

const EXCEL_LEVELS = [
  { id: 'Beginner' as const, label: 'Beginner', hint: 'I know SUM and basic filters' },
  { id: 'Intermediate' as const, label: 'Intermediate', hint: 'PivotTables, lookups, IF statements' },
  { id: 'Advanced' as const, label: 'Advanced', hint: 'I build complex models and tests' },
]

const RECOMMENDATIONS: Record<string, string> = {
  Beginner: 'We will start you at Mission 01 — Excel Foundations for Auditors, where you build every skill from scratch.',
  Intermediate: 'You can move quickly through the foundations — but the procurement audit tests from Mission 15 are where you will learn the most.',
  Advanced: 'Expect the foundations to be review. The investigation missions (30–34) and the final Procurement Audit case are built for you.',
}

export function OnboardingPage() {
  const user = useAppStore((s) => s.user)
  const complete = useAppStore((s) => s.completeOnboarding)
  const navigate = useNavigate()
  const push = useToasts((s) => s.push)
  const [step, setStep] = useState(0)
  const [persona, setPersona] = useState('')
  const [excel, setExcel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner')

  const finish = () => {
    const personaLabel = PERSONAS.find((p) => p.id === persona)?.label ?? 'Other'
    complete(personaLabel, excel)
    push({
      variant: 'success',
      title: 'Welcome to the team',
      description: 'Your first case file is ready on the dashboard.',
    })
    navigate('/')
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-xl animate-slide-up">
        <div className="mb-8 flex items-center justify-between">
          <Wordmark />
          <span className="text-xs text-muted-foreground">Step {step + 1} of 2</span>
        </div>

        <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: step === 0 ? '50%' : '100%' }}
          />
        </div>

        {step === 0 ? (
          <>
            <h1 className="text-xl font-semibold tracking-tight">
              What best describes you?
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              This personalises your starting recommendation — it never restricts what you
              can access.
            </p>
            <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPersona(p.id)}
                  className={cn(
                    'rounded-xl border p-4 text-left transition-all',
                    persona === p.id
                      ? 'border-primary bg-primary-soft shadow-[0_0_0_1px_var(--primary)]'
                      : 'border-border bg-card hover:border-primary/40',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{p.label}</span>
                    {persona === p.id && (
                      <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check size={12} />
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{p.hint}</div>
                </button>
              ))}
            </div>
            <div className="mt-7 flex justify-end">
              <Button size="lg" disabled={!persona} onClick={() => setStep(1)}>
                Continue <ArrowRight size={16} />
              </Button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold tracking-tight">
              How would you rate your Excel experience?
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Honest answers get you the right level of challenge.
            </p>
            <div className="mt-6 grid gap-2.5">
              {EXCEL_LEVELS.map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => setExcel(lvl.id)}
                  className={cn(
                    'flex items-center justify-between rounded-xl border p-4 text-left transition-all',
                    excel === lvl.id
                      ? 'border-primary bg-primary-soft shadow-[0_0_0_1px_var(--primary)]'
                      : 'border-border bg-card hover:border-primary/40',
                  )}
                >
                  <div>
                    <div className="text-sm font-medium">{lvl.label}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{lvl.hint}</div>
                  </div>
                  {excel === lvl.id && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check size={12} />
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <Avatar name={user?.name ?? 'You'} hue={user?.avatarHue} size={38} />
                <div>
                  <div className="text-sm font-medium">
                    Recommendation for {user?.name?.split(' ')[0]}
                  </div>
                  <div className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                    {RECOMMENDATIONS[excel]}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-7 flex justify-between">
              <Button variant="ghost" size="lg" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button size="lg" onClick={finish}>
                Enter AuditLab <ArrowRight size={16} />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
