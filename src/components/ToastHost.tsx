import { Award, BadgeCheck, Sparkles, X } from 'lucide-react'
import { useToasts } from '../store/toasts'
import { cn } from '../lib/utils'

export function ToastHost() {
  const { toasts, dismiss } = useToasts()

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(92vw,380px)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-start gap-3 rounded-xl border bg-popover p-3.5 shadow-xl animate-slide-up',
            t.variant === 'achievement'
              ? 'border-xp/40'
              : t.variant === 'success'
                ? 'border-success/40'
                : t.variant === 'xp'
                  ? 'border-primary/40'
                  : 'border-border',
          )}
        >
          <span
            className={cn(
              'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg',
              t.variant === 'achievement'
                ? 'bg-xp/20 text-xp'
                : t.variant === 'success'
                  ? 'bg-success-soft text-success'
                  : t.variant === 'xp'
                    ? 'bg-primary-soft text-primary-soft-foreground'
                    : 'bg-muted text-muted-foreground',
            )}
          >
            {t.variant === 'achievement' ? (
              <Award size={17} />
            ) : t.variant === 'xp' ? (
              <Sparkles size={17} />
            ) : (
              <BadgeCheck size={17} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">{t.title}</div>
            {t.description && (
              <div className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
                {t.description}
              </div>
            )}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  )
}
