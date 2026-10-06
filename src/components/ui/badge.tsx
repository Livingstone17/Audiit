import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'
import type { Difficulty } from '../../lib/types'

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'xp' | 'muted'

const variants: Record<Variant, string> = {
  default: 'bg-primary-soft text-primary-soft-foreground border-transparent',
  success: 'bg-success-soft text-success border-transparent',
  warning: 'bg-warning-soft text-warning border-transparent',
  danger: 'bg-danger-soft text-danger border-transparent',
  info: 'bg-info-soft text-info border-transparent',
  outline: 'border border-border text-foreground/80 bg-transparent',
  xp: 'bg-xp/15 text-xp border-transparent font-semibold',
  muted: 'bg-muted text-muted-foreground border-transparent',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant
  children?: ReactNode
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

const difficultyStyles: Record<Difficulty, { variant: Variant; dot: string }> = {
  Beginner: { variant: 'success', dot: 'bg-success' },
  Intermediate: { variant: 'warning', dot: 'bg-warning' },
  Advanced: { variant: 'danger', dot: 'bg-danger' },
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const s = difficultyStyles[difficulty]
  return (
    <Badge variant={s.variant}>
      <span className={cn('size-1.5 rounded-full', s.dot)} />
      {difficulty}
    </Badge>
  )
}
