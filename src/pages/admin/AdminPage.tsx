import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  FilePen,
  LayoutGrid,
  Plus,
  ShieldCheck,
  TicketCheck,
} from 'lucide-react'
import { useAppStore, allMissions } from '../../store/app'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { EmptyState } from '../../components/ui/overlays'
import { SectionHeading } from '../../components/brand'
import { AdminAnalytics } from './AdminAnalytics'
import { AdminSubmissions } from './AdminSubmissions'
import { AdminMissions, MissionEditor } from './AdminMissions'
import { cn, timeAgo } from '../../lib/utils'
import { PEERS } from '../../data/leaderboard'

const TABS = [
  { to: '/admin', label: 'Overview', icon: LayoutGrid, exact: true },
  { to: '/admin/missions', label: 'Missions', icon: FilePen },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/submissions', label: 'Submissions', icon: TicketCheck },
]

export function AdminPage() {
  const user = useAppStore((s) => s.user)
  const updateUser = useAppStore((s) => s.updateUser)
  const records = useAppStore((s) => s.records)
  const submissions = useAppStore((s) => s.submissions)
  const events = useAppStore((s) => s.events)
  const location = useLocation()
  const navigate = useNavigate()
  const missions = allMissions()

  if (user?.role !== 'admin') {
    return (
      <EmptyState
        icon={<ShieldCheck size={34} />}
        title="Administrator access required"
        description="The admin area manages mission content and learner analytics. Enable admin access from your profile to explore it in this demo."
        action={
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (user) updateUser({ role: 'admin' })
                navigate('/admin')
              }}
            >
              Enable admin access
            </Button>
            <Link to="/profile">
              <Button variant="secondary">Go to profile</Button>
            </Link>
          </div>
        }
      />
    )
  }

  const completedCount = Object.values(records).filter((r) => r.status === 'completed').length
  const startedCount = Object.keys(records).length
  const recentEvents = [...events].reverse().slice(0, 8)

  const createMission = () => {
    const maxNum = missions.reduce((n, m) => Math.max(n, m.number), 0)
    const id = `custom-${Date.now().toString(36)}`
    const draft = {
      id,
      number: maxNum + 1,
      levelId: 'L1',
      module: 'Custom content',
      category: 'Excel Foundations',
      title: 'Untitled mission',
      difficulty: 'Beginner' as const,
      xp: 100,
      estMinutes: 10,
      summary: 'Describe this mission in one sentence.',
      scenario: ['Write the audit scenario here.'],
      objective: 'State what the learner must accomplish.',
      tasks: ['Download the dataset', 'Complete the test', 'Submit your answer'],
      datasetIds: [],
      hints: [],
      questions: [
        {
          id: `${id}-q1`,
          type: 'mcq' as const,
          prompt: 'Write your first question.',
          options: [
            { id: 'a', label: 'Option A' },
            { id: 'b', label: 'Option B' },
          ],
          correctOptionId: 'a',
          explanation: 'Explain why the correct answer is correct.',
          incorrectFeedback: 'Give a smaller hint without revealing the answer.',
        },
      ],
      completion: ['All questions answered correctly'],
    }
    useAppStore.getState().upsertAdminMission(draft)
    navigate(`/admin/missions/${id}`)
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the content library and monitor learner performance.
          </p>
        </div>
        <Button onClick={createMission}>
          <Plus size={15} /> New mission
        </Button>
      </div>

      {/* Sub navigation */}
      <div className="mb-6 flex gap-1 overflow-x-auto scrollbar-none border-b border-border">
        {TABS.map((t) => {
          const active = t.exact
            ? location.pathname === t.to
            : location.pathname.startsWith(t.to)
          return (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary'
                  : 'text-muted-foreground hover:text-foreground',
                'relative',
              )}
            >
              <t.icon size={15} /> {t.label}
            </Link>
          )
        })}
      </div>

      <Routes>
        <Route index element={<Overview missions={missions.length} started={startedCount} completed={completedCount} submissions={submissions.length} recent={recentEvents} />} />
        <Route path="missions" element={<AdminMissions />} />
        <Route path="missions/:id" element={<MissionEditor />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="submissions" element={<AdminSubmissions />} />
        <Route path="*" element={<EmptyState title="Not found" description="Unknown admin page." />} />
      </Routes>
    </div>
  )
}

function Overview({
  missions,
  started,
  completed,
  submissions,
  recent,
}: {
  missions: number
  started: number
  completed: number
  submissions: number
  recent: { id: string; type: string; at: string; missionId?: string; value?: number }[]
}) {
  const learnerCount = PEERS.length + 1
  const completionRate = started ? Math.round((completed / started) * 100) : 0

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Learners', value: learnerCount },
          { label: 'Missions in library', value: missions },
          { label: 'Mission completion rate', value: `${completionRate}%` },
          { label: 'Submissions logged', value: submissions },
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
            <CardTitle>Recent learner activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No events captured yet. Activity appears here as missions are attempted.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {recent.map((e) => (
                  <li key={e.id} className="flex items-center justify-between text-sm">
                    <span className="capitalize">
                      {e.type.replace(/_/g, ' ')}
                      {e.value ? ` · ${e.value}` : ''}
                    </span>
                    <span className="text-xs text-muted-foreground">{timeAgo(e.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content library health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <HealthRow label="Missions published" value={`${missions} / 24 planned`} />
            <HealthRow label="Learners with progress" value={started > 0 ? 'Yes' : 'No activity yet'} />
            <HealthRow label="Challenge attempts" value={submissions} />
            <div className="rounded-lg border border-border bg-background/50 p-3 text-xs text-muted-foreground">
              Tip: the content library is the long-term product asset. Use{' '}
              <span className="font-medium text-foreground">Missions → Edit</span> to
              adjust scenarios, XP, questions and hints without a deploy.
            </div>
          </CardContent>
        </Card>
      </div>

      <SectionHeading title="Quick actions" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Link to="/admin/missions">
          <Card className="transition-colors hover:border-primary/50">
            <CardContent className="flex items-center gap-3 p-4">
              <FilePen size={18} className="text-primary" />
              <div>
                <div className="text-sm font-semibold">Edit missions</div>
                <div className="text-xs text-muted-foreground">Scenarios, questions, XP</div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/admin/analytics">
          <Card className="transition-colors hover:border-primary/50">
            <CardContent className="flex items-center gap-3 p-4">
              <BarChart3 size={18} className="text-info" />
              <div>
                <div className="text-sm font-semibold">View analytics</div>
                <div className="text-xs text-muted-foreground">Drop-offs, hints, success</div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/admin/submissions">
          <Card className="transition-colors hover:border-primary/50">
            <CardContent className="flex items-center gap-3 p-4">
              <TicketCheck size={18} className="text-success" />
              <div>
                <div className="text-sm font-semibold">Review submissions</div>
                <div className="text-xs text-muted-foreground">Every answer, every attempt</div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}

function HealthRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <Badge variant="outline">{value}</Badge>
    </div>
  )
}
