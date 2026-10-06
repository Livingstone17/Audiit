export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'

export type QuestionType =
  | 'mcq'
  | 'formula'
  | 'numeric'
  | 'text'
  | 'exception-select'
  | 'conclusion'

export type Conclusion =
  | 'No exception'
  | 'Exception requiring investigation'
  | 'Significant finding'
  | 'Insufficient evidence'

export const CONCLUSIONS: Conclusion[] = [
  'No exception',
  'Exception requiring investigation',
  'Significant finding',
  'Insufficient evidence',
]

/** Resolvable answer: static value, or computed from a deterministic dataset. */
export type AnswerValue = string | number | string[] | (() => string | number | string[])

export interface Choice {
  id: string
  label: string
  /** Optional context line under the label (e.g. a transaction id) */
  hint?: string
}

export interface Question {
  id: string
  type: QuestionType
  prompt: string
  context?: string

  /** multiple choice */
  options?: Choice[]
  correctOptionId?: string

  /** formula entry */
  accepted?: string[]
  placeholder?: string

  /** numeric entry */
  answer?: AnswerValue
  unit?: string

  /** free text — all keywords must appear (case-insensitive) */
  keywords?: string[]
  minWords?: number
  placeholderText?: string

  /** exception selection — static or computed from a dataset */
  choices?: Choice[] | (() => Choice[])
  correctIds?: AnswerValue

  /** audit conclusion classification */
  correctConclusion?: Conclusion

  /** shown after a correct submission */
  explanation: string
  /** shown after an incorrect submission instead of the answer */
  incorrectFeedback: string
}

/**
 * Excel/audit concepts taught by the missions. Each has a curated
 * "learn the concept" resource in data/learnLinks.ts.
 */
export type LearnConcept =
  | 'status-bar'
  | 'unique-keys'
  | 'filter'
  | 'sort'
  | 'tables'
  | 'if'
  | 'countif'
  | 'countifs'
  | 'sumif'
  | 'countblank'
  | 'xlookup'
  | 'vlookup'
  | 'conditional-formatting'
  | 'pivot'
  | 'random-sample'
  | 'three-way-match'
  | 'audit-findings'
  | 'executive-summary'
  | 'approval-matrix'
  | 'sum-column'
  | 'cell-references'
  | 'absolute-references'
  | 'find-duplicates'
  | 'filter-multiple'
  | 'pivot-sum-count'
  | 'median'
  | 'procure-to-pay'

export interface Hint {
  id: string
  title: string
  body: string
  xpCost: number
  /** concept key into LEARN_LINKS — drives the "learn the concept" link shown after reveal */
  concept?: LearnConcept
}

export interface TeachBlock {
  title: string
  formula?: string
  explanation: string
}

export interface Mission {
  id: string
  number: number
  levelId: string
  module: string
  category: string
  title: string
  difficulty: Difficulty
  xp: number
  estMinutes: number
  summary: string
  scenario: string[]
  objective: string
  tasks: string[]
  teaches?: TeachBlock[]
  datasetIds: string[]
  docIds?: string[]
  hints: Hint[]
  questions: Question[]
  completion: string[]
}

export interface Level {
  id: string
  order: number
  name: string
  tagline: string
  description: string
  available: boolean
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  /** accent gradient classes */
  color: string
}

export interface Persona {
  id: string
  label: string
}

export interface User {
  id: string
  name: string
  email: string
  role: 'learner' | 'admin'
  persona?: string
  excelLevel?: 'Beginner' | 'Intermediate' | 'Advanced'
  avatarHue?: number
  createdAt: string
  /** demo accounts used on the marketing/admin screens */
  demo?: boolean
}

export type MissionStatus = 'locked' | 'available' | 'in-progress' | 'completed'

export interface MissionRecord {
  status: 'in-progress' | 'completed'
  startedAt: string
  completedAt?: string
  attempts: number
  firstTryCorrect: boolean
  hintsUsed: number
  /** cumulative XP spent on hints for this mission */
  hintXp?: number
  /** hint ids the learner has revealed */
  revealedHints?: string[]
  questionsCorrect: number
  questionsTotal: number
}

export type AnalyticsEventType =
  | 'mission_started'
  | 'mission_completed'
  | 'mission_abandoned'
  | 'question_answered'
  | 'correct_answer'
  | 'incorrect_answer'
  | 'hint_requested'
  | 'dataset_downloaded'
  | 'doc_downloaded'
  | 'submission_made'
  | 'xp_earned'
  | 'module_completed'
  | 'onboarding_completed'
  | 'login'

export interface AnalyticsEvent {
  id: string
  type: AnalyticsEventType
  missionId?: string
  questionId?: string
  value?: number
  at: string
}

export interface Submission {
  id: string
  missionId: string
  questionId: string
  answer: string
  correct: boolean
  attempts: number
  at: string
}

export interface AuditFindingDraft {
  id: string
  missionId: string
  title: string
  condition: string
  criteria: string
  cause: string
  effect: string
  recommendation: string
  response: string
  owner: string
  dueDate: string
  createdAt: string
}
