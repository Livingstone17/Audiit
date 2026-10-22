/**
 * Cloud sync — mirrors the local-first progress slices to Supabase Postgres.
 *
 * AuditLab stays authoritative in localStorage: every mutation is written
 * locally first, so the app keeps working offline, with no credentials, and in
 * tests. This module is the *only* place that talks to Postgres. It pushes the
 * signed-in user's slice up and pulls the cloud copy down, then merges the two
 * with deterministic, idempotent rules (completion outranks in-progress,
 * counters take the max, append-only logs are unioned by id).
 *
 * Because push is a full-state upsert and merge is idempotent, a sync can be
 * replayed safely as often as we like — which is exactly what the retry loop
 * does whenever the browser comes back online.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  AnalyticsEvent,
  AnalyticsEventType,
  AuditFindingDraft,
  MissionRecord,
  Submission,
  User,
} from './types'
import type { UserProgress } from '../store/app'

/** Newest-wins cap on the synced submissions log, applied per user. */
export const SUBMISSIONS_CAP = 500

/* ------------------------------------------------------------------ */
/* Row shapes (snake_case) ⇄ domain shapes (camelCase)                */
/* ------------------------------------------------------------------ */

export interface ProfileRow {
  id: string
  name: string | null
  role: string | null
  persona: string | null
  excel_level: string | null
  avatar_hue: number | null
  created_at: string | null
}

interface ProgressRow {
  xp: number | null
  task_checks: unknown
  achievements: unknown
  reset_at: string | null
}

interface RecordRow {
  mission_id: string
  status: 'in-progress' | 'completed'
  started_at: string
  completed_at: string | null
  attempts: number | null
  first_try_correct: boolean | null
  hints_used: number | null
  hint_xp: number | null
  revealed_hints: unknown
  questions_correct: number | null
  questions_total: number | null
}

interface SubmissionRow {
  id: string
  mission_id: string
  question_id: string
  answer: string | null
  correct: boolean | null
  attempts: number | null
  submitted_at: string
}

interface EventRow {
  id: string
  type: string
  mission_id: string | null
  question_id: string | null
  value: number | string | null
  occurred_at: string
}

interface FindingRow {
  id: string
  mission_id: string
  title: string | null
  condition: string | null
  criteria: string | null
  cause: string | null
  effect: string | null
  recommendation: string | null
  response: string | null
  owner: string | null
  due_date: string | null
  created_at: string
}

/** The shape of the Supabase auth user we consume (kept structural for tests). */
export interface AuthUserLike {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown> | null
  created_at?: string
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

function asIndexMap(value: unknown): Record<string, number[]> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const out: Record<string, number[]> = {}
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (Array.isArray(raw)) out[key] = raw.filter((n): n is number => typeof n === 'number')
  }
  return out
}

/* ------------------------------------------------------------------ */
/* Domain ⇄ row mapping                                                */
/* ------------------------------------------------------------------ */

/** Build the local `User` from a Supabase auth user plus its profile row. */
export function userFromCloud(raw: AuthUserLike, profile: ProfileRow | null): User {
  const meta = raw.user_metadata ?? {}
  const metaName = typeof meta.full_name === 'string' ? meta.full_name : undefined
  const metaPersona = typeof meta.persona === 'string' ? meta.persona : undefined
  const metaHue = typeof meta.avatar_hue === 'number' ? meta.avatar_hue : undefined
  const excelLevel =
    profile?.excel_level === 'Beginner' ||
    profile?.excel_level === 'Intermediate' ||
    profile?.excel_level === 'Advanced'
      ? profile.excel_level
      : undefined

  return {
    id: raw.id,
    name: profile?.name || metaName || raw.email?.split('@')[0] || 'User',
    email: raw.email ?? '',
    role: profile?.role === 'admin' ? 'admin' : 'learner',
    persona: profile?.persona ?? metaPersona,
    excelLevel,
    avatarHue: profile?.avatar_hue ?? metaHue,
    createdAt: profile?.created_at ?? raw.created_at ?? new Date().toISOString(),
    demo: false,
  }
}

