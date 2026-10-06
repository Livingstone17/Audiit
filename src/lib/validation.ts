import type { Choice, Conclusion, Question } from './types'
import { normalizeFormula, normalizeText } from './utils'

export interface SubmissionInput {
  /** mcq */
  optionId?: string
  /** formula / text */
  text?: string
  /** numeric */
  number?: string
  /** exception-select */
  selectedIds?: string[]
  /** conclusion */
  conclusion?: Conclusion
}

export function resolveAnswer(q: Question): string | number | string[] {
  if (q.type === 'mcq') return q.correctOptionId ?? ''
  if (q.type === 'conclusion') return q.correctConclusion ?? ''
  const raw = q.type === 'exception-select' ? (q.correctIds ?? q.answer) : q.answer
  if (typeof raw === 'function') return raw()
  if (Array.isArray(raw)) return raw
  return raw ?? ''
}

export function resolveChoices(q: Question): Choice[] {
  if (!q.choices) return []
  return typeof q.choices === 'function' ? q.choices() : q.choices
}

export interface ValidationResult {
  correct: boolean
  /** the expected value, used to build feedback when incorrect */
  expected: string | number | string[]
  /** a small, non-revealing nudge when the input shape was wrong */
  malformed?: string
}

export function validateAnswer(q: Question, input: SubmissionInput): ValidationResult {
  switch (q.type) {
    case 'mcq': {
      const expected = q.correctOptionId ?? ''
      return { correct: input.optionId === expected, expected }
    }
    case 'conclusion': {
      const expected = q.correctConclusion ?? ''
      return { correct: input.conclusion === expected, expected }
    }
    case 'formula': {
      const expectedRaw = resolveAnswer(q)
      const expected = Array.isArray(expectedRaw) ? expectedRaw.join(' | ') : String(expectedRaw)
      const accepted = (q.accepted ?? [expected]).map(normalizeFormula)
      const candidate = normalizeFormula(input.text ?? '')
      if (!candidate) {
        return { correct: false, expected, malformed: 'Enter your formula before submitting.' }
      }
      return { correct: accepted.includes(candidate), expected }
    }
    case 'numeric': {
      const expectedRaw = resolveAnswer(q)
      const expected = Array.isArray(expectedRaw) ? expectedRaw.join(', ') : expectedRaw
      const cleaned = (input.number ?? '').replace(/[,\s₦]/g, '')
      if (cleaned === '') {
        return { correct: false, expected, malformed: 'Enter a number before submitting.' }
      }
      const value = Number(cleaned)
      if (Number.isNaN(value)) {
        return { correct: false, expected, malformed: 'That does not look like a number.' }
      }
      return { correct: value === Number(expected), expected }
    }
    case 'text': {
      const expected = String(resolveAnswer(q))
      const candidate = normalizeText(input.text ?? '')
      const words = candidate.split(' ').filter(Boolean)
      if (words.length < (q.minWords ?? 8)) {
        return {
          correct: false,
          expected,
          malformed: `Write at least ${q.minWords ?? 8} words — your answer needs to explain your reasoning.`,
        }
      }
      const missing = (q.keywords ?? []).filter((k) => !candidate.includes(normalizeText(k)))
      return { correct: missing.length === 0, expected }
    }
    case 'exception-select': {
      const expectedRaw = resolveAnswer(q)
      const expected = Array.isArray(expectedRaw) ? expectedRaw : [String(expectedRaw)]
      const selected = input.selectedIds ?? []
      if (selected.length === 0) {
        return {
          correct: false,
          expected,
          malformed: 'Select at least one exception before submitting.',
        }
      }
      const setA = new Set(selected)
      const setB = new Set(expected)
      const correct =
        setA.size === setB.size && [...setB].every((id) => setA.has(id))
      return { correct, expected }
    }
  }
}

export function isAnswered(q: Question, input: SubmissionInput): boolean {
  switch (q.type) {
    case 'mcq':
      return Boolean(input.optionId)
    case 'conclusion':
      return Boolean(input.conclusion)
    case 'exception-select':
      return (input.selectedIds ?? []).length > 0
    case 'numeric':
      return Boolean((input.number ?? '').trim())
    default:
      return Boolean((input.text ?? '').trim())
  }
}
