import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  CircleDashed,
  Info,
  Sparkles,
  ThumbsUp,
  Wand2,
  XCircle,
} from 'lucide-react'
import type { Mission, Question } from '../../lib/types'
import type { SubmissionInput } from '../../lib/validation'
import { CONCLUSIONS } from '../../lib/types'
import { useAppStore } from '../../store/app'
import { useToasts } from '../../store/toasts'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Alert } from '../ui/overlays'
import { cn, formatNumber } from '../../lib/utils'
import { isAnswered, resolveChoices } from '../../lib/validation'

/** flat XP cost of revealing a per-question solution */
export const SOLUTION_XP_COST = 40

const NOT_ANSWERED: Record<Question['type'], string> = {
  mcq: 'Choose an option before submitting.',
  conclusion: 'Select a conclusion before submitting.',
  formula: 'Enter your formula before submitting.',
  numeric: 'Enter a number before submitting.',
  text: 'Write your answer before submitting.',
  'exception-select': 'Select at least one exception before submitting.',
}

interface Props {
  mission: Mission
  question: Question
  index: number
}

type Feedback = {
  correct: boolean
  malformed?: string
  expected?: string | number | string[]
}

function formatExpected(q: Question, expected: string | number | string[]): string {
  // MCQ expectations are option ids — show the human-readable label instead
  if (q.type === 'mcq' && typeof expected === 'string') {
    const opt = q.options?.find((o) => o.id === expected)
    if (opt) return opt.label
  }
  if (Array.isArray(expected)) return expected.join(', ')
  if (typeof expected === 'number') return formatNumber(expected)
  return expected
}