function recordFromRow(row: RecordRow): MissionRecord {
  return {
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at ?? undefined,
    attempts: row.attempts ?? 0,
    firstTryCorrect: row.first_try_correct ?? true,
    hintsUsed: row.hints_used ?? 0,
    hintXp: row.hint_xp ?? 0,
    revealedHints: asStringArray(row.revealed_hints),
    questionsCorrect: row.questions_correct ?? 0,
    questionsTotal: row.questions_total ?? 0,
  }
}

function recordToRow(userId: string, missionId: string, r: MissionRecord, updatedAt: string) {
  return {
    user_id: userId,
    mission_id: missionId,
    status: r.status,
    started_at: r.startedAt,
    completed_at: r.completedAt ?? null,
    attempts: r.attempts,
    first_try_correct: r.firstTryCorrect,
    hints_used: r.hintsUsed,
    hint_xp: r.hintXp ?? 0,
    revealed_hints: r.revealedHints ?? [],
    questions_correct: r.questionsCorrect,
    questions_total: r.questionsTotal,
    updated_at: updatedAt,
  }
}

/* ------------------------------------------------------------------ */
/* Merging (used by both sync and the admin aggregation)               */
/* ------------------------------------------------------------------ */

/**
 * Merge two views of the same mission: completion outranks in-progress, the
 * earliest start/complete timestamps win, counters take the max and hint
 * reveals are unioned. Never loses progress, so it is safe to merge in either
 * direction.
 */
export function mergeMissionRecord(prev: MissionRecord, next: MissionRecord): MissionRecord {
  return {
    status:
      prev.status === 'completed' || next.status === 'completed' ? 'completed' : 'in-progress',
    startedAt: prev.startedAt < next.startedAt ? prev.startedAt : next.startedAt,
    completedAt:
      prev.completedAt && next.completedAt
        ? prev.completedAt < next.completedAt
          ? prev.completedAt
          : next.completedAt
        : prev.completedAt ?? next.completedAt,
    attempts: Math.max(prev.attempts, next.attempts),
    firstTryCorrect: prev.firstTryCorrect && next.firstTryCorrect,
    hintsUsed: Math.max(prev.hintsUsed, next.hintsUsed),
    hintXp: Math.max(prev.hintXp ?? 0, next.hintXp ?? 0),
    revealedHints: [...new Set([...(prev.revealedHints ?? []), ...(next.revealedHints ?? [])])],
    questionsCorrect: Math.max(prev.questionsCorrect, next.questionsCorrect),
    questionsTotal: Math.max(prev.questionsTotal, next.questionsTotal),
  }
}

function unionById<T extends { id: string; at: string }>(a: T[], b: T[]): T[] {
  const byId = new Map<string, T>()
  for (const item of [...a, ...b]) byId.set(item.id, item)
  return [...byId.values()].sort((x, y) => x.at.localeCompare(y.at))
}

/**
 * Merge a local and cloud progress slice into one lossless view.
 *
 * A "Reset progress" is a hard watermark (`resetAt`): whichever side reset most
 * recently wins outright and the other side is ignored, so a reset made offline
 * is not resurrected by the next pull. Clock skew between devices is tolerable
 * because the watermark only ever has to be comparable with itself.
 */
