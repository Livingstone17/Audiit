import { describe, expect, it } from 'vitest'
import { isAnswered, resolveAnswer, validateAnswer } from '../lib/validation'
import type { Question } from '../lib/types'
import { rows, unpaidAbove } from '../datasets/registry'
import { MISSIONS } from '../data/missions'

const base = {
  id: 'q',
  prompt: 'Test prompt for the question',
  explanation: 'explanation text long enough to satisfy the checker',
  incorrectFeedback: 'feedback text long enough to satisfy the checker',
}

describe('answer validation', () => {
  it('validates formulas with whitespace/case normalization', () => {
    const q: Question = {
      ...base,
      type: 'formula',
      accepted: ['=countif($A:$A,A2)', '=countif(A:A,A2)'],
    }
    expect(validateAnswer(q, { text: '  =COUNTIF( $A:$A , A2 )  ' }).correct).toBe(true)
    expect(validateAnswer(q, { text: '=countif(a:a,a2)' }).correct).toBe(true)
    expect(validateAnswer(q, { text: '=COUNTIF($B:$B,B2)' }).correct).toBe(false)
    expect(validateAnswer(q, { text: '' }).malformed).toBeTruthy()
  })

  it('validates numeric answers ignoring separators and currency', () => {
    const q: Question = { ...base, type: 'numeric', answer: 1250000 }
    expect(validateAnswer(q, { number: '1,250,000' }).correct).toBe(true)
    expect(validateAnswer(q, { number: '₦1250000' }).correct).toBe(true)
    expect(validateAnswer(q, { number: '1250001' }).correct).toBe(false)
    expect(validateAnswer(q, { number: 'abc' }).malformed).toBeTruthy()
  })

  it('resolves numeric answers computed from datasets', () => {
    const q: Question = { ...base, type: 'numeric', answer: () => 42 }
    expect(resolveAnswer(q)).toBe(42)
    expect(validateAnswer(q, { number: '42' }).correct).toBe(true)
  })

  it('validates text answers by keywords and minimum length', () => {
    const q: Question = {
      ...base,
      type: 'text',
      keywords: ['purchase order', 'authorised'],
      minWords: 10,
    }
    const good = { text: 'The invoice was paid without an approved purchase order, so it was never authorised by the department.' }
    expect(validateAnswer(q, good).correct).toBe(true)
    expect(validateAnswer(q, { text: 'no purchase order here' }).malformed).toBeTruthy()
    expect(validateAnswer(q, {
      text: 'This sentence has enough words total but never mentions the required keyword concepts.',
    }).correct).toBe(false)
  })

  it('validates exception selections as sets (order-insensitive)', () => {
    const q: Question = {
      ...base,
      type: 'exception-select',
      choices: [
        { id: 'INV-1', label: 'INV-1' },
        { id: 'INV-2', label: 'INV-2' },
        { id: 'INV-3', label: 'INV-3' },
      ],
      correctIds: ['INV-1', 'INV-3'],
    }
    expect(validateAnswer(q, { selectedIds: ['INV-3', 'INV-1'] }).correct).toBe(true)
    expect(validateAnswer(q, { selectedIds: ['INV-1'] }).correct).toBe(false)
    expect(validateAnswer(q, { selectedIds: ['INV-1', 'INV-2', 'INV-3'] }).correct).toBe(false)
    expect(validateAnswer(q, { selectedIds: [] }).malformed).toBeTruthy()
  })

  it('validates multiple choice and conclusions', () => {
    const mcq: Question = {
      ...base,
      type: 'mcq',
      options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
      correctOptionId: 'b',
    }
    expect(validateAnswer(mcq, { optionId: 'b' }).correct).toBe(true)
    expect(validateAnswer(mcq, { optionId: 'a' }).correct).toBe(false)

    const conc: Question = {
      ...base,
      type: 'conclusion',
      correctConclusion: 'Significant finding',
    }
    expect(validateAnswer(conc, { conclusion: 'Significant finding' }).correct).toBe(true)
    expect(validateAnswer(conc, { conclusion: 'No exception' }).correct).toBe(false)
  })

  it('mission 02 q1 matches the Excel filter Payment Status = Unpaid', () => {
    // regression: unpaidAbove once counted "Partial" invoices too (42 instead of 24)
    const m02 = MISSIONS.find((m) => m.id === 'm02')!
    const q1 = m02.questions[0]!
    expect(q1.id).toBe('m02-q1')

    const strict = rows('pr-basic').filter(
      (r) => r.paymentStatus === 'Unpaid' && Number(r.total) > 1_000_000,
    ).length
    expect(unpaidAbove('pr-basic', 1_000_000)).toBe(strict)
    expect(resolveAnswer(q1)).toBe(24)
    expect(validateAnswer(q1, { number: '24' }).correct).toBe(true)
  })

  it('knows what counts as answered', () => {
    const q: Question = { ...base, type: 'numeric', answer: 1 }
    expect(isAnswered(q, { number: '' })).toBe(false)
    expect(isAnswered(q, { number: '1' })).toBe(true)
  })
})
