import { useState, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  FlaskConical,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Moon,
  Shield,
  Sun,
  TrendingUp,
  Trophy,
  User as UserIcon,
  X,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { Wordmark, Avatar } from '../components/brand'
import { useAppStore } from '../store/app'
import { ToastHost } from '../components/ToastHost'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  onClick?: () => void
}

export function AppShell({ children }: { children: ReactNode }) {
  const user = useAppStore((s) => s.user)
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const logout = useAppStore((s) => s.logout)
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const goLab = () => {
    const records = useAppStore.getState().records
    const inProgress = Object.keys(records).find((id) => records[id]!.status === 'in-progress')
    navigate(inProgress ? `/missions/${inProgress}` : '/missions')
  }

  const navItems: NavItem[] = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/learn', label: 'Learn', icon: GraduationCap },
    { to: '/missions', label: 'Missions', icon: ListChecks },
    { to: '/audit-lab', label: 'Audit Lab', icon: FlaskConical, onClick: goLab },
    { to: '/progress', label: 'Progress', icon: TrendingUp },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { to: '/profile', label: 'Profile', icon: UserIcon },
  ]

  const isAdmin = user?.role === 'admin'

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-5 pb-4">
        <NavLink to="/" aria-label="AuditLab home">
          <Wordmark size="sm" />
        </NavLink>
      </div>

      <nav className="flex-1 space-y-0.5 px-3" onClick={() => setMobileOpen(false)}>
        {navItems.map((item) => {
          const external = item.to === '/audit-lab'
          const cls = ({ isActive }: { isActive: boolean }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive && !external
                ? 'bg-primary-soft text-primary-soft-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )
          if (external) {
            return (
              <button
                key={item.to}
                onClick={item.onClick}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <item.icon size={17} />
                {item.label}
              </button>
            )
          }
          return (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={cls}>
              <item.icon size={17} />
              {item.label}
            </NavLink>
          )
        })}

        {isAdmin && (
          <>
            <div className="mx-3 my-3 border-t border-border" />
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-soft text-primary-soft-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )
              }
            >
              <Shield size={17} />
              Admin
            </NavLink>
          </>
        )}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar name={user?.name ?? 'Guest'} hue={user?.avatarHue} size={32} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium">{user?.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">{user?.email}</div>
          </div>
          <button
            onClick={() => {
              logout()
              navigate('/login')
            }}
            title="Log out"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <LogOut size={15} />
          </button>
        </div>
        <div className="mt-1 flex items-center gap-2 px-2 pb-1">
          <button
            onClick={toggleTheme}
            className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-border bg-sidebar lg:block">
        {sidebar}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
        <Wordmark size="sm" />
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="rounded-md p-2 text-muted-foreground hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-md p-2 text-muted-foreground hover:text-foreground"
            aria-label="Open menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 animate-fade-in" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-72 border-l border-border bg-sidebar animate-fade-in">
            {sidebar}
          </div>
        </div>
      )}

      <main className="lg:pl-60">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
      <ToastHost />
    </div>
  )
}
