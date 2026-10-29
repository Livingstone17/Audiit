/**
 * The full mission catalogue — all 40 seed missions.
 *
 * This module is deliberately NOT imported statically by app code (only by
 * tests). The store code-splits it with `import('../data/missions/catalog')`,
 * so the ~5,000 lines of mission content load after first paint instead of
 * blocking it. Catalogue-independent helpers live in `pure.ts`.
 */

import type { Level, Mission, MissionStatus } from '../../lib/types'
import { FOUNDATION_MISSIONS } from './foundations'
import { FOUNDATION_GAP_MISSIONS } from './foundationGap'
import { PROCUREMENT_MISSIONS } from './procurement'
import { ANALYST_GAP_MISSIONS } from './analystGap'
import { INVESTIGATION_MISSIONS } from './investigation'
import { L3_GAP_MISSIONS, L5_GAP_MISSIONS } from './advancedGap'
import { BOSS_MISSION } from './boss'
import {
  getMission as getMissionIn,
  isMissionUnlocked as isUnlockedIn,
  levelCompletion as levelCompletionIn,
  levelMissions as levelMissionsIn,
  missionStatus as missionStatusIn,
  moduleGroups as moduleGroupsIn,
  nextMission as nextMissionIn,
  recommendedMission as recommendedMissionIn,
} from './pure'

export const MISSIONS: Mission[] = [
  ...FOUNDATION_MISSIONS,
  ...FOUNDATION_GAP_MISSIONS,
  ...PROCUREMENT_MISSIONS,
  ...ANALYST_GAP_MISSIONS,
  ...INVESTIGATION_MISSIONS,
  ...L3_GAP_MISSIONS,
  BOSS_MISSION,
  ...L5_GAP_MISSIONS,
]

/* Catalogue-bound spellings of the pure helpers (kept for tests + scripts). */

export function getMission(id: string): Mission | undefined {
  return getMissionIn(MISSIONS, id)
}

export function levelMissions(levelId: string): Mission[] {
  return levelMissionsIn(MISSIONS, levelId)
}

export function nextMission(missionId: string): Mission | undefined {
  return nextMissionIn(MISSIONS, missionId)
}

/** Missions unlock strictly in sequence; the first mission is always open. */
export function isMissionUnlocked(missionId: string, completed: Set<string>): boolean {
  return isUnlockedIn(MISSIONS, missionId, completed)
}

export function missionStatus(
  missionId: string,
  completed: Set<string>,
  started: Set<string>,
): MissionStatus {
  return missionStatusIn(MISSIONS, missionId, completed, started)
}

/** The mission the learner should do next: first uncompleted unlocked mission. */
export function recommendedMission(completed: Set<string>): Mission {
  return recommendedMissionIn(MISSIONS, completed)
}

export interface ModuleGroup {
  levelId: string
  module: string
  missions: Mission[]
}

/** Courses → modules → missions, in curriculum order. */
export function moduleGroups(levelId?: string) {
  return moduleGroupsIn(MISSIONS, levelId)
}

export function levelCompletion(
  level: Level,
  completed: Set<string>,
): { done: number; total: number; percent: number; locked: boolean } {
  return levelCompletionIn(MISSIONS, level, completed)
}
