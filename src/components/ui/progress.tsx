import { cn } from '../../lib/utils'

interface ProgressProps {
  value: number
  className?: string
  /** bar color classes, e.g. 'bg-primary' */
  barClassName?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Progress({ value, className, barClassName, size = 'md' }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-3.5' }
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('w-full overflow-hidden rounded-full bg-muted', heights[size], className)}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-700 ease-out',
          barClassName ?? 'bg-primary',
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
