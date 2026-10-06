import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  FilePen,
  GripVertical,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import { allMissions, useAppStore } from '../../store/app'
import { CONCLUSIONS, type Conclusion, type LearnConcept, type Mission, type Question, type QuestionType } from '../../lib/types'
import { LEVELS } from '../../lib/levels'
import { DATASET_IDS } from '../../datasets/registry'
import { SUPPORTING_DOCS } from '../../datasets/download'
import { LEARN_CONCEPTS, LEARN_LINKS } from '../../data/learnLinks'
import { Badge, DifficultyBadge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input, Select, Textarea } from '../../components/ui/forms'
import { Alert, Dialog, EmptyState } from '../../components/ui/overlays'
import { useToasts } from '../../store/toasts'
import type { Difficulty } from '../../lib/types'

/** Resolve any computed (function) answers into plain JSON-safe values. */
function toPlain(mission: Mission): Mission {
  return {
    ...mission,
    docIds: mission.docIds ?? [],
    questions: mission.questions.map((q) => ({
      ...q,
      answer: typeof q.answer === 'function' ? q.answer() : q.answer,
      correctIds:
        typeof q.correctIds === 'function'
          ? q.correctIds()
          : q.correctIds,
      choices: typeof q.choices === 'function' ? q.choices() : q.choices,
    })),
  }
}

/* ------------------------------------------------------------------ */
/* Mission list                                                        */
/* ------------------------------------------------------------------ */

