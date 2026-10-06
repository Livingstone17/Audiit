import type { Choice } from '../../lib/types'
import { createRng } from '../../lib/rng'

/**
 * Build exception-selection choices from a computed list of correct IDs
 * plus deterministic distractors drawn from a pool.
 */
export function exceptionChoices(
  correctIds: string[],
  distractorPool: string[],
  distractorCount: number,
  seed: number,
): Choice[] {
  const correct = new Set(correctIds)
  const pool = distractorPool.filter((id) => !correct.has(id))
  const rng = createRng(seed)
  const distractors = rng.shuffle(pool).slice(0, distractorCount)
  const all = rng.shuffle([...correctIds, ...distractors])
  return all.map((id) => ({ id, label: id }))
}

/** Simple static choices helper (deterministic order). */
export function choice(id: string, label: string, hint?: string): Choice {
  return hint ? { id, label, hint } : { id, label }
}
