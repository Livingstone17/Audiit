import { describe, expect, it } from 'vitest'
import { LEVELS, LEVEL_THRESHOLDS, getLevelInfo } from '../lib/levels'

describe('levels & XP', () => {
  it('defines 7 levels with the first 5 available', () => {
    expect(LEVELS).toHaveLength(7)
    expect(LEVELS.filter((l) => l.available)).toHaveLength(5)
    expect(LEVELS[0]!.name).toBe('Audit Trainee')
    expect(LEVELS[6]!.name).toBe('Audit Manager')
  })

  it('maps XP to levels at the thresholds', () => {
    expect(getLevelInfo(0).levelNumber).toBe(1)
    expect(getLevelInfo(499).levelNumber).toBe(1)
    expect(getLevelInfo(500).levelNumber).toBe(2)
    expect(getLevelInfo(1499).levelNumber).toBe(2)
    expect(getLevelInfo(1500).levelNumber).toBe(3)
    expect(getLevelInfo(5999).levelNumber).toBe(4)
    expect(getLevelInfo(6000).levelNumber).toBe(5)
    expect(getLevelInfo(100000).levelNumber).toBe(7)
  })

  it('reports progress within the current level band', () => {
    const info = getLevelInfo(750)
    expect(info.levelNumber).toBe(2)
    expect(info.xpIntoLevel).toBe(250)
    expect(info.xpForLevel).toBe(1000)
    expect(info.percent).toBe(25)
    expect(info.nextLevel?.name).toBe('Internal Auditor')
  })

  it('has strictly increasing thresholds', () => {
    for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
      expect(LEVEL_THRESHOLDS[i]!).toBeGreaterThan(LEVEL_THRESHOLDS[i - 1]!)
    }
  })
})
