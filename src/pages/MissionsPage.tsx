import { useMemo, useState } from 'react'
import { Filter, ListChecks, Search } from 'lucide-react'
import { useProgress } from '../hooks/useProgress'
import { MissionCard } from '../components/mission/MissionCard'
import { Input } from '../components/ui/forms'
import { cn } from '../lib/utils'
import { Button } from '../components/ui/button'
import { EmptyState } from '../components/ui/overlays'
import { missionStatus } from '../data/missions'
import type { Difficulty } from '../lib/types'

const FILTERS = ['All', 'Available', 'Completed', 'Locked'] as const
const DIFFICULTIES: (Difficulty | 'All')[] = ['All', 'Beginner', 'Intermediate', 'Advanced']

export function MissionsPage() {
  const { missions, completed, started } = useProgress()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<(typeof FILTERS)[number]>('All')
  const [difficulty, setDifficulty] = useState<Difficulty | 'All'>('All')

  const filtered = useMemo(() => {
    return missions.filter((m) => {
      const status = missionStatus(m.id, completed, started)
      if (
        query &&
        !`${m.title} ${m.category} ${m.summary}`.toLowerCase().includes(query.toLowerCase())
      )
        return false
      if (statusFilter === 'Available' && !(status === 'available' || status === 'in-progress'))
        return false
      if (statusFilter === 'Completed' && status !== 'completed') return false
      if (statusFilter === 'Locked' && status !== 'locked') return false
      if (difficulty !== 'All' && m.difficulty !== difficulty) return false
      return true
    })
  }, [missions, completed, started, query, statusFilter, difficulty])

  const counts = {
    All: missions.length,
    Available: missions.filter((m) => {
      const s = missionStatus(m.id, completed, started)
      return s === 'available' || s === 'in-progress'
    }).length,
    Completed: missions.filter((m) => completed.has(m.id)).length,
    Locked: missions.filter((m) => missionStatus(m.id, completed, started) === 'locked').length,
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Missions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Practical audit challenges — download the dataset, work it in Excel, submit your
          result.
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search missions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            aria-label="Search missions"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors',
                statusFilter === f
                  ? 'bg-primary-soft text-primary-soft-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {f}
              <span className="ml-1.5 text-[11px] opacity-70">{counts[f]}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 sm:ml-auto">
          <Filter size={13} className="text-muted-foreground" />
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={cn(
                'rounded-lg px-2.5 py-1.5 text-[13px] transition-colors',
                difficulty === d
                  ? 'bg-accent font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ListChecks size={34} />}
          title="No missions match"
          description="Try a different search term or clear the filters."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery('')
                setStatusFilter('All')
                setDifficulty('All')
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <MissionCard
              key={m.id}
              mission={m}
              status={missionStatus(m.id, completed, started)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
