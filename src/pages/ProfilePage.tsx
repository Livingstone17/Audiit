import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Award,
  CheckCircle2,
  LogOut,
  RotateCcw,
  Settings2,
  Sparkles,
  Unlock,
  UserCog,
} from 'lucide-react'
import { useAppStore } from '../store/app'
import { useProgress } from '../hooks/useProgress'
import { ACHIEVEMENTS, SKILLS } from '../data/achievements'
import { Avatar, AchievementIcon, SectionHeading } from '../components/brand'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input, Select } from '../components/ui/forms'
import { Dialog } from '../components/ui/overlays'
import { useToasts } from '../store/toasts'
import { cn } from '../lib/utils'
import { useNavigate } from 'react-router-dom'

export function ProfilePage() {
  const user = useAppStore((s) => s.user)
  const updateUser = useAppStore((s) => s.updateUser)
  const logout = useAppStore((s) => s.logout)
  const resetProgress = useAppStore((s) => s.resetProgress)
  const unlockAll = useAppStore((s) => s.unlockAll)
  const push = useToasts((s) => s.push)
  const navigate = useNavigate()

  const { xp, levelInfo, missionsCompleted, totalMissions, accuracy, hintsUsed, achievements, completed, missions, skills } =
    useProgress()

  const [editOpen, setEditOpen] = useState(false)
  const [name, setName] = useState(user?.name ?? '')
  const [confirmReset, setConfirmReset] = useState(false)

  if (!user) return null

  const saveProfile = () => {
    if (!name.trim()) return
    updateUser({ name: name.trim() })
    setEditOpen(false)
    push({ variant: 'success', title: 'Profile updated' })
  }

  return (
    <div className="animate-fade-in">
      {/* Header card */}
      <Card className="mb-6 overflow-hidden">
        <div
          className="relative p-6"
          style={{
            background:
              'linear-gradient(120deg, color-mix(in oklab, var(--primary) 13%, var(--card)), var(--card) 65%)',
          }}
        >
          <div className="flex flex-wrap items-center gap-5">
            <Avatar name={user.name} hue={user.avatarHue} size={72} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight">{user.name}</h1>
                <Badge variant={user.role === 'admin' ? 'info' : 'outline'}>
                  {user.role === 'admin' ? 'Administrator' : 'Learner'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {user.persona && <Badge variant="muted">{user.persona}</Badge>}
                {user.excelLevel && <Badge variant="muted">Excel: {user.excelLevel}</Badge>}
                <Badge variant="xp">
                  Level {levelInfo.levelNumber}: {levelInfo.level.name}
                </Badge>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                <UserCog size={15} /> Edit profile
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
              >
                <LogOut size={15} /> Log out
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total XP', value: xp.toLocaleString() },
          { label: 'Missions', value: `${missionsCompleted}/${totalMissions}` },
          { label: 'Accuracy', value: `${accuracy}%` },
          { label: 'Hints used', value: String(hintsUsed) },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="mt-1 text-xl font-semibold tracking-tight">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Badges */}
      <div className="mt-8">
        <SectionHeading
          title="Badges"
          subtitle={`${achievements.length} of ${ACHIEVEMENTS.length} earned`}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {ACHIEVEMENTS.map((a) => {
            const earned = achievements.includes(a.id)
            return (
              <div
                key={a.id}
                className={cn(
                  'rounded-xl border p-3 text-center',
                  earned ? 'border-xp/40 bg-xp/5' : 'border-dashed border-border opacity-55 grayscale',
                )}
                title={a.description}
              >
                <span
                  className={cn(
                    'mx-auto flex size-10 items-center justify-center rounded-lg text-white',
                    earned ? `bg-gradient-to-br ${a.color}` : 'bg-muted text-muted-foreground',
                  )}
                >
                  <AchievementIcon icon={a.icon} size={18} />
                </span>
                <div className="mt-2 text-xs font-semibold leading-tight">{a.name}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Skills unlocked</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {skills.map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-lg',
                    s.percent === 100 ? 'bg-success-soft text-success' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {s.percent === 100 ? <CheckCircle2 size={15} /> : <Sparkles size={14} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between text-[13px]">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-muted-foreground">{s.percent}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        s.percent === 100 ? 'bg-success' : 'bg-primary',
                      )}
                      style={{ width: `${s.percent}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            <p className="pt-1 text-xs text-muted-foreground">
              Skills track your completion across {SKILLS.length} audit capability areas.
            </p>
          </CardContent>
        </Card>

        {/* Completed missions */}
        <Card>
          <CardHeader>
            <CardTitle>Completed missions ({missionsCompleted})</CardTitle>
          </CardHeader>
          <CardContent>
            {missionsCompleted === 0 ? (
              <div className="text-sm text-muted-foreground">
                Nothing completed yet.{' '}
                <Link to="/" className="text-primary hover:underline">
                  Start Mission 01
                </Link>{' '}
                to begin your case history.
              </div>
            ) : (
              <ul className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
                {missions
                  .filter((m) => completed.has(m.id))
                  .map((m) => (
                    <li key={m.id}>
                      <Link
                        to={`/missions/${m.id}`}
                        className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:border-success/50"
                      >
                        <Award size={14} className="shrink-0 text-success" />
                        <span className="truncate">{m.title}</span>
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                          {m.xp} XP
                        </span>
                      </Link>
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Demo controls */}
      <div className="mt-8">
        <SectionHeading
          title="Demo controls"
          subtitle="This build stores everything locally in your browser — use these to explore."
        />
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              unlockAll()
              push({ variant: 'success', title: 'All missions unlocked' })
            }}
          >
            <Unlock size={15} /> Unlock all missions
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              updateUser({ role: user.role === 'admin' ? 'learner' : 'admin' })
              push({
                variant: 'success',
                title: user.role === 'admin' ? 'Switched to learner view' : 'Admin access enabled',
              })
            }}
          >
            <Settings2 size={15} />{' '}
            {user.role === 'admin' ? 'Switch to learner view' : 'Enable admin access'}
          </Button>
          <Button variant="danger" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={15} /> Reset progress
          </Button>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit profile"
        description="Your display name appears across AuditLab."
      >
        <div className="space-y-4">
          <Input label="Display name" value={name} onChange={(e) => setName(e.target.value)} />
          <Select
            label="Excel experience"
            value={user.excelLevel}
            onChange={(e) =>
              updateUser({ excelLevel: e.target.value as 'Beginner' | 'Intermediate' | 'Advanced' })
            }
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </Select>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveProfile}>Save changes</Button>
          </div>
        </div>
      </Dialog>

      {/* Reset dialog */}
      <Dialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset all progress?"
        description="XP, missions, badges and findings will be deleted. This cannot be undone."
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmReset(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              resetProgress()
              setConfirmReset(false)
              push({ variant: 'default', title: 'Progress reset', description: 'Start again from Mission 01.' })
            }}
          >
            Reset everything
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
