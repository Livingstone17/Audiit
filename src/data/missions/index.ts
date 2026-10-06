import type { Level, Mission, MissionStatus } from '../../lib/types'
import { LEVELS } from '../../lib/levels'
import { FOUNDATION_MISSIONS } from './foundations'
import { PROCUREMENT_MISSIONS } from './procurement'
import { INVESTIGATION_MISSIONS } from './investigation'
import { BOSS_MISSION } from './boss'

export const MISSIONS: Mission[] = [
  ...FOUNDATION_MISSIONS,
  ...PROCUREMENT_MISSIONS,
  ...INVESTIGATION_MISSIONS,
  BOSS_MISSION,
]

export function getMission(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id)
}

export function levelMissions(levelId: string): Mission[] {
  return MISSIONS.filter((m) => m.levelId === levelId)
}

export function nextMission(missionId: string): Mission | undefined {
  const idx = MISSIONS.findIndex((m) => m.id === missionId)
  return idx >= 0 ? MISSIONS[idx + 1] : undefined
}

/** Missions unlock strictly in sequence; the first mission is always open. */
export function isMissionUnlocked(missionId: string, completed: Set<string>): boolean {
  const idx = MISSIONS.findIndex((m) => m.id === missionId)
  if (idx <= 0) return idx === 0
  const prev = MISSIONS[idx - 1]!
  return completed.has(prev.id)
}

export function missionStatus(
  missionId: string,
  completed: Set<string>,
  started: Set<string>,
): MissionStatus {
  if (completed.has(missionId)) return 'completed'
  if (started.has(missionId)) return 'in-progress'
  return isMissionUnlocked(missionId, completed) ? 'available' : 'locked'
}

/** The mission the learner should do next: first uncompleted unlocked mission. */
export function recommendedMission(completed: Set<string>): Mission {
  return MISSIONS.find((m) => !completed.has(m.id) && isMissionUnlocked(m.id, completed)) ?? MISSIONS[MISSIONS.length - 1]!
}

export interface ModuleGroup {
  levelId: string
  module: string
  missions: Mission[]
}

/** Courses → modules → missions, in curriculum order. */
export function moduleGroups(levelId?: string): ModuleGroup[] {
  const groups: ModuleGroup[] = []
  for (const m of MISSIONS) {
    if (levelId && m.levelId !== levelId) continue
    const last = groups[groups.length - 1]
    if (last && last.module === m.module && last.levelId === m.levelId) {
      last.missions.push(m)
    } else {
      groups.push({ levelId: m.levelId, module: m.module, missions: [m] })
    }
  }
  return groups
}

export function levelCompletion(
  level: Level,
  completed: Set<string>,
): { done: number; total: number; percent: number; locked: boolean } {
  const missions = levelMissions(level.id)
  const done = missions.filter((m) => completed.has(m.id)).length
  return {
    done,
    total: missions.length,
    percent: missions.length ? Math.round((done / missions.length) * 100) : 0,
    locked: !level.available,
  }
}

export const AVAILABLE_LEVELS = LEVELS.filter((l) => l.available)

/**
 * Count only real hint reveals for a mission. Per-question paid solutions are
 * stored in the same `revealedHints` list but are not hints — keeping them
 * apart stops badges from reading "4/3 used".
 */
export function countHintsUsed(mission: Mission, revealed: string[] | undefined): number {
  if (!revealed?.length) return 0
  const ids = new Set(mission.hints.map((h) => h.id))
  return revealed.filter((id) => ids.has(id)).length
}

/** How many paid per-question solutions the learner has revealed. */
export function countSolutionsShown(revealed: string[] | undefined): number {
  return revealed?.filter((id) => id.startsWith('solution-')).length ?? 0
}