export function AdminMissions() {
  const missions = allMissions()
  const records = useAppStore((s) => s.records)
  const deleteAdminMission = useAppStore((s) => s.deleteAdminMission)
  const push = useToasts((s) => s.push)
  const [pendingDelete, setPendingDelete] = useState<Mission | null>(null)

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Mission library</h2>
          <p className="text-sm text-muted-foreground">
            {missions.length} missions · edits are saved locally and override seed content.
          </p>
        </div>
        <Link to="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={14} /> Overview
          </Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-12 gap-3 border-b border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <div className="col-span-1">#</div>
          <div className="col-span-5 sm:col-span-4">Title</div>
          <div className="col-span-2 hidden sm:block">Level</div>
          <div className="col-span-2 hidden sm:block">XP</div>
          <div className="col-span-6 text-right sm:col-span-3">Actions</div>
        </div>
        {missions.map((m) => (
          <div
            key={m.id}
            className="grid grid-cols-12 items-center gap-3 border-b border-border px-4 py-3 text-sm last:border-0"
          >
            <div className="col-span-1 font-mono text-xs text-muted-foreground">
              {String(m.number).padStart(2, '0')}
            </div>
            <div className="col-span-5 min-w-0 sm:col-span-4">
              <Link
                to={`/admin/missions/${m.id}`}
                className="block truncate font-medium hover:text-primary"
              >
                {m.title}
              </Link>
              <div className="mt-0.5 flex gap-1.5 sm:hidden">
                <Badge variant="muted">{m.xp} XP</Badge>
                <Badge variant="muted">{m.questions.length} Q</Badge>
              </div>
            </div>
            <div className="col-span-2 hidden sm:block">
              <Badge variant="muted">{m.levelId}</Badge>
            </div>
            <div className="col-span-2 hidden sm:flex sm:items-center sm:gap-2">
              <span className="text-[13px]">{m.xp}</span>
              <DifficultyBadge difficulty={m.difficulty} />
            </div>
            <div className="col-span-6 flex justify-end gap-1.5 sm:col-span-3">
              <Link to={`/admin/missions/${m.id}`}>
                <Button variant="secondary" size="sm">
                  <FilePen size={13} /> Edit
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPendingDelete(m)}
                aria-label="Delete mission"
              >
                <Trash2 size={14} className="text-danger" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title={`Delete "${pendingDelete?.title}"?`}
        description={
          records[pendingDelete?.id ?? '']?.status === 'completed'
            ? 'Learners have completed this mission — their progress stays, but the content disappears from the library.'
            : 'The mission will be removed from the library. This cannot be undone.'
        }
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setPendingDelete(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (pendingDelete) {
                deleteAdminMission(pendingDelete.id)
                push({ variant: 'default', title: 'Mission deleted', description: pendingDelete.title })
              }
              setPendingDelete(null)
            }}
          >
            Delete mission
          </Button>
        </div>
      </Dialog>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Editor                                                              */
/* ------------------------------------------------------------------ */

function lines(text: string): string[] {
  return text.split('\n').map((s) => s.trim()).filter(Boolean)
}

function idsText(value: Mission['questions'][number]['correctIds']): string {
  const v = typeof value === 'function' ? value() : value
  if (Array.isArray(v)) return v.join('\n')
  return String(v ?? '')
}

export function MissionEditor() {
  const { id } = useParams<{ id: string }>()
  const missions = allMissions()
  const source = missions.find((m) => m.id === id)

  if (!source) {
    return (
      <EmptyState
        icon={<FilePen size={32} />}
        title="Mission not found"
        description="It may have been deleted."
        action={
          <Link to="/admin/missions">
            <Button variant="secondary">Back to library</Button>
          </Link>
        }
      />
    )
  }

  return <MissionEditorForm key={source.id} source={source} />
}

function MissionEditorForm({ source }: { source: Mission }) {
  const navigate = useNavigate()
  const push = useToasts((s) => s.push)
  const upsert = useAppStore((s) => s.upsertAdminMission)

  const [initial] = useState(() => toPlain(source))
  const [draft, setDraft] = useState<Mission>(initial)
  const [scenarioText, setScenarioText] = useState(initial.scenario.join('\n'))
  const [tasksText, setTasksText] = useState(initial.tasks.join('\n'))
  const [completionText, setCompletionText] = useState(initial.completion.join('\n'))
  const [datasetsText, setDatasetsText] = useState(initial.datasetIds.join(', '))
  const [docsText, setDocsText] = useState((initial.docIds ?? []).join(', '))
  const [tried, setTried] = useState(false)

  const patch = (p: Partial<Mission>) => setDraft((d) => ({ ...d, ...p }))
  const patchQuestion = (qid: string, p: Partial<Question>) =>
    setDraft((d) => ({
      ...d,
      questions: d.questions.map((q) => (q.id === qid ? { ...q, ...p } : q)),
    }))

  const save = () => {
    setTried(true)
    if (!draft.title.trim() || draft.questions.length === 0) return
    const cleaned: Mission = {
      ...draft,
      scenario: lines(scenarioText),
      tasks: lines(tasksText),
      completion: lines(completionText),
      datasetIds: datasetsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      docIds: docsText
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s in SUPPORTING_DOCS),
      questions: draft.questions.filter((q) => q.prompt.trim()),
      hints: draft.hints,
    }
    upsert(cleaned)
    push({ variant: 'success', title: 'Mission saved', description: cleaned.title })
    navigate('/admin/missions')
  }

  const invalid = !draft.title.trim() || draft.questions.length === 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/admin/missions">
            <Button variant="ghost" size="icon" aria-label="Back">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div>
            <div className="font-mono text-[11px] font-bold tracking-wider text-primary">
              MISSION {String(draft.number).padStart(2, '0')} · EDITING
            </div>
            <h2 className="text-lg font-semibold tracking-tight">{draft.title}</h2>
          </div>
        </div>
        <Button onClick={save} loading={false}>
          <Save size={15} /> Save mission
        </Button>
      </div>

      {tried && invalid && (
        <Alert variant="danger">
          A mission needs a title and at least one question before it can be published.
        </Alert>
      )}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Title"
            value={draft.title}
            onChange={(e) => patch({ title: e.target.value })}
            error={tried && !draft.title.trim() ? 'Title is required' : undefined}
          />
          <Input
            label="Summary (shown on cards)"
            value={draft.summary}
            onChange={(e) => patch({ summary: e.target.value })}
          />
          <Select
            label="Level"
            value={draft.levelId}
            onChange={(e) => patch({ levelId: e.target.value })}
          >
            {LEVELS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.id} · {l.name}
              </option>
            ))}
          </Select>
          <Input
            label="Module"
            value={draft.module}
            onChange={(e) => patch({ module: e.target.value })}
          />
          <Input
            label="Category"
            value={draft.category}
            onChange={(e) => patch({ category: e.target.value })}
          />
          <Select
            label="Difficulty"
            value={draft.difficulty}
            onChange={(e) => patch({ difficulty: e.target.value as Difficulty })}
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </Select>
          <Input
            label="XP reward"
            type="number"
            value={draft.xp}
            onChange={(e) => patch({ xp: Math.max(0, Number(e.target.value) || 0) })}
          />
          <Input
            label="Estimated minutes"
            type="number"
            value={draft.estMinutes}
            onChange={(e) => patch({ estMinutes: Math.max(1, Number(e.target.value) || 1) })}
          />
          <Input
            label="Dataset IDs (comma separated)"
            list="dataset-ids"
            value={datasetsText}
            onChange={(e) => setDatasetsText(e.target.value)}
            hint={`Available: ${DATASET_IDS.join(', ')}`}
          />
          <datalist id="dataset-ids">
            {DATASET_IDS.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
          <Select
            label="Supporting document"
            value={docsText}
            onChange={(e) => setDocsText(e.target.value)}
          >
            <option value="">None</option>
            {Object.keys(SUPPORTING_DOCS).map((d) => (
              <option key={d} value={d}>
                {SUPPORTING_DOCS[d]!.filename}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {/* Brief */}
      <Card>
        <CardHeader>
          <CardTitle>Scenario & tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            label="Scenario (one paragraph per line)"
            rows={4}
            value={scenarioText}
            onChange={(e) => setScenarioText(e.target.value)}
          />
          <Textarea
            label="Learning objective"
            rows={2}
            value={draft.objective}
            onChange={(e) => patch({ objective: e.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Textarea
              label="Tasks (one per line)"
              rows={5}
              value={tasksText}
              onChange={(e) => setTasksText(e.target.value)}
            />
            <Textarea
              label="Completion criteria (one per line)"
              rows={5}
              value={completionText}
              onChange={(e) => setCompletionText(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Questions ({draft.questions.length})</CardTitle>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              const qid = `${draft.id}-q${draft.questions.length + 1}-${Date.now().toString(36)}`
              patch({
                questions: [
                  ...draft.questions,
                  {
                    id: qid,
                    type: 'mcq',
                    prompt: 'New question',
                    options: [
                      { id: 'a', label: 'Option A' },
                      { id: 'b', label: 'Option B' },
                    ],
                    correctOptionId: 'a',
                    explanation: 'Why the answer is correct.',
                    incorrectFeedback: 'A small hint for a wrong answer.',
                  },
                ],
              })
            }}
          >
            <Plus size={14} /> Add question
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {draft.questions.map((q, qi) => (
            <div key={q.id} className="rounded-xl border border-border p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <GripVertical size={15} className="text-muted-foreground/50" />
                  <span className="text-xs font-semibold text-muted-foreground">
                    QUESTION {qi + 1}
                  </span>
                  <Badge variant="muted">{q.type}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={q.type}
                    onChange={(e) => {
                      const type = e.target.value as QuestionType
                      const base: Partial<Question> = { type }
                      if (type === 'mcq' && !q.options)
                        base.options = [
                          { id: 'a', label: 'Option A' },
                          { id: 'b', label: 'Option B' },
                        ]
                      if (type === 'conclusion' && !q.correctConclusion)
                        base.correctConclusion = 'No exception'
                      patchQuestion(q.id, base)
                    }}
                    className="w-40 py-1.5 text-xs"
                  >
                    <option value="mcq">Multiple choice</option>
                    <option value="formula">Excel formula</option>
                    <option value="numeric">Numeric</option>
                    <option value="text">Text</option>
                    <option value="exception-select">Exception selection</option>
                    <option value="conclusion">Conclusion</option>
                  </Select>
                  <button
                    onClick={() =>
                      patch({ questions: draft.questions.filter((x) => x.id !== q.id) })
                    }
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                    aria-label="Delete question"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <Textarea
                  label="Prompt"
                  rows={2}
                  value={q.prompt}
                  onChange={(e) => patchQuestion(q.id, { prompt: e.target.value })}
                />
                <Input
                  label="Context (optional)"
                  value={q.context ?? ''}
                  onChange={(e) => patchQuestion(q.id, { context: e.target.value })}
                />

                {q.type === 'mcq' && (
                  <div className="space-y-2">
                    <span className="block text-[13px] font-medium">
                      Options — select the correct one
                    </span>
                    {(q.options ?? []).map((opt) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${q.id}`}
                          checked={q.correctOptionId === opt.id}
                          onChange={() => patchQuestion(q.id, { correctOptionId: opt.id })}
                          className="accent-[var(--color-primary)]"
                        />
                        <Input
                          value={opt.label}
                          onChange={(ev) =>
                            patchQuestion(q.id, {
                              options: (q.options ?? []).map((x) =>
                                x.id === opt.id ? { ...x, label: ev.target.value } : x,
                              ),
                            })
                          }
                          className="py-1.5 text-sm"
                        />
                        <button
                          onClick={() =>
                            patchQuestion(q.id, {
                              options: (q.options ?? []).filter((x) => x.id !== opt.id),
                            })
                          }
                          className="rounded-md p-1.5 text-muted-foreground hover:text-danger"
                          aria-label="Remove option"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const nid = `opt${Date.now().toString(36)}`
                        patchQuestion(q.id, {
                          options: [...(q.options ?? []), { id: nid, label: 'New option' }],
                        })
                      }}
                    >
                      <Plus size={13} /> Add option
                    </Button>
                  </div>
                )}

                {q.type === 'numeric' && (
                  <Input
                    label="Expected answer (number)"
                    value={String(q.answer ?? '')}
                    onChange={(e) =>
                      patchQuestion(q.id, {
                        answer: e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                    hint="Dataset-derived answers were resolved to their current value when the editor opened."
                  />
                )}

                {q.type === 'formula' && (
                  <Textarea
                    label="Accepted formulas (one per line — all are accepted)"
                    rows={2}
                    value={(q.accepted ?? (typeof q.answer === 'string' ? [q.answer] : [])).join('\n')}
                    onChange={(e) =>
                      patchQuestion(q.id, { accepted: lines(e.target.value) })
                    }
                  />
                )}

                {q.type === 'text' && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Input
                      label="Required keywords (comma separated)"
                      value={(q.keywords ?? []).join(', ')}
                      onChange={(e) =>
                        patchQuestion(q.id, {
                          keywords: e.target.value
                            .split(',')
                            .map((k) => k.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                    <Input
                      label="Minimum words"
                      type="number"
                      value={q.minWords ?? 8}
                      onChange={(e) =>
                        patchQuestion(q.id, { minWords: Number(e.target.value) || 1 })
                      }
                    />
                    <Input
                      label="Placeholder"
                      value={q.placeholderText ?? ''}
                      onChange={(e) => patchQuestion(q.id, { placeholderText: e.target.value })}
                    />
                  </div>
                )}

                {q.type === 'exception-select' && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Textarea
                      label="Choice IDs (one per line — id | Label)"
                      rows={4}
                      value={(typeof q.choices === 'function' ? q.choices() : q.choices ?? [])
                        .map((c) => `${c.id} | ${c.label}`)
                        .join('\n')}
                      onChange={(e) =>
                        patchQuestion(q.id, {
                          choices: lines(e.target.value).map((line) => {
                            const [cid, label] = line.split('|').map((s) => s.trim())
                            return { id: cid!, label: label || cid! }
                          }),
                        })
                      }
                    />
                    <Textarea
                      label="Correct IDs (one per line)"
                      rows={4}
                      value={idsText(q.correctIds)}
                      onChange={(e) =>
                        patchQuestion(q.id, { correctIds: lines(e.target.value) })
                      }
                    />
                  </div>
                )}

                {q.type === 'conclusion' && (
                  <Select
                    label="Correct conclusion"
                    value={q.correctConclusion ?? ''}
                    onChange={(e) =>
                      patchQuestion(q.id, { correctConclusion: e.target.value as Conclusion })
                    }
                  >
                    <option value="">Select…</option>
                    {CONCLUSIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                )}

                <Textarea
                  label="Explanation (shown when correct)"
                  rows={2}
                  value={q.explanation}
                  onChange={(e) => patchQuestion(q.id, { explanation: e.target.value })}
                />
                <Textarea
                  label="Incorrect feedback (small hint — do not reveal the answer)"
                  rows={2}
                  value={q.incorrectFeedback}
                  onChange={(e) => patchQuestion(q.id, { incorrectFeedback: e.target.value })}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Hints */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Hints ({draft.hints.length})</CardTitle>
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              patch({
                hints: [
                  ...draft.hints,
                  {
                    id: `${draft.id}-h${draft.hints.length + 1}-${Date.now().toString(36)}`,
                    title: 'New hint',
                    body: 'Write a nudge that guides without giving away the answer.',
                    xpCost: 10,
                  },
                ],
              })
            }
          >
            <Plus size={14} /> Add hint
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {draft.hints.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No hints yet — learners will see the challenges cold.
            </p>
          )}
          {draft.hints.map((h) => (
            <div key={h.id} className="rounded-lg border border-border p-3.5">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-2.5">
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    <Input
                      label="Title"
                      value={h.title}
                      onChange={(e) =>
                        patch({
                          hints: draft.hints.map((x) =>
                            x.id === h.id ? { ...x, title: e.target.value } : x,
                          ),
                        })
                      }
                      className="py-1.5 text-sm"
                    />
                    <Input
                      label="XP cost"
                      type="number"
                      value={h.xpCost}
                      onChange={(e) =>
                        patch({
                          hints: draft.hints.map((x) =>
                            x.id === h.id
                              ? { ...x, xpCost: Math.max(0, Number(e.target.value) || 0) }
                              : x,
                          ),
                        })
                      }
                      className="py-1.5 text-sm"
                    />
                    <Select
                      label="Learn-the-concept link"
                      value={h.concept ?? ''}
                      onChange={(e) =>
                        patch({
                          hints: draft.hints.map((x) =>
                            x.id === h.id
                              ? {
                                  ...x,
                                  concept: (e.target.value || undefined) as
                                    | LearnConcept
                                    | undefined,
                                }
                              : x,
                          ),
                        })
                      }
                      className="py-1.5 text-sm"
                    >
                      <option value="">None</option>
                      {LEARN_CONCEPTS.map((c) => (
                        <option key={c} value={c}>
                          {LEARN_LINKS[c].label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Textarea
                    label="Body"
                    rows={2}
                    value={h.body}
                    onChange={(e) =>
                      patch({
                        hints: draft.hints.map((x) =>
                          x.id === h.id ? { ...x, body: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </div>
                <button
                  onClick={() => patch({ hints: draft.hints.filter((x) => x.id !== h.id) })}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                  aria-label="Delete hint"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => navigate('/admin/missions')}>
          Cancel
        </Button>
        <Button onClick={save}>
          <Save size={15} /> Save mission
        </Button>
      </div>
    </div>
  )
}

