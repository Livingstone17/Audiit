import type { Level, Mission, MissionStatus } from '../../lib/types'
import { LEVELS } from '../../lib/levels'

/**
 * Catalogue-independent mission helpers.
 *
 * Everything here is a pure function of the mission array, so pages can work
 * with the lazily-loaded catalogue (`useMissions()`) without the 40-mission
 * seed content being in the initial bundle. The seed itself lives in
 * `catalog.ts` and is code-split with a dynamic import from the app store.
 */

/** Number of seed missions shipped (asserted by tests; admin edits excluded). */
export const SEED_MISSION_COUNT = 40

export const AVAILABLE_LEVELS = LEVELS.filter((l) => l.available)

export function getMission(missions: Mission[], id: string): Mission | undefined {
  return missions.find((m) => m.id === id)
}

export function levelMissions(missions: Mission[], levelId: string): Mission[] {
  return missions.filter((m) => m.levelId === levelId)
}

export function nextMission(missions: Mission[], missionId: string): Mission | undefined {
  const idx = missions.findIndex((m) => m.id === missionId)
  return idx >= 0 ? missions[idx + 1] : undefined
}

/** Missions unlock strictly in sequence; the first mission is always open. */
export function isMissionUnlocked(
  missions: Mission[],
  missionId: string,
  completed: Set<string>,
): boolean {
  const idx = missions.findIndex((m) => m.id === missionId)
  if (idx <= 0) return idx === 0
  const prev = missions[idx - 1]!
  return completed.has(prev.id)
}

export function missionStatus(
  missions: Mission[],
  missionId: string,
  completed: Set<string>,
  started: Set<string>,
): MissionStatus {
  if (completed.has(missionId)) return 'completed'
  if (started.has(missionId)) return 'in-progress'
  return isMissionUnlocked(missions, missionId, completed) ? 'available' : 'locked'
}

/** The mission the learner should do next: first uncompleted unlocked mission. */
export function recommendedMission(missions: Mission[], completed: Set<string>): Mission {
  return (
    missions.find((m) => !completed.has(m.id) && isMissionUnlocked(missions, m.id, completed)) ??
    missions[missions.length - 1]!
  )
}

export interface ModuleGroup {
  levelId: string
  module: string
  missions: Mission[]
}

/** Courses → modules → missions, in curriculum order. */
export function moduleGroups(missions: Mission[], levelId?: string): ModuleGroup[] {
  const groups: ModuleGroup[] = []
  for (const m of missions) {
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
  missions: Mission[],
  level: Level,
  completed: Set<string>,
): { done: number; total: number; percent: number; locked: boolean } {
  const all = levelMissions(missions, level.id)
  const done = all.filter((m) => completed.has(m.id)).length
  return {
    done,
    total: all.length,
    percent: all.length ? Math.round((done / all.length) * 100) : 0,
    locked: !level.available,
  }
}

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
