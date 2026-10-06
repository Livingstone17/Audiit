import { Link } from 'react-router-dom'
import { CheckCircle2, Clock, Lock, Zap } from 'lucide-react'
import type { Mission, MissionStatus } from '../../lib/types'
import { Badge, DifficultyBadge } from '../ui/badge'
import { cn } from '../../lib/utils'

interface Props {
  mission: Mission
  status: MissionStatus
  compact?: boolean
}

export function MissionCard({ mission, status, compact }: Props) {
  const locked = status === 'locked'
  const completed = status === 'completed'
  const inProgress = status === 'in-progress'

  const body = (
    <div
      className={cn(
        'group relative flex h-full flex-col rounded-xl border bg-card p-4 transition-all duration-200',
        locked
          ? 'border-border opacity-60'
          : completed
            ? 'border-success/35 hover:border-success/60'
            : 'border-border hover:border-primary/55 hover:-translate-y-0.5 hover:shadow-lg',
        inProgress && 'border-primary/45',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            'font-mono text-[11px] font-semibold tracking-wider',
            completed ? 'text-success' : locked ? 'text-muted-foreground' : 'text-primary',
          )}
        >
          MISSION {String(mission.number).padStart(2, '0')}
        </span>
        {completed ? (
          <CheckCircle2 size={17} className="text-success" />
        ) : locked ? (
          <Lock size={15} className="text-muted-foreground" />
        ) : (
          <Zap
            size={15}
            className={cn(inProgress ? 'text-primary' : 'text-muted-foreground/50 group-hover:text-primary')}
          />
        )}
      </div>

      <h3 className="mt-1.5 text-[15px] font-semibold leading-snug tracking-tight">
        {mission.title}
      </h3>
      {!compact && (
        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {mission.summary}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <DifficultyBadge difficulty={mission.difficulty} />
        <Badge variant="xp">
          <Zap size={10} /> +{mission.xp} XP
        </Badge>
        <Badge variant="muted">
          <Clock size={10} /> {mission.estMinutes} min
        </Badge>
        {inProgress && <Badge variant="info">In progress</Badge>}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs">
        <span className="text-muted-foreground">{mission.category}</span>
        <span
          className={cn(
            'font-medium transition-colors',
            locked
              ? 'text-muted-foreground'
              : completed
                ? 'text-success'
                : 'text-primary opacity-0 group-hover:opacity-100',
          )}
        >
          {locked
            ? 'Locked'
            : completed
              ? 'Completed'
              : inProgress
                ? 'Resume →'
                : 'Start →'}
        </span>
      </div>
    </div>
  )

  if (locked) return <div className="h-full cursor-not-allowed">{body}</div>
  return (
    <Link to={`/missions/${mission.id}`} className="block h-full">
      {body}
    </Link>
  )
}
