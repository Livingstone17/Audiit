import { useId } from 'react'
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { cn } from '../../lib/utils'

export function Label({
  className,
  children,
  htmlFor,
}: {
  className?: string
  children: ReactNode
  htmlFor?: string
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('mb-1.5 block text-[13px] font-medium text-foreground/90', className)}
    >
      {children}
    </label>
  )
}

const fieldClass =
  'w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25 disabled:opacity-50'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: ReactNode
}

export function Input({ label, error, hint, className, id, icon, ...props }: InputProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <div className="w-full">
      {label && <Label htmlFor={fieldId}>{label}</Label>}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
        )}
        <input
          id={fieldId}
          className={cn(fieldClass, icon && 'pl-10', error && 'border-danger', className)}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export function Textarea({ label, error, hint, className, id, ...props }: TextareaProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <div className="w-full">
      {label && <Label htmlFor={fieldId}>{label}</Label>}
      <textarea
        id={fieldId}
        className={cn(fieldClass, 'min-h-24 resize-y leading-relaxed', error && 'border-danger', className)}
        {...props}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export function Select({ label, error, className, id, children, ...props }: SelectProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <div className="w-full">
      {label && <Label htmlFor={fieldId}>{label}</Label>}
      <select
        id={fieldId}
        className={cn(fieldClass, 'appearance-none bg-no-repeat pr-9', error && 'border-danger', className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23888' stroke-linecap='round' stroke-linejoin='round' stroke-width='2'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E\")",
          backgroundPosition: 'right 0.7rem center',
        }}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  )
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-muted border border-border',
      )}
    >
      <span
        className={cn(
          'inline-block size-4.5 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  )
}
