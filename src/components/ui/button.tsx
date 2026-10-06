import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'xp'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  children?: ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-foreground hover:brightness-110 active:brightness-95 shadow-[0_1px_2px_rgba(0,0,0,0.25)]',
  secondary:
    'bg-accent text-accent-foreground hover:bg-muted border border-border',
  ghost: 'hover:bg-accent text-foreground/85 hover:text-foreground',
  outline:
    'border border-border bg-transparent hover:bg-accent text-foreground/85 hover:text-foreground',
  danger: 'bg-danger text-white hover:brightness-110',
  xp: 'bg-xp text-black hover:brightness-110 font-semibold',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-9.5 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-[15px] gap-2',
  icon: 'h-9 w-9 p-0',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 select-none',
        'disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap',
        'focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      )}
      {children}
    </button>
  )
}
