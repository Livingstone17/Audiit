import { useState } from 'react'
import { AlertTriangle, ClipboardCheck, FileWarning, Plus, Trash2 } from 'lucide-react'
import { useAppStore } from '../../store/app'
import { useToasts } from '../../store/toasts'
import { Button } from '../ui/button'
import { Input, Textarea } from '../ui/forms'
import { Badge } from '../ui/badge'
import { Dialog, EmptyState } from '../ui/overlays'
import type { AuditFindingDraft } from '../../lib/types'

const BLANK = {
  title: '',
  condition: '',
  criteria: '',
  cause: '',
  effect: '',
  recommendation: '',
  response: '',
  owner: '',
  dueDate: '',
}

type Draft = typeof BLANK

const FIELDS: { key: keyof Draft; label: string; hint: string; long?: boolean }[] = [
  { key: 'condition', label: 'Condition', hint: 'What did you find? Facts, counts, values.', long: true },
  { key: 'criteria', label: 'Criteria', hint: 'What policy, control or expected condition applies?', long: true },
  { key: 'cause', label: 'Cause', hint: 'Why might the issue have occurred?', long: true },
  { key: 'effect', label: 'Effect / Risk', hint: 'What could be the consequence?', long: true },
  { key: 'recommendation', label: 'Recommendation', hint: 'What should management do?', long: true },
  { key: 'response', label: 'Management Response', hint: 'What did management say? (optional)' },
  { key: 'owner', label: 'Responsible Owner', hint: 'e.g. Head of Procurement' },
  { key: 'dueDate', label: 'Due Date', hint: 'YYYY-MM-DD' },
]

export function FindingsSection({
  missionId,
  minRequired = 3,
}: {
  missionId: string
  minRequired?: number
}) {
  const findings = useAppStore((s) => s.findings).filter((f) => f.missionId === missionId)
  const addFinding = useAppStore((s) => s.addFinding)
  const removeFinding = useAppStore((s) => s.removeFinding)
  const push = useToasts((s) => s.push)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(BLANK)
  const [tried, setTried] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<AuditFindingDraft | null>(null)

  const requiredKeys = ['title', 'condition', 'criteria', 'cause', 'effect', 'recommendation'] as const
  const missing = requiredKeys.filter((k) => !draft[k].trim())
  const valid = missing.length === 0

  const save = () => {
    setTried(true)
    if (!valid) return
    addFinding({ missionId, ...draft })
    setDraft(BLANK)
    setTried(false)
    setOpen(false)
    push({ variant: 'success', title: 'Finding saved', description: draft.title })
  }

  const complete = findings.length >= minRequired

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <ClipboardCheck size={16} className="text-primary" />
          <span className="text-sm font-semibold">Audit Findings</span>
          <Badge variant={complete ? 'success' : 'muted'}>
            {findings.length}/{minRequired} documented
          </Badge>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus size={14} /> New finding
        </Button>
      </div>

      <div className="p-4">
        {findings.length === 0 ? (
          <EmptyState
            icon={<FileWarning size={30} />}
            title="No findings documented yet"
            description={`Document at least ${minRequired} findings using the CCCCAR template: Condition, Criteria, Cause, Effect and Recommendation.`}
            action={
              <Button onClick={() => setOpen(true)}>
                <Plus size={15} /> Create your first finding
              </Button>
            }
          />
        ) : (
          <ul className="space-y-2.5">
            {findings.map((f, i) => (
              <li
                key={f.id}
                className="rounded-lg border border-border bg-background/50 p-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="warning">F{i + 1}</Badge>
                      <span className="text-sm font-semibold">{f.title}</span>
                    </div>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                      <span className="font-medium text-foreground/80">Condition: </span>
                      {f.condition}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                      <span className="font-medium text-foreground/80">Criteria: </span>
                      {f.criteria}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                      <span className="font-medium text-foreground/80">Recommendation: </span>
                      {f.recommendation}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {f.owner && <Badge variant="muted">Owner: {f.owner}</Badge>}
                      {f.dueDate && <Badge variant="muted">Due: {f.dueDate}</Badge>}
                    </div>
                  </div>
                  <button
                    onClick={() => setPendingDelete(f)}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger"
                    aria-label="Delete finding"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Document an audit finding"
        description="Structure matters — each element makes the finding actionable."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-3.5">
          <Input
            label="Finding Title"
            placeholder="e.g. Invoices paid without goods received notes"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            error={tried && !draft.title.trim() ? 'Title is required' : undefined}
          />

          {FIELDS.map((field) =>
            field.long ? (
              <Textarea
                key={field.key}
                label={field.label}
                hint={field.hint}
                rows={2}
                value={draft[field.key]}
                onChange={(e) => setDraft({ ...draft, [field.key]: e.target.value })}
                error={
                  tried && requiredKeys.includes(field.key as never) && !draft[field.key].trim()
                    ? 'This element is required for a complete finding'
                    : undefined
                }
              />
            ) : (
              <Input
                key={field.key}
                label={field.label}
                hint={field.hint}
                value={draft[field.key]}
                onChange={(e) => setDraft({ ...draft, [field.key]: e.target.value })}
              />
            ),
          )}

          {tried && !valid && (
            <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft px-3.5 py-2.5 text-[13px] text-warning">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              Complete all five CCCCAR elements — an incomplete finding cannot be reviewed.
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save finding</Button>
          </div>
          <p className="text-right text-[11px] text-muted-foreground">
            Your draft is kept on this page until you save it
          </p>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Delete this finding?"
        description={`“${pendingDelete?.title ?? ''}” will be removed. This cannot be undone.`}
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setPendingDelete(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (pendingDelete) removeFinding(pendingDelete.id)
              setPendingDelete(null)
              push({ variant: 'default', title: 'Finding deleted' })
            }}
          >
            Delete finding
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
