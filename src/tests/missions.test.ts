import { describe, expect, it } from 'vitest'
import { MISSIONS, isMissionUnlocked, moduleGroups, recommendedMission } from '../data/missions'
import { LEARN_LINKS } from '../data/learnLinks'
import { CONCLUSIONS } from '../lib/types'
import { resolveAnswer, resolveChoices } from '../lib/validation'

describe('mission catalogue', () => {
  it('ships 24 missions numbered 1..24', () => {
    expect(MISSIONS).toHaveLength(24)
    expect(MISSIONS.map((m) => m.number)).toEqual(
      Array.from({ length: 24 }, (_, i) => i + 1),
    )
    expect(new Set(MISSIONS.map((m) => m.id)).size).toBe(24)
  })

  it('splits 10 / 8 / 5 / 1 across the four levels', () => {
    const byLevel = (id: string) => MISSIONS.filter((m) => m.levelId === id).length
    expect(byLevel('L1')).toBe(10)
    expect(byLevel('L2')).toBe(8)
    expect(byLevel('L3')).toBe(5)
    expect(byLevel('L4')).toBe(1)
  })

  it('every mission has a complete teaching brief', () => {
    for (const m of MISSIONS) {
      expect(m.title.length, m.id).toBeGreaterThan(3)
      expect(m.summary.length, m.id).toBeGreaterThan(10)
      expect(m.scenario.length, m.id).toBeGreaterThanOrEqual(2)
      expect(m.objective.length, m.id).toBeGreaterThan(20)
      expect(m.tasks.length, m.id).toBeGreaterThanOrEqual(3)
      expect(m.completion.length, m.id).toBeGreaterThanOrEqual(1)
      expect(m.xp, m.id).toBeGreaterThanOrEqual(100)
      expect(m.estMinutes, m.id).toBeGreaterThanOrEqual(5)
      expect(m.questions.length, m.id).toBeGreaterThanOrEqual(3)
      expect(m.hints.length, m.id).toBeGreaterThanOrEqual(2)
    }
  })

  it('every question has feedback, explanation and a resolvable answer', () => {
    for (const m of MISSIONS) {
      for (const q of m.questions) {
        expect(q.explanation.length, `${m.id}/${q.id}`).toBeGreaterThan(20)
        expect(q.incorrectFeedback.length, `${m.id}/${q.id}`).toBeGreaterThan(20)

        if (q.type === 'mcq') {
          expect(q.options?.some((o) => o.id === q.correctOptionId), `${m.id}/${q.id}`).toBe(true)
        } else if (q.type === 'conclusion') {
          expect(CONCLUSIONS, `${m.id}/${q.id}`).toContain(q.correctConclusion)
        } else if (q.type === 'formula') {
          expect((q.accepted ?? []).length, `${m.id}/${q.id}`).toBeGreaterThan(0)
        } else if (q.type === 'text') {
          // text answers are graded on keywords + length, not a stored value
          expect((q.keywords ?? []).length, `${m.id}/${q.id}`).toBeGreaterThan(0)
          expect(q.minWords ?? 0, `${m.id}/${q.id}`).toBeGreaterThan(0)
        } else {
          const answer = resolveAnswer(q)
          if (typeof answer === 'number') {
            expect(Number.isFinite(answer), `${m.id}/${q.id}`).toBe(true)
          } else {
            expect(String(answer).length, `${m.id}/${q.id}`).toBeGreaterThan(0)
          }
        }

        if (q.type === 'exception-select') {
          const correct = resolveAnswer(q)
          const choices = resolveChoices(q)
          const correctIds = Array.isArray(correct) ? correct : [String(correct)]
          expect(correctIds.length, `${m.id}/${q.id}`).toBeGreaterThan(0)
          const choiceIds = new Set(choices.map((c) => c.id))
          for (const id of correctIds) {
            expect(choiceIds.has(id), `${m.id}/${q.id} missing choice ${id}`).toBe(true)
          }
          expect(choices.length, `${m.id}/${q.id}`).toBeGreaterThan(correctIds.length)
        }
      }
    }
  })

  it('every hint links to a curated learn-the-concept resource', () => {
    let total = 0
    for (const m of MISSIONS) {
      for (const h of m.hints) {
        const where = `${m.id}/${h.id}`
        total += 1
        expect(h.concept, where).toBeTruthy()
        const link = h.concept ? LEARN_LINKS[h.concept] : undefined
        expect(link, `${where} has unknown concept '${h.concept}'`).toBeDefined()
        expect(link!.url, where).toMatch(/^https:\/\//)
        expect(link!.url, where).not.toMatch(/\s/)
        if (link!.kind === 'video') {
          expect(link!.url, where).toMatch(/youtube\.com\/watch\?v=[\w-]+/)
        }
      }
    }
    expect(total).toBe(57)
  })

  it('unlocks strictly in sequence', () => {
    expect(isMissionUnlocked('m01', new Set())).toBe(true)
    expect(isMissionUnlocked('m02', new Set())).toBe(false)
    expect(isMissionUnlocked('m02', new Set(['m01']))).toBe(true)
    expect(isMissionUnlocked('m24', new Set(['m01']))).toBe(false)
    expect(isMissionUnlocked('m24', new Set(MISSIONS.slice(0, 23).map((m) => m.id)))).toBe(true)
  })

  it('recommends the first incomplete unlocked mission', () => {
    expect(recommendedMission(new Set()).id).toBe('m01')
    expect(recommendedMission(new Set(['m01', 'm02'])).id).toBe('m03')
  })

  it('groups missions into curriculum modules', () => {
    const groups = moduleGroups('L1')
    const total = groups.reduce((n, g) => n + g.missions.length, 0)
    expect(total).toBe(10)
    expect(groups.length).toBeGreaterThanOrEqual(3)
  })
})
