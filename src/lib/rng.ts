/** Mulberry32 — small, fast, deterministic PRNG for dataset generation. */
export function createRng(seed: number) {
  let a = seed >>> 0
  const next = () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1))
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)]!
  const chance = (p: number) => next() < p
  const float = (min: number, max: number, decimals = 2) =>
    Number((min + next() * (max - min)).toFixed(decimals))
  /** Deterministic shuffle (Fisher-Yates). */
  const shuffle = <T>(arr: T[]): T[] => {
    const out = [...arr]
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1))
      ;[out[i], out[j]] = [out[j]!, out[i]!]
    }
    return out
  }
  return { next, int, pick, chance, float, shuffle }
}

export type Rng = ReturnType<typeof createRng>

export function randomId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
