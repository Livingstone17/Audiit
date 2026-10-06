import { useMemo, useState } from 'react'
import { Search, TicketCheck } from 'lucide-react'
import { useAppStore } from '../../store/app'
import { allMissions } from '../../store/app'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/forms'
import { EmptyState } from '../../components/ui/overlays'
import { formatDateTime } from '../../lib/utils'

export function AdminSubmissions() {
  const submissions = useAppStore((s) => s.submissions)
  const user = useAppStore((s) => s.user)
  const [query, setQuery] = useState('')
  const missions = allMissions()

  const rows = useMemo(() => {
    return [...submissions]
      .reverse()
      .filter((s) => {
        if (!query) return true
        const m = missions.find((x) => x.id === s.missionId)
        const q = m?.questions.find((x) => x.id === s.questionId)
        return `${m?.title ?? ''} ${q?.prompt ?? ''} ${s.answer}`
          .toLowerCase()
          .includes(query.toLowerCase())
      })
      .map((s) => {
        const m = missions.find((x) => x.id === s.missionId)
        const q = m?.questions.find((x) => x.id === s.questionId)
        return {
          ...s,
          missionTitle: m?.title ?? s.missionId,
          questionPrompt: q?.prompt ?? s.questionId,
        }
      })
  }, [submissions, query, missions])

  const correct = submissions.filter((s) => s.correct).length

  if (submissions.length === 0) {
    return (
      <EmptyState
        icon={<TicketCheck size={34} />}
        title="No submissions yet"
        description="When a learner answers a challenge, every attempt appears here with the answer given."
      />
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Learner', value: user?.name ?? '—' },
          { label: 'Total submissions', value: submissions.length },
          { label: 'Correct', value: correct },
          {
            label: 'First-attempt success',
            value: `${submissions.length ? Math.round((correct / submissions.length) * 100) : 0}%`,
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="mt-1 truncate text-xl font-semibold tracking-tight">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Learner submissions</CardTitle>
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search submissions…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8"
              aria-label="Search submissions"
            />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-2.5 font-semibold">When</th>
                <th className="px-3 py-2.5 font-semibold">Mission</th>
                <th className="px-3 py-2.5 font-semibold">Question</th>
                <th className="px-3 py-2.5 font-semibold">Answer given</th>
                <th className="px-5 py-2.5 font-semibold">Result</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 200).map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 align-top">
                  <td className="whitespace-nowrap px-5 py-2.5 text-xs text-muted-foreground">
                    {formatDateTime(s.at)}
                  </td>
                  <td className="px-3 py-2.5 text-[13px]">{s.missionTitle}</td>
                  <td className="max-w-64 px-3 py-2.5 text-[13px] text-muted-foreground">
                    <span className="line-clamp-2">{s.questionPrompt}</span>
                  </td>
                  <td className="max-w-56 px-3 py-2.5 font-mono text-xs">
                    <span className="line-clamp-2 break-all">{s.answer || '—'}</span>
                  </td>
                  <td className="px-5 py-2.5">
                    <Badge variant={s.correct ? 'success' : 'danger'}>
                      {s.correct ? 'Correct' : 'Incorrect'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