export function mergeUserProgress(local: UserProgress, remote: UserProgress): UserProgress {
  const resetAt = [local.resetAt, remote.resetAt]
    .filter((v): v is string => Boolean(v))
    .sort()
    .pop()

  const empty: UserProgress = {
    xp: 0,
    records: {},
    taskChecks: {},
    submissions: [],
    achievements: [],
    events: [],
    findings: [],
  }
  // A slice that predates the watermark is stale in its entirety.
  const l = !resetAt || local.resetAt === resetAt ? local : empty
  const r = !resetAt || remote.resetAt === resetAt ? remote : empty

  const records: Record<string, MissionRecord> = { ...l.records }
  for (const [id, rec] of Object.entries(r.records)) {
    const prev = records[id]
    records[id] = prev ? mergeMissionRecord(prev, rec) : { ...rec }
  }

  const taskChecks: Record<string, number[]> = { ...l.taskChecks }
  for (const [id, indices] of Object.entries(r.taskChecks)) {
    taskChecks[id] = [...new Set([...(taskChecks[id] ?? []), ...indices])].sort((a, b) => a - b)
  }

  const findings = new Map<string, AuditFindingDraft>()
  for (const f of [...r.findings, ...l.findings]) findings.set(f.id, f)

  return {
    xp: Math.max(l.xp, r.xp),
    records,
    taskChecks,
    submissions: unionById(l.submissions, r.submissions).slice(-SUBMISSIONS_CAP),
    achievements: [...new Set([...l.achievements, ...r.achievements])],
    events: unionById(l.events, r.events).slice(-3000),
    findings: [...findings.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    resetAt,
  }
}

/* ------------------------------------------------------------------ */
/* Postgres reads & writes                                             */
/* ------------------------------------------------------------------ */

export async function fetchProfile(
  client: SupabaseClient,
  userId: string,
): Promise<ProfileRow | null> {
  const { data, error } = await client
    .from('profiles')
    .select('id, name, role, persona, excel_level, avatar_hue, created_at')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data as ProfileRow | null) ?? null
}

/**
 * Upsert the profile row so name/persona survive a device change.
 *
 * `role` is deliberately never written from the browser: the database trigger
 * rejects role changes from non-admins, and an admin whose profile read
 * transiently failed must not be able to demote themselves by accident.
 */
