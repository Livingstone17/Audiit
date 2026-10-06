export interface PeerLearner {
  id: string
  name: string
  persona: string
  xp: number
  missionsCompleted: number
  accuracy: number
  hintsUsed: number
  avatarHue: number
  /** deterministic drift so the list does not change between renders */
  lastActiveDaysAgo: number
}

/** Fellow "audit team members" — seed data for the leaderboard and activity. */
export const PEERS: PeerLearner[] = [
  { id: 'u-amara', name: 'Amara Obi', persona: 'Audit trainee', xp: 4820, missionsCompleted: 17, accuracy: 92, hintsUsed: 6, avatarHue: 280, lastActiveDaysAgo: 0 },
  { id: 'u-chidi', name: 'Chidi Nwosu', persona: 'Internal auditor', xp: 4310, missionsCompleted: 16, accuracy: 89, hintsUsed: 9, avatarHue: 210, lastActiveDaysAgo: 0 },
  { id: 'u-blessing', name: 'Blessing Eze', persona: 'Student', xp: 3760, missionsCompleted: 14, accuracy: 95, hintsUsed: 3, avatarHue: 140, lastActiveDaysAgo: 1 },
  { id: 'u-yusuf', name: 'Yusuf Danjuma', persona: 'Accountant', xp: 3120, missionsCompleted: 13, accuracy: 84, hintsUsed: 12, avatarHue: 30, lastActiveDaysAgo: 1 },
  { id: 'u-nneka', name: 'Nneka Okoro', persona: 'Finance professional', xp: 2640, missionsCompleted: 11, accuracy: 90, hintsUsed: 5, avatarHue: 330, lastActiveDaysAgo: 2 },
  { id: 'u-segun', name: 'Segun Adeleke', persona: 'Audit trainee', xp: 2180, missionsCompleted: 10, accuracy: 81, hintsUsed: 14, avatarHue: 190, lastActiveDaysAgo: 2 },
  { id: 'u-hauwa', name: 'Hauwa Bello', persona: 'Student', xp: 1750, missionsCompleted: 8, accuracy: 88, hintsUsed: 7, avatarHue: 45, lastActiveDaysAgo: 3 },
  { id: 'u-emma', name: 'Emeka Okafor', persona: 'External auditor', xp: 1320, missionsCompleted: 7, accuracy: 86, hintsUsed: 8, avatarHue: 100, lastActiveDaysAgo: 4 },
  { id: 'u-tola', name: 'Tola Ajayi', persona: 'Student', xp: 890, missionsCompleted: 5, accuracy: 79, hintsUsed: 11, avatarHue: 250, lastActiveDaysAgo: 5 },
  { id: 'u-kelechi', name: 'Kelechi Umeh', persona: 'Accountant', xp: 460, missionsCompleted: 3, accuracy: 83, hintsUsed: 4, avatarHue: 160, lastActiveDaysAgo: 6 },
]

/** Activity feed entries attached to peers (for dashboard flavour). */
export const PEER_ACTIVITY = [
  { peerId: 'u-amara', text: 'completed Duplicate Invoice Detection', xp: 200, daysAgo: 0 },
  { peerId: 'u-blessing', text: 'earned the First Finding badge', xp: 0, daysAgo: 0 },
  { peerId: 'u-chidi', text: 'started Approval Threshold Testing', xp: 0, daysAgo: 1 },
  { peerId: 'u-nneka', text: 'completed Understand the Procure-to-Pay Cycle', xp: 150, daysAgo: 1 },
  { peerId: 'u-yusuf', text: 'used a hint on PivotTables', xp: -20, daysAgo: 2 },
  { peerId: 'u-segun', text: 'reached Level 2 · Audit Analyst', xp: 0, daysAgo: 3 },
] as const
