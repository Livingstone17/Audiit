import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAppStore } from '../../store/app'
import { allMissions } from '../../store/app'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Progress } from '../../components/ui/progress'
import { EmptyState } from '../../components/ui/overlays'
import { SectionHeading } from '../../components/brand'
import { Badge } from '../../components/ui/badge'
import { BarChart3 } from 'lucide-react'

export function AdminAnalytics() {
  const events = useAppStore((s) => s.events)
  const records = useAppStore((s) => s.records)
  const submissions = useAppStore((s) => s.submissions)
  const missions = allMissions()

  const missionStats = useMemo(() => {
    return missions.map((m) => {
      const started = records[m.id] ? 1 : 0
      const completed = records[m.id]?.status === 'completed' ? 1 : 0
      const qs = submissions.filter((s) => s.missionId === m.id)
      const correct = qs.filter((s) => s.correct).length
      const hints = events.filter(
        (e) => e.type === 'hint_requested' && e.missionId === m.id,
      ).length
      return {
        id: m.id,
        title: m.title,
        number: m.number,
        started,
        completed,
        attempts: qs.length,
        successRate: qs.length ? Math.round((correct / qs.length) * 100) : null,
        hints,
      }
    })
  }, [missions, records, submissions, events])

  const chartData = missionStats.map((s) => ({
    name: `M${String(s.number).padStart(2, '0')}`,
    attempts: s.attempts,
    hints: s.hints,
    success: s.successRate ?? 0,
  }))

  const totalStarted = Object.keys(records).length
  const totalCompleted = missionStats.filter((s) => s.completed).length
  const dropOffs = missionStats.filter((s) => s.started && !s.completed)
  const hintEvents = events.filter((e) => e.type === 'hint_requested')
  const topHintMission = [...missionStats].sort((a, b) => b.hints - a.hints)[0]
  const totalAttempts = submissions.length
  const correctAttempts = submissions.filter((s) => s.correct).length
  const avgSuccess = totalAttempts
    ? Math.round((correctAttempts / totalAttempts) * 100)
    : 0

  if (totalStarted === 0 && totalAttempts === 0) {
    return (
      <EmptyState
        icon={<BarChart3 size={34} />}
        title="No learner data yet"
        description="Analytics populate as learners start missions, request hints and submit answers."
      />
    )
  }

  const tooltipStyle = {
    background: 'var(--color-popover)',
    border: '1px solid var(--color-border)',
    borderRadius: 10,
    fontSize: 12,
    color: 'var(--color-popover-foreground)',
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionHeading
        title="Content performance"
        subtitle="How learners interact with your mission library"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Missions started', value: totalStarted },
          { label: 'Missions completed', value: totalCompleted },
          { label: 'Submission success', value: `${avgSuccess}%` },
          { label: 'Hints requested', value: hintEvents.length },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="mt-1 text-2xl font-semibold tracking-tight">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attempts per mission</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }} />
                <Bar dataKey="attempts" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submission success rate by mission</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }} />
                <Bar dataKey="success" radius={[4, 4, 0, 0]}>
                  {chartData.map((d) => (
                    <Cell
                      key={d.name}
                      fill={
                        d.success >= 80
                          ? 'var(--color-success)'
                          : d.success >= 50
                            ? 'var(--color-warning)'
                            : 'var(--color-danger)'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Drop-off points */}
        <Card>
          <CardHeader>
            <CardTitle>Drop-off points</CardTitle>
          </CardHeader>
          <CardContent>
            {dropOffs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No abandoned missions — every started mission has been completed. Nice.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {dropOffs.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning-soft/50 px-3 py-2 text-sm"
                  >
                    <span>
                      <span className="font-mono text-xs text-muted-foreground">
                        M{String(s.number).padStart(2, '0')}
                      </span>{' '}
                      {s.title}
                    </span>
                    <Badge variant="warning">Started · not completed</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Hint usage */}
        <Card>
          <CardHeader>
            <CardTitle>Most frequently used hints</CardTitle>
          </CardHeader>
          <CardContent>
            {hintEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hints requested yet.</p>
            ) : (
              <div className="space-y-3">
                {missionStats
                  .filter((s) => s.hints > 0)
                  .sort((a, b) => b.hints - a.hints)
                  .slice(0, 5)
                  .map((s) => (
                    <div key={s.id}>
                      <div className="mb-1 flex justify-between text-[13px]">
                        <span className="truncate">{s.title}</span>
                        <span className="text-muted-foreground">{s.hints} reveals</span>
                      </div>
                      <Progress
                        value={
                          topHintMission ? (s.hints / topHintMission.hints) * 100 : 0
                        }
                        size="sm"
                        barClassName="bg-warning"
                      />
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mission success table */}
      <Card>
        <CardHeader>
          <CardTitle>Challenge success rates</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-2.5 font-semibold">Mission</th>
                <th className="px-3 py-2.5 font-semibold">Started</th>
                <th className="px-3 py-2.5 font-semibold">Completed</th>
                <th className="px-3 py-2.5 font-semibold">Attempts</th>
                <th className="px-3 py-2.5 font-semibold">Success rate</th>
                <th className="px-5 py-2.5 font-semibold">Hints</th>
              </tr>
            </thead>
            <tbody>
              {missionStats.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-2.5">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      M{String(s.number).padStart(2, '0')}
                    </span>{' '}
                    {s.title}
                  </td>
                  <td className="px-3 py-2.5">{s.started ? 'Yes' : '—'}</td>
                  <td className="px-3 py-2.5">{s.completed ? 'Yes' : '—'}</td>
                  <td className="px-3 py-2.5">{s.attempts}</td>
                  <td className="px-3 py-2.5">
                    {s.successRate === null ? (
                      '—'
                    ) : (
                      <span
                        className={
                          s.successRate >= 80
                            ? 'text-success'
                            : s.successRate >= 50
                              ? 'text-warning'
                              : 'text-danger'
                        }
                      >
                        {s.successRate}%
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-2.5">{s.hints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