export async function pushProfile(client: SupabaseClient, user: User): Promise<void> {
  const { error } = await client.from('profiles').upsert(
    {
      id: user.id,
      name: user.name,
      persona: user.persona ?? null,
      excel_level: user.excelLevel ?? null,
      avatar_hue: user.avatarHue ?? null,
      created_at: user.createdAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )
  if (error) throw new Error(error.message)
}

/**
 * Push the whole local slice for one learner. Every write is an upsert, so
 * replaying this push is harmless — that is what makes the offline retry loop
 * safe. Append-only logs use `ignoreDuplicates`; findings are overwritten
 * because they are edited in place locally.
 */
export async function pushSnapshot(
  client: SupabaseClient,
  user: User,
  progress: UserProgress,
): Promise<void> {
  await pushProfile(client, user)

  const now = new Date().toISOString()

  const { error: progressError } = await client.from('user_progress').upsert(
    {
      user_id: user.id,
      xp: progress.xp,
      task_checks: progress.taskChecks,
      achievements: progress.achievements,
      reset_at: progress.resetAt ?? null,
      updated_at: now,
    },
    { onConflict: 'user_id' },
  )
  if (progressError) throw new Error(progressError.message)

  const recordRows = Object.entries(progress.records).map(([missionId, r]) =>
    recordToRow(user.id, missionId, r, now),
  )
  if (recordRows.length) {
    const { error } = await client
      .from('mission_records')
      .upsert(recordRows, { onConflict: 'user_id,mission_id' })
    if (error) throw new Error(error.message)
  }

  if (progress.submissions.length) {
    const rows = progress.submissions.map((s) => ({
      id: s.id,
      user_id: user.id,
      mission_id: s.missionId,
      question_id: s.questionId,
      answer: s.answer,
      correct: s.correct,
      attempts: s.attempts,
      submitted_at: s.at,
    }))
    const { error } = await client
      .from('submissions')
      .upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
    if (error) throw new Error(error.message)
  }

  if (progress.events.length) {
    const rows = progress.events.map((e) => ({
      id: e.id,
      user_id: user.id,
      type: e.type,
      mission_id: e.missionId ?? null,
      question_id: e.questionId ?? null,
      value: e.value ?? null,
      occurred_at: e.at,
    }))
    const { error } = await client
      .from('analytics_events')
      .upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
    if (error) throw new Error(error.message)
  }

  if (progress.findings.length) {
    const rows = progress.findings.map((f) => ({
      id: f.id,
      user_id: user.id,
      mission_id: f.missionId,
      title: f.title,
      condition: f.condition,
      criteria: f.criteria,
      cause: f.cause,
      effect: f.effect,
      recommendation: f.recommendation,
      response: f.response,
      owner: f.owner,
      due_date: f.dueDate,
      created_at: f.createdAt,
    }))
    const { error } = await client.from('audit_findings').upsert(rows, { onConflict: 'id' })
    if (error) throw new Error(error.message)
  }
}

/** Read the cloud copy of one learner's slice. */
export async function pullSnapshot(
  client: SupabaseClient,
  userId: string,
): Promise<UserProgress> {
  const [progressRes, recordsRes, submissionsRes, eventsRes, findingsRes] = await Promise.all([
    client
      .from('user_progress')
      .select('xp, task_checks, achievements, reset_at')
      .eq('user_id', userId)
      .maybeSingle(),
    client.from('mission_records').select('*').eq('user_id', userId),
    client.from('submissions').select('*').eq('user_id', userId).order('submitted_at'),
    client.from('analytics_events').select('*').eq('user_id', userId).order('occurred_at'),
    client.from('audit_findings').select('*').eq('user_id', userId).order('created_at'),
  ])

  for (const res of [progressRes, recordsRes, submissionsRes, eventsRes, findingsRes]) {
    if (res.error) throw new Error(res.error.message)
  }

  const progress = progressRes.data as ProgressRow | null
  const records: Record<string, MissionRecord> = {}
  for (const row of (recordsRes.data ?? []) as RecordRow[]) {
    records[row.mission_id] = recordFromRow(row)
  }

  const submissions: Submission[] = ((submissionsRes.data ?? []) as SubmissionRow[]).map((row) => ({
    id: row.id,
    missionId: row.mission_id,
    questionId: row.question_id,
    answer: row.answer ?? '',
    correct: row.correct ?? false,
    attempts: row.attempts ?? 1,
    at: row.submitted_at,
  }))

  const events: AnalyticsEvent[] = ((eventsRes.data ?? []) as EventRow[]).map((row) => ({
    id: row.id,
    type: row.type as AnalyticsEventType,
    missionId: row.mission_id ?? undefined,
    questionId: row.question_id ?? undefined,
    value: row.value == null ? undefined : Number(row.value),
    at: row.occurred_at,
  }))

  const findings: AuditFindingDraft[] = ((findingsRes.data ?? []) as FindingRow[]).map((row) => ({
    id: row.id,
    missionId: row.mission_id,
    title: row.title ?? '',
    condition: row.condition ?? '',
    criteria: row.criteria ?? '',
    cause: row.cause ?? '',
    effect: row.effect ?? '',
    recommendation: row.recommendation ?? '',
    response: row.response ?? '',
    owner: row.owner ?? '',
    dueDate: row.due_date ?? '',
    createdAt: row.created_at,
  }))

  return {
    xp: progress?.xp ?? 0,
    records,
    taskChecks: asIndexMap(progress?.task_checks),
    submissions,
    achievements: asStringArray(progress?.achievements),
    events,
    findings,
    resetAt: progress?.reset_at ?? undefined,
  }
}

/**
 * Wipe a learner's cloud rows. Called by "Reset progress" so the wipe is not
 * undone by the next pull; the `reset_at` watermark protects the same thing
 * when the reset happens offline and the delete cannot reach the network.
 */
export async function deleteCloudProgress(
  client: SupabaseClient,
  userId: string,
  resetAt: string,
): Promise<void> {
  for (const table of ['submissions', 'analytics_events', 'audit_findings', 'mission_records']) {
    const { error } = await client.from(table).delete().eq('user_id', userId)
    if (error) throw new Error(error.message)
  }
  const { error } = await client.from('user_progress').upsert(
    {
      user_id: userId,
      xp: 0,
      task_checks: {},
      achievements: [],
      reset_at: resetAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
  if (error) throw new Error(error.message)
}
