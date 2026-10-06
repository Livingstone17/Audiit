import { BookOpen, HelpCircle, Lightbulb, PlayCircle, Unlock } from 'lucide-react'
import type { Hint } from '../../lib/types'
import { useAppStore } from '../../store/app'
import { LEARN_LINKS } from '../../data/learnLinks'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'

const NO_HINTS: string[] = []

export function HintPanel({ missionId, hints }: { missionId: string; hints: Hint[] }) {
  const revealHint = useAppStore((s) => s.useHint)
  const revealed = useAppStore((s) => s.records[missionId]?.revealedHints) ?? NO_HINTS

  if (hints.length === 0) return null

  const used = hints.filter((h) => revealed.includes(h.id)).length

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Lightbulb size={15} className="text-xp" />
          Hints
        </div>
        <Badge variant="muted">
          {used}/{hints.length} used
        </Badge>
      </div>

      <div className="space-y-2.5 p-3.5">
        {hints.map((hint, i) => {
          const isOpen = revealed.includes(hint.id)
          const learn = hint.concept ? LEARN_LINKS[hint.concept] : undefined
          return (
            <div
              key={hint.id}
              className={cn(
                'rounded-lg border p-3 transition-all',
                isOpen ? 'border-xp/35 bg-xp/5' : 'border-border bg-background/40',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-medium">
                  Hint {i + 1}: {hint.title}
                </span>
                {!isOpen && (
                  <button
                    onClick={() => revealHint(missionId, hint.xpCost, hint.id)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-xp/50 hover:text-xp"
                  >
                    <Unlock size={11} /> Reveal · −{hint.xpCost} XP
                  </button>
                )}
              </div>
              {isOpen ? (
                <>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                    {hint.body}
                  </p>
                  {learn && (
                    <a
                      href={learn.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-start gap-1.5 rounded-md border border-primary/30 bg-primary-soft/40 px-2.5 py-2 text-[12px] font-medium text-primary-soft-foreground transition-colors hover:bg-primary-soft"
                    >
                      {learn.kind === 'video' ? (
                        <PlayCircle size={14} className="mt-px shrink-0 text-primary" />
                      ) : (
                        <BookOpen size={14} className="mt-px shrink-0 text-primary" />
                      )}
                      <span>
                        Are you new to {learn.label}?{' '}
                        <span className="underline underline-offset-2">
                          Click here to learn the concept
                        </span>
                        .
                      </span>
                    </a>
                  )}
                </>
              ) : (
                <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-muted-foreground/70">
                  <HelpCircle size={12} /> Try first — hints cost mission XP.
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