export function QuestionBlock({ mission, question, index }: Props) {
  const submitAnswer = useAppStore((s) => s.submitAnswer)
  const revealSolution = useAppStore((s) => s.useHint)
  const submissions = useAppStore((s) => s.submissions)
  const push = useToasts((s) => s.push)

  const alreadyCorrect = submissions.some(
    (s) => s.questionId === question.id && s.correct,
  )

  const [optionId, setOptionId] = useState<string | undefined>()
  const [number, setNumber] = useState('')
  const [text, setText] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [conclusion, setConclusion] = useState<string | undefined>()
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [showSolution, setShowSolution] = useState(false)
  const [solutionExpected, setSolutionExpected] = useState<
    string | number | string[] | undefined
  >()

  const choices = useMemo(
    () => (question.type === 'exception-select' ? resolveChoices(question) : []),
    [question],
  )

  const input: SubmissionInput = {
    optionId,
    number,
    text,
    selectedIds,
    conclusion: conclusion as SubmissionInput['conclusion'],
  }

  const locked = alreadyCorrect

  const onSubmit = () => {
    if (locked) return
    // an empty submission is a nudge, not a wrong answer — don't log an attempt
    if (!isAnswered(question, input)) {
      setFeedback({ correct: false, malformed: NOT_ANSWERED[question.type] })
      return
    }
    const res = submitAnswer(mission, question, input)
    setFeedback({ correct: res.correct, malformed: res.malformed, expected: res.expected })
    if (res.correct) {
      push({
        variant: 'success',
        title: 'Correct',
        description: question.explanation.slice(0, 120),
      })
    }
  }

  const requestSolution = () => {
    // capture the expected value now — editing the input later clears feedback
    setSolutionExpected(feedback?.expected)
    setShowSolution(true)
    revealSolution(mission.id, SOLUTION_XP_COST, `solution-${question.id}`)
  }

  const attempts = submissions.filter((s) => s.questionId === question.id).length
  const typeLabel: Record<Question['type'], string> = {
    mcq: 'Multiple choice',
    formula: 'Excel formula',
    numeric: 'Numeric answer',
    text: 'Written response',
    'exception-select': 'Exception selection',
    conclusion: 'Audit conclusion',
  }

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 sm:p-5 transition-colors',
        locked ? 'border-success/40' : feedback && !feedback.correct ? 'border-danger/40' : 'border-border',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold',
              locked ? 'bg-success-soft text-success' : 'bg-muted text-muted-foreground',
            )}
          >
            {locked ? <CheckCircle2 size={15} /> : index + 1}
          </span>
          <Badge variant="muted">{typeLabel[question.type]}</Badge>
          {attempts > 1 && !locked && (
            <Badge variant="warning">{attempts} attempts</Badge>
          )}
        </div>
        {locked && <Badge variant="success">Solved</Badge>}
      </div>

      <p className="mt-3 text-[15px] font-medium leading-relaxed">{question.prompt}</p>
      {question.context && (
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          {question.context}
        </p>
      )}

      {/* Inputs */}
      <div className="mt-4 space-y-3">
        {question.type === 'mcq' && (
          <div className="grid gap-2">
            {question.options?.map((opt, i) => (
              <button
                key={opt.id}
                disabled={locked}
                onClick={() => {
                  setOptionId(opt.id)
                  setFeedback(null)
                }}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3 text-left text-sm transition-all',
                  optionId === opt.id
                    ? 'border-primary bg-primary-soft'
                    : 'border-border hover:border-primary/40',
                  locked && 'opacity-70',
                )}
              >
                <span
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold',
                    optionId === opt.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground',
                  )}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {question.type === 'conclusion' && (
          <div className="grid gap-2 sm:grid-cols-2">
            {CONCLUSIONS.map((c) => (
              <button
                key={c}
                disabled={locked}
                onClick={() => {
                  setConclusion(c)
                  setFeedback(null)
                }}
                className={cn(
                  'rounded-lg border p-3 text-left text-sm font-medium transition-all',
                  conclusion === c
                    ? 'border-primary bg-primary-soft'
                    : 'border-border hover:border-primary/40',
                )}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {question.type === 'numeric' && (
          <div className="relative max-w-56">
            <input
              type="text"
              inputMode="decimal"
              disabled={locked}
              value={number}
              onChange={(e) => {
                setNumber(e.target.value)
                setFeedback(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
              placeholder="Enter a number"
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 pr-16 font-mono text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
            />
            {question.unit && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {question.unit}
              </span>
            )}
          </div>
        )}

        {question.type === 'formula' && (
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-success">
                fx
              </span>
              Enter an Excel formula, starting with =
            </div>
            <input
              type="text"
              disabled={locked}
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setFeedback(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
              placeholder={question.placeholder ?? '=...'}
              spellCheck={false}
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 font-mono text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
            />
          </div>
        )}

        {question.type === 'text' && (
          <div>
            <textarea
              disabled={locked}
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setFeedback(null)
              }}
              placeholder={question.placeholderText ?? 'Write your answer…'}
              rows={4}
              className="w-full resize-y rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm leading-relaxed focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
            />
            <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
              <span>
                {question.minWords ? `Minimum ${question.minWords} words · ` : ''}
                {question.keywords?.length
                  ? 'Must address the key concepts'
                  : 'Explain your reasoning'}
              </span>
              <span>{text.trim() ? text.trim().split(/\s+/).length : 0} words</span>
            </div>
          </div>
        )}

        {question.type === 'exception-select' && (
          <div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
              {choices.map((c) => {
                const on = selectedIds.includes(c.id)
                return (
                  <button
                    key={c.id}
                    disabled={locked}
                    onClick={() => {
                      setSelectedIds((s) =>
                        s.includes(c.id) ? s.filter((x) => x !== c.id) : [...s, c.id],
                      )
                      setFeedback(null)
                    }}
                    className={cn(
                      'truncate rounded-md border px-2.5 py-2 text-left font-mono text-[11.5px] transition-all',
                      on
                        ? 'border-primary bg-primary-soft font-semibold'
                        : 'border-border hover:border-primary/40',
                    )}
                    title={c.label}
                  >
                    {on ? '✓ ' : ''}
                    {c.label}
                  </button>
                )
              })}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Select every exception — partial selections are marked incorrect.</span>
              <span>{selectedIds.length} selected</span>
            </div>
          </div>
        )}
      </div>

      {/* Feedback */}
      {feedback && !feedback.correct && feedback.malformed && (
        <div className="mt-3">
          <Alert variant="warning">{feedback.malformed}</Alert>
        </div>
      )}

      {feedback && !feedback.correct && !feedback.malformed && (
        <div className="mt-3 space-y-2.5 animate-fade-in">
          <Alert variant="danger">
            <span className="flex gap-2">
              <XCircle size={15} className="mt-0.5 shrink-0" />
              <span>
                <span className="font-semibold">Not quite. </span>
                {question.incorrectFeedback}
              </span>
            </span>
          </Alert>
          {!showSolution && (
            <button
              onClick={requestSolution}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-xp hover:underline"
            >
              <Wand2 size={13} /> Still stuck? Show the solution (−40 XP)
            </button>
          )}
        </div>
      )}

      {feedback?.correct && (
        <div className="mt-3 animate-fade-in">
          <Alert variant="success">
            <span className="flex gap-2">
              <ThumbsUp size={15} className="mt-0.5 shrink-0" />
              <span>
                <span className="font-semibold">Correct. </span>
                {question.explanation}
              </span>
            </span>
          </Alert>
        </div>
      )}

      {showSolution && !locked && (
        <div className="mt-3 rounded-lg border border-info/35 bg-info-soft p-3.5 text-[13px] leading-relaxed animate-fade-in">
          <div className="mb-1 flex items-center gap-1.5 font-semibold text-info">
            <Sparkles size={14} /> Solution explanation
          </div>
          <div className="rounded-md border border-border bg-background px-3 py-2 font-mono text-xs break-all">
            {solutionExpected !== undefined ? formatExpected(question, solutionExpected) : ''}
          </div>
          <p className="mt-2 text-muted-foreground">{question.explanation}</p>
        </div>
      )}

      {/* Actions */}
      {!locked && (
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={onSubmit} disabled={feedback?.correct}>
            Submit answer
          </Button>
          {!showSolution && feedback && !feedback.correct && (
            <span className="text-xs text-muted-foreground">
              Fix it and resubmit — every question must be correct to complete the mission.
            </span>
          )}
        </div>
      )}

      {locked && (
        <div className="mt-4 flex items-center gap-1.5 text-[13px] font-medium text-success">
          <CircleDashed size={14} /> Answered correctly
          {attempts === 1 && (
            <Badge variant="xp" className="ml-1.5">
              <Sparkles size={10} /> First try +10 XP
            </Badge>
          )}
        </div>
      )}

      {locked && !feedback && (
        <div className="mt-3">
          <Alert variant="info">
            <span className="flex gap-2">
              <Info size={15} className="mt-0.5 shrink-0" />
              <span>{question.explanation}</span>
            </span>
          </Alert>
        </div>
      )}
    </div>
  )
}
