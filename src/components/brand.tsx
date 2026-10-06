import type { ReactNode } from 'react'
import { Briefcase, Copy, Crown, Eye, Flag, Search, Scale, type LucideIcon } from 'lucide-react'
import { cn, hashString, initials } from '../lib/utils'

export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="10" fill="url(#al-grad)" />
      <path
        d="M14 11h12M17 11v5.2c0 1.1-.45 2.15-1.24 2.9L12.6 23.1A4.03 4.03 0 0 0 11.4 25.5c0 2.2 1.8 4 4 4h9.2c2.2 0 4-1.8 4-4 0-1.06-.42-2.08-1.17-2.84l-3.19-3.19A4.03 4.03 0 0 1 23 16.2V11"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 25.5l2.6 2.6 5.4-5.4"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="al-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10b981" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function Wordmark({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' }) {
  return (
    <span className={cn('flex items-center gap-2.5 select-none', className)}>
      <LogoMark size={size === 'sm' ? 26 : 30} />
      <span
        className={cn(
          'font-semibold tracking-tight text-foreground',
          size === 'sm' ? 'text-[15px]' : 'text-[17px]',
        )}
      >
        Audit<span className="text-primary">Lab</span>
      </span>
    </span>
  )
}

export function Avatar({
  name,
  hue,
  size = 36,
  className,
}: {
  name: string
  hue?: number
  size?: number
  className?: string
}) {
  const h = hue ?? hashString(name) % 360
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-1 ring-black/10',
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(135deg, hsl(${h} 65% 45%), hsl(${(h + 40) % 360} 65% 35%))`,
      }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}

const ICONS: Record<string, LucideIcon> = {
  flag: Flag,
  search: Search,
  copy: Copy,
  scale: Scale,
  eye: Eye,
  briefcase: Briefcase,
  crown: Crown,
}

export function AchievementIcon({ icon, size = 22 }: { icon: string; size?: number }) {
  const Icon = ICONS[icon] ?? AwardFallback
  return <Icon size={size} strokeWidth={2} />
}

function AwardFallback({ size = 22 }: { size?: number }) {
  return <Flag size={size} strokeWidth={2} />
}

/** Small circular status dot used across lists. */
export function StatusDot({ color, className }: { color: string; className?: string }) {
  return <span className={cn('inline-block size-2 rounded-full', color, className)} />
}

export function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[13px] text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
