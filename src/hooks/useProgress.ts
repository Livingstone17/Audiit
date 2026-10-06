import { useAppStore, accuracyOf, allMissions, completedSet } from '../store/app'
import { getLevelInfo } from '../lib/levels'
import { SKILLS } from '../data/achievements'
import { countHintsUsed, levelMissions, recommendedMission } from '../data/missions'
import type { Mission } from '../lib/types'

export function useProgress() {
  const xp = useAppStore((s) => s.xp)
  const records = useAppStore((s) => s.records)
  const submissions = useAppStore((s) => s.submissions)
  const achievements = useAppStore((s) => s.achievements)
  const events = useAppStore((s) => s.events)

  const missions = allMissions()
  const completed = completedSet({ records })
  const levelInfo = getLevelInfo(xp)
  const started = new Set(
    Object.entries(records)
      .filter(([, r]) => r.status === 'in-progress')
      .map(([id]) => id),
  )
  const accuracy = accuracyOf(submissions)
  // count only real hints — paid per-question solutions are tracked separately
  const hintsUsed = missions.reduce(
    (n, m) => n + countHintsUsed(m, records[m.id]?.revealedHints),
    0,
  )
  const missionsCompleted = completed.size
  const totalMissions = missions.length

  const next = recommendedMission(completed)

  const skills = SKILLS.map((skill) => {
    const skillMissions = levelMissions(skill.levelId)
    const done = skillMissions.filter((m) => completed.has(m.id)).length
    return {
      ...skill,
      done,
      total: skillMissions.length,
      percent: skillMissions.length
        ? Math.round((done / skillMissions.length) * 100)
        : 0,
    }
  })

  const completedMissions: Mission[] = missions.filter((m) => completed.has(m.id))

  return {
    xp,
    records,
    missions,
    completed,
    started,
    levelInfo,
    accuracy,
    hintsUsed,
    missionsCompleted,
    totalMissions,
    next,
    skills,
    achievements,
    events,
    completedMissions,
  }
}
