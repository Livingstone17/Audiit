import type { Level } from './types'

export const LEVELS: Level[] = [
  {
    id: 'L1',
    order: 1,
    name: 'Audit Trainee',
    tagline: 'You just joined the audit team.',
    description: 'Learn the Excel skills every junior auditor needs on day one.',
    available: true,
  },
  {
    id: 'L2',
    order: 2,
    name: 'Audit Analyst',
    tagline: 'You are running your first tests.',
    description: 'Apply Excel to real procurement audit procedures.',
    available: true,
  },
  {
    id: 'L3',
    order: 3,
    name: 'Internal Auditor',
    tagline: 'You investigate, not just test.',
    description: 'Correlate datasets, select samples and document findings.',
    available: true,
  },
  {
    id: 'L4',
    order: 4,
    name: 'Senior Audit Analyst',
    tagline: 'You own the engagement.',
    description: 'Lead the full procurement audit case end to end.',
    available: true,
  },
  {
    id: 'L5',
    order: 5,
    name: 'Audit Analytics Specialist',
    tagline: 'Data is your audit tool.',
    description: 'Advanced audit analytics. Unlocks after the MVP content pack.',
    available: false,
  },
  {
    id: 'L6',
    order: 6,
    name: 'Audit Investigator',
    tagline: 'Follow the money.',
    description: 'Forensic investigation tracks. Coming soon.',
    available: false,
  },
  {
    id: 'L7',
    order: 7,
    name: 'Audit Manager',
    tagline: 'You lead the audit.',
    description: 'Review, sign off and lead a team. Coming soon.',
    available: false,
  },
]

/** XP required to *reach* a level (cumulative). */
export const LEVEL_THRESHOLDS = [0, 500, 1500, 3200, 6000, 10000, 15000, 21000]

export interface LevelInfo {
  level: Level
  levelNumber: number
  /** XP within the current level band */
  xpIntoLevel: number
  xpForLevel: number
  percent: number
  nextLevel: Level | null
}

export function getLevelInfo(xp: number): LevelInfo {
  let levelNumber = 1
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]!) levelNumber = i + 1
  }
  levelNumber = Math.min(levelNumber, LEVELS.length)
  const idx = levelNumber - 1
  const base = LEVEL_THRESHOLDS[idx]!
  const next = LEVEL_THRESHOLDS[idx + 1]
  const xpIntoLevel = xp - base
  const xpForLevel = next ? next - base : 1
  const percent = next
    ? Math.round((xpIntoLevel / xpForLevel) * 100)
    : 100
  return {
    level: LEVELS[Math.min(idx, LEVELS.length - 1)]!,
    levelNumber,
    xpIntoLevel,
    xpForLevel,
    percent: Math.min(100, percent),
    nextLevel: LEVELS[idx + 1] ?? null,
  }
}
