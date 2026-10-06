import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAppStore } from './store/app'
import { AppShell } from './layout/AppShell'
import { LoginPage } from './pages/auth/LoginPage'
import { SignupPage } from './pages/auth/SignupPage'
import { OnboardingPage } from './pages/auth/OnboardingPage'
import { DashboardPage } from './pages/DashboardPage'
import { LearnPage } from './pages/LearnPage'
import { MissionsPage } from './pages/MissionsPage'
import { MissionWorkspacePage } from './pages/MissionWorkspacePage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { ProfilePage } from './pages/ProfilePage'
import { NotFoundPage } from './pages/NotFoundPage'

// chart-heavy pages load on demand to keep the initial bundle lean
const ProgressPage = lazy(() =>
  import('./pages/ProgressPage').then((m) => ({ default: m.ProgressPage })),
)
const AdminPage = lazy(() =>
  import('./pages/admin/AdminPage').then((m) => ({ default: m.AdminPage })),
)

function PageFallback() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="skeleton h-7 w-56" />
      <div className="skeleton h-36 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="skeleton h-32" />
        <div className="skeleton h-32" />
        <div className="skeleton h-32" />
      </div>
    </div>
  )
}

// restore scroll position on every route change — otherwise navigating from a
// scrolled page opens the new page mid-scroll (or blank)
function ScrollToTop() {
  const location = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [location.pathname])
  return null
}

function RequireAuth({ children }: { children: ReactNode }) {
  const user = useAppStore((s) => s.user)
  const onboarded = useAppStore((s) => s.onboarded)
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!onboarded && location.pathname !== '/onboarding')
    return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function shell(page: ReactNode) {
  return (
    <RequireAuth>
      <AppShell>
        <Suspense fallback={<PageFallback />}>{page}</Suspense>
      </AppShell>
    </RequireAuth>
  )
}

export default function App() {
  const theme = useAppStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/onboarding" element={shell(<OnboardingPage />)} />
        <Route path="/" element={shell(<DashboardPage />)} />
        <Route path="/learn" element={shell(<LearnPage />)} />
        <Route path="/missions" element={shell(<MissionsPage />)} />
        <Route path="/missions/:id" element={shell(<MissionWorkspacePage />)} />
        <Route path="/progress" element={shell(<ProgressPage />)} />
        <Route path="/leaderboard" element={shell(<LeaderboardPage />)} />
        <Route path="/profile" element={shell(<ProfilePage />)} />
        <Route path="/admin/*" element={shell(<AdminPage />)} />
        <Route path="*" element={shell(<NotFoundPage />)} />
      </Routes>
    </>
  )
}
