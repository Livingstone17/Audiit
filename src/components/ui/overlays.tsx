import { useEffect, type ReactNode } from 'react'
import { cn } from '../../lib/utils'

export function Tabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { id: string; label: ReactNode; badge?: ReactNode }[]
  value: string
  onChange: (id: string) => void
  className?: string
}) {
  return (
    <div className={cn('flex gap-1 overflow-x-auto scrollbar-none border-b border-border', className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'relative flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2.5 text-sm font-medium transition-colors',
            value === t.id
              ? 'text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {t.label}
          {t.badge}
        </button>
      ))}
    </div>
  )
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children?: ReactNode
  maxWidth?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative w-full rounded-2xl border border-border bg-popover p-5 shadow-2xl animate-scale-in max-h-[85vh] overflow-y-auto',
          maxWidth,
        )}
      >
        {title && <h2 className="text-lg font-semibold tracking-tight">{title}</h2>}
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        <div className={cn(title && 'mt-4')}>{children}</div>
      </div>
    </div>
  )
}

export function Alert({
  variant = 'info',
  title,
  children,
  className,
}: {
  variant?: 'info' | 'success' | 'warning' | 'danger'
  title?: ReactNode
  children?: ReactNode
  className?: string
}) {
  const styles = {
    info: 'bg-info-soft text-info border-info/25',
    success: 'bg-success-soft text-success border-success/25',
    warning: 'bg-warning-soft text-warning border-warning/25',
    danger: 'bg-danger-soft text-danger border-danger/25',
  }
  return (
    <div className={cn('rounded-lg border px-4 py-3 text-sm', styles[variant], className)}>
      {title && <div className="font-semibold mb-0.5">{title}</div>}
      <div className="[&_span]:text-current opacity-95">{children}</div>
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-12 text-center animate-fade-in">
      {icon && <div className="mb-3 text-muted-foreground/60">{icon}</div>}
      <h3 className="text-[15px] font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 max-w-md text-[13px] text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
