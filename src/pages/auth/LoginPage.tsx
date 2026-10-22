// import { useState, type FormEvent } from 'react'
// import { Link, useLocation, useNavigate } from 'react-router-dom'
// import { ArrowRight, Lock, Mail } from 'lucide-react'
// import { useAppStore } from '../../store/app'
// import { SEED_MISSION_COUNT } from '../../data/missions'
// import { Button } from '../../components/ui/button'
// import { Input } from '../../components/ui/forms'
// import { Alert } from '../../components/ui/overlays'
// import { Wordmark } from '../../components/brand'

// export function LoginPage() {
//   const login = useAppStore((s) => s.login)
//   const navigate = useNavigate()
//   const location = useLocation()
//   const [email, setEmail] = useState('')
//   const [password, setPassword] = useState('')
//   const [error, setError] = useState('')
//   const [loading, setLoading] = useState(false)

//   const submit = async (e: FormEvent) => {
//     e.preventDefault()
//     setLoading(true)
//     setError('')
//     const res = await login(email, password)
//     setLoading(false)
//     if (!res.ok) {
//       setError(res.error ?? 'Login failed.')
//       return
//     }
//     const from = (location.state as { from?: string } | null)?.from
//     navigate(from && from !== '/login' ? from : '/', { replace: true })
//   }

//   return (
//     <div className="min-h-dvh grid lg:grid-cols-2">
//       {/* Brand panel */}
//       <div className="relative hidden overflow-hidden bg-[#0a0e13] p-10 lg:flex lg:flex-col lg:justify-between">
//         <div
//           className="pointer-events-none absolute inset-0"
//           style={{
//             background:
//               'radial-gradient(900px 500px at 20% 0%, rgba(16,185,129,0.16), transparent 60%), radial-gradient(700px 500px at 90% 90%, rgba(59,130,246,0.10), transparent 60%)',
//           }}
//         />
//         <Link to="/login" className="relative">
//           <Wordmark />
//         </Link>
//         <div className="relative max-w-md">
//           <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-emerald-300">
//             <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
//             Manufacturing procurement audit track
//           </div>
//           <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white">
//             Don't just learn Excel.
//             <br />
//             <span className="text-emerald-400">Audit like a professional.</span>
//           </h1>
//           <p className="mt-4 text-[15px] leading-relaxed text-slate-400">
//             Investigate realistic datasets from a fictional manufacturer, run exception
//             tests, document findings and earn XP — a training lab for junior internal
//             auditors.
//           </p>
//           <ul className="mt-8 space-y-3 text-sm text-slate-300">
//             {[
//               `${SEED_MISSION_COUNT} practical missions across Excel, procurement audit and investigation`,
//               'Realistic downloadable .xlsx datasets with controlled anomalies',
//               'Instant feedback, progressive hints and audit finding templates',
//             ].map((f) => (
//               <li key={f} className="flex items-start gap-2.5">
//                 <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 text-[11px]">
//                   ✓
//                 </span>
//                 {f}
//               </li>
//             ))}
//           </ul>
//         </div>
//         <p className="relative text-xs text-slate-500">
//           Fictional training environment · Apex Manufacturing Group datasets are simulated
//         </p>
//       </div>

//       {/* Form panel */}
//       <div className="flex items-center justify-center px-5 py-10">
//         <div className="w-full max-w-sm animate-fade-in">
//           <div className="mb-8 lg:hidden">
//             <Wordmark />
//           </div>
//           <h2 className="text-xl font-semibold tracking-tight">Welcome back</h2>
//           <p className="mt-1 text-sm text-muted-foreground">
//             Your next case file is waiting.
//           </p>

//           <form onSubmit={submit} className="mt-6 space-y-4">
//             {error && <Alert variant="danger">{error}</Alert>}
//             <Input
//               label="Email"
//               type="email"
//               autoComplete="email"
//               placeholder="you@company.com"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               icon={<Mail size={15} />}
//             />
//             <Input
//               label="Password"
//               type="password"
//               autoComplete="current-password"
//               placeholder="••••••••"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               icon={<Lock size={15} />}
//             />
//             <Button type="submit" loading={loading} className="w-full" size="lg">
//               Sign in <ArrowRight size={16} />
//             </Button>
//           </form>

//           <p className="mt-3 text-center text-xs text-muted-foreground">
//             Forgot password? This local demo stores accounts in your browser — reset
//             progress from Profile or create a fresh account.
//           </p>

//           <p className="mt-6 text-center text-sm text-muted-foreground">
//             New to AuditLab?{' '}
//             <Link to="/signup" className="font-medium text-primary hover:underline">
//               Create an account
//             </Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   )
// }


import { useState, useEffect, type FormEvent, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Lock,
  Mail,
  Flame,
  Trophy,
  FileSearch,
  Download,
  Zap,
  ChevronRight,
  Play,
  BarChart3,
  Table,
  Shield,
  Target,
  Star,
} from 'lucide-react'
import { useAppStore } from '../../store/app'
import { SEED_MISSION_COUNT } from '../../data/missions'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/forms'
import { Alert } from '../../components/ui/overlays'
import { Wordmark } from '../../components/brand'

/* ══════════════════════════════════════════
   CSS injected once — animations & 3D
   ══════════════════════════════════════════ */
const STYLE_ID = 'login-3d-styles'
const injectStyles = () => {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    @keyframes float-slow {
      0%, 100% { transform: translateY(0px) rotateX(2deg) rotateY(-2deg); }
      50%      { transform: translateY(-18px) rotateX(-2deg) rotateY(2deg); }
    }
    @keyframes float-medium {
      0%, 100% { transform: translateY(0px) rotateZ(0deg); }
      50%      { transform: translateY(-12px) rotateZ(3deg); }
    }
    @keyframes float-fast {
      0%, 100% { transform: translateY(0px) scale(1); }
      50%      { transform: translateY(-8px) scale(1.03); }
    }
    @keyframes orbit {
      0%   { transform: rotate(0deg) translateX(120px) rotate(0deg); }
      100% { transform: rotate(360deg) translateX(120px) rotate(-360deg); }
    }
    @keyframes orbit-reverse {
      0%   { transform: rotate(0deg) translateX(90px) rotate(0deg); }
      100% { transform: rotate(-360deg) translateX(90px) rotate(360deg); }
    }
    @keyframes pulse-ring {
      0%   { transform: scale(0.95); opacity: 0.6; }
      50%  { transform: scale(1.05); opacity: 0.2; }
      100% { transform: scale(0.95); opacity: 0.6; }
    }
    @keyframes slide-up {
      from { opacity: 0; transform: translateY(40px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes slide-up-delayed {
      0%, 20% { opacity: 0; transform: translateY(30px); }
      100%    { opacity: 1; transform: translateY(0); }
    }
    @keyframes gradient-shift {
      0%, 100% { background-position: 0% 50%; }
      50%      { background-position: 100% 50%; }
    }
    @keyframes cell-highlight {
      0%, 100% { background: rgba(16,185,129,0.05); }
      50%      { background: rgba(16,185,129,0.15); }
    }
    @keyframes counter-pulse {
      0%, 100% { transform: scale(1); }
      50%      { transform: scale(1.12); }
    }
    @keyframes scan-line {
      0%   { top: 0%; opacity: 0.6; }
      100% { top: 100%; opacity: 0; }
    }
    .perspective-container {
      perspective: 1200px;
      perspective-origin: 50% 50%;
    }
    .card-3d {
      transform-style: preserve-3d;
      transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1);
    }
    .card-3d:hover {
      transform: rotateY(-4deg) rotateX(4deg) translateZ(20px) scale(1.02);
    }
    .card-3d-reverse:hover {
      transform: rotateY(4deg) rotateX(-2deg) translateZ(15px) scale(1.02);
    }
    .float-slow    { animation: float-slow 6s ease-in-out infinite; }
    .float-medium  { animation: float-medium 4.5s ease-in-out infinite; }
    .float-fast    { animation: float-fast 3s ease-in-out infinite; }
    .orbit-item    { animation: orbit 20s linear infinite; }
    .orbit-reverse { animation: orbit-reverse 15s linear infinite; }
    .anim-slide-up { animation: slide-up 0.8s cubic-bezier(0.22, 1, 0.36, 1) both; }
    .anim-slide-up-d1 { animation: slide-up-delayed 1s cubic-bezier(0.22, 1, 0.36, 1) both; }
    .anim-slide-up-d2 { animation: slide-up-delayed 1.2s cubic-bezier(0.22, 1, 0.36, 1) both; }
    .anim-slide-up-d3 { animation: slide-up-delayed 1.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
    .gradient-text {
      background: linear-gradient(135deg, #34d399, #3b82f6, #34d399);
      background-size: 200% 200%;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: gradient-shift 4s ease-in-out infinite;
    }
    .glass {
      background: rgba(255,255,255,0.03);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.08);
    }
    .glass-strong {
      background: rgba(255,255,255,0.06);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.12);
    }
    .scan-line::after {
      content: '';
      position: absolute;
      left: 0; right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, rgba(16,185,129,0.4), transparent);
      animation: scan-line 3s ease-in-out infinite;
    }
  `
  document.head.appendChild(style)
}

/* ══════════════════════════════════════════
   3D Floating Excel Spreadsheet
   ══════════════════════════════════════════ */
function FloatingSpreadsheet() {
  const rows = [
    { vendor: 'APEX-001', amount: '$14,230', flag: false },
    { vendor: 'APEX-007', amount: '$98,410', flag: true },
    { vendor: 'APEX-012', amount: '$3,870', flag: false },
    { vendor: 'APEX-019', amount: '$45,600', flag: true },
    { vendor: 'APEX-023', amount: '$7,120', flag: false },
  ]

  return (
    <div className="card-3d float-slow rounded-xl overflow-hidden glass-strong shadow-2xl shadow-emerald-500/5">
      {/* title bar */}
      <div className="flex items-center gap-2 bg-white/[0.04] px-4 py-2.5 border-b border-white/[0.06]">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-red-400/80" />
          <span className="size-2.5 rounded-full bg-yellow-400/80" />
          <span className="size-2.5 rounded-full bg-green-400/80" />
        </div>
        <span className="ml-2 text-[11px] text-slate-400 font-medium">
          Procurement_Exceptions_Q4.xlsx
        </span>
        <Table size={12} className="ml-auto text-emerald-400/60" />
      </div>
      {/* formula bar */}
      <div className="flex items-center gap-2 px-4 py-1.5 bg-white/[0.02] border-b border-white/[0.04] text-[10px] text-slate-500">
        <span className="font-mono bg-white/[0.06] px-1.5 py-0.5 rounded text-emerald-400">C2</span>
        <span className="font-mono">=IF(B2&gt;$50000,"⚠ REVIEW","OK")</span>
      </div>
      {/* header */}
      <div className="grid grid-cols-3 gap-px bg-white/[0.03] text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
        <div className="px-3 py-2 bg-white/[0.02]">Vendor ID</div>
        <div className="px-3 py-2 bg-white/[0.02]">Amount</div>
        <div className="px-3 py-2 bg-white/[0.02]">Status</div>
      </div>
      {/* rows */}
      <div className="scan-line relative">
        {rows.map((r, i) => (
          <div
            key={r.vendor}
            className="grid grid-cols-3 gap-px text-[11px] border-t border-white/[0.04] transition-colors duration-500"
            style={{
              animation: r.flag ? 'cell-highlight 3s ease-in-out infinite' : undefined,
              animationDelay: `${i * 0.3}s`,
            }}
          >
            <div className="px-3 py-1.5 font-mono text-slate-300">{r.vendor}</div>
            <div className={`px-3 py-1.5 font-mono tabular-nums ${r.flag ? 'text-orange-400 font-semibold' : 'text-slate-300'}`}>
              {r.amount}
            </div>
            <div className="px-3 py-1.5">
              {r.flag ? (
                <span className="inline-flex items-center gap-1 text-orange-400 text-[10px] font-medium">
                  <span className="size-1.5 rounded-full bg-orange-400 animate-pulse" />
                  REVIEW
                </span>
              ) : (
                <span className="text-emerald-400/70 text-[10px]">OK</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   XP / Streak Card
   ══════════════════════════════════════════ */
function XpCard3D() {
  return (
    <div className="card-3d card-3d-reverse float-medium rounded-xl glass-strong p-4 shadow-2xl shadow-blue-500/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="flex size-9 items-center justify-center rounded-lg bg-orange-500/15"
            style={{ animation: 'counter-pulse 2s ease-in-out infinite' }}
          >
            <Flame size={18} className="text-orange-400" />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Streak</p>
            <p className="text-sm font-bold text-white tabular-nums">12 days</p>
          </div>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Total XP</p>
            <p className="text-sm font-bold text-emerald-400 tabular-nums">2,450</p>
          </div>
          <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/15">
            <Trophy size={18} className="text-emerald-400" />
          </span>
        </div>
      </div>
      <div className="mt-3.5">
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-400">
          <span>
            Level 4 · <span className="text-slate-200 font-medium">Field Auditor</span>
          </span>
          <span className="tabular-nums text-emerald-400">78%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all relative"
            style={{ width: '78%' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={12}
            className={s <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}
          />
        ))}
        <span className="ml-1 text-[10px] text-slate-500">Mission rating</span>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   Orbiting Icons
   ══════════════════════════════════════════ */
function OrbitingElements() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* center anchor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {/* ring */}
        <div
          className="absolute -inset-[120px] rounded-full border border-dashed border-white/[0.06]"
          style={{ animation: 'pulse-ring 4s ease-in-out infinite' }}
        />
        <div className="absolute -inset-[90px] rounded-full border border-dashed border-white/[0.04]" />

        {/* orbiting icons */}
        <div className="orbit-item absolute top-0 left-0">
          <div className="flex size-8 items-center justify-center rounded-lg glass text-emerald-400 shadow-lg shadow-emerald-500/10">
            <BarChart3 size={14} />
          </div>
        </div>
        <div className="orbit-reverse absolute top-0 left-0">
          <div className="flex size-8 items-center justify-center rounded-lg glass text-blue-400 shadow-lg shadow-blue-500/10">
            <Shield size={14} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   Parallax Mouse Tracker
   ══════════════════════════════════════════ */
function useParallax() {
  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      setOffset({
        x: (e.clientX - cx) / rect.width,
        y: (e.clientY - cy) / rect.height,
      })
    }
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  return { ref, offset }
}

/* ══════════════════════════════════════════
   Feature Card
   ══════════════════════════════════════════ */
function FeatureCard({
  icon,
  title,
  desc,
  delay,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  delay: string
}) {
  return (
    <div
      className="card-3d glass rounded-xl p-4 group cursor-default"
      style={{ animationDelay: delay }}
    >
      <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
      <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
    </div>
  )
}

/* ══════════════════════════════════════════
   Main Landing / Login Page
   ══════════════════════════════════════════ */
export function LoginPage() {
  const login = useAppStore((s) => s.login)
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { ref: parallaxRef, offset } = useParallax()

  useEffect(() => {
    injectStyles()
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await login(email, password)
    setLoading(false)
    if (!res.ok) {
      setError(res.error ?? 'Login failed.')
      return
    }
    const from = (location.state as { from?: string } | null)?.from
    navigate(from && from !== '/login' ? from : '/', { replace: true })
  }

  return (
    <div className="min-h-dvh bg-[#06090d] text-white overflow-hidden">
      {/* ─── Background Layers ─── */}
      <div className="fixed inset-0 pointer-events-none">
        {/* grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        {/* gradient blobs */}
        <div
          className="absolute w-[800px] h-[800px] rounded-full opacity-30 blur-[120px]"
          style={{
            background: 'radial-gradient(circle, rgba(16,185,129,0.15), transparent 70%)',
            top: '-20%',
            left: '-10%',
            transform: `translate(${offset.x * 20}px, ${offset.y * 20}px)`,
            transition: 'transform 0.3s ease-out',
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%)',
            bottom: '-10%',
            right: '-5%',
            transform: `translate(${offset.x * -15}px, ${offset.y * -15}px)`,
            transition: 'transform 0.3s ease-out',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-10 blur-[80px]"
          style={{
            background: 'radial-gradient(circle, rgba(168,85,247,0.2), transparent 70%)',
            top: '40%',
            left: '50%',
            transform: `translate(${offset.x * -10}px, ${offset.y * -10}px)`,
            transition: 'transform 0.3s ease-out',
          }}
        />
      </div>

      <div ref={parallaxRef} className="relative z-10 grid lg:grid-cols-2 min-h-dvh">
        {/* ═══════════ LEFT: Brand / 3D Showcase ═══════════ */}
        <div className="relative flex flex-col px-8 py-10 lg:px-12 lg:py-10">
          {/* Hero */}
          <div className="flex-1 flex flex-col justify-center py-12 lg:py-0">
            <div className="max-w-lg anim-slide-up-d1">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-emerald-300">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Manufacturing Audit Track · {SEED_MISSION_COUNT} missions
                <ChevronRight size={12} className="text-emerald-400/60" />
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight">
                Level up your
                <br />
                audit skills.
                <br />
                <span className="gradient-text">One mission at a time.</span>
              </h1>

              <p className="mt-5 text-base leading-relaxed text-slate-400 max-w-md">
                Investigate realistic datasets, run exception tests, document findings and
                earn XP — the hands-on training lab built for aspiring auditors.
              </p>

              {/* CTA buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/signup">
                  <Button size="lg" className="gap-2 shadow-lg shadow-emerald-500/20">
                    Start for free <ArrowRight size={16} />
                  </Button>
                </Link>
                <button className="flex items-center gap-2 rounded-xl glass px-5 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all group">
                  <span className="flex size-7 items-center justify-center rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                    <Play size={12} className="ml-0.5" />
                  </span>
                  Watch demo
                </button>
              </div>

              {/* Social proof */}
              <div className="mt-8 flex items-center gap-4 text-xs text-slate-500">
                <div className="flex -space-x-2">
                  {[
                    'bg-emerald-500',
                    'bg-blue-500',
                    'bg-purple-500',
                    'bg-orange-500',
                  ].map((c, i) => (
                    <div
                      key={i}
                      className={`size-7 rounded-full ${c} border-2 border-[#06090d] flex items-center justify-center text-[9px] font-bold text-white`}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <span>
                  <span className="text-slate-300 font-medium">500+</span> auditors
                  leveling up
                </span>
              </div>
            </div>

            {/* 3D cards — desktop only */}
            <div className="hidden lg:block perspective-container mt-12 anim-slide-up-d2">
              <div className="grid grid-cols-2 gap-4 max-w-lg">
                <div
                  style={{
                    transform: `rotateY(${offset.x * 5}deg) rotateX(${offset.y * -5}deg)`,
                    transition: 'transform 0.2s ease-out',
                  }}
                >
                  <FloatingSpreadsheet />
                </div>
                <div
                  className="flex flex-col gap-4"
                  style={{
                    transform: `rotateY(${offset.x * 3}deg) rotateX(${offset.y * -3}deg) translateZ(30px)`,
                    transition: 'transform 0.2s ease-out',
                  }}
                >
                  <XpCard3D />

                  {/* Mini mission card */}
                  <div className="card-3d float-fast glass rounded-xl p-3 shadow-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Target size={14} className="text-blue-400" />
                      <span className="text-[11px] font-medium text-slate-300">
                        Current Mission
                      </span>
                    </div>
                    <p className="text-xs text-white font-medium leading-snug">
                      Duplicate Invoice Detection
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Find matching PO refs with divergent amounts
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <div className="h-1 flex-1 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full w-[45%] rounded-full bg-blue-400" />
                      </div>
                      <span className="text-[9px] text-slate-500 tabular-nums">
                        45%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <OrbitingElements />
            </div>
          </div>

          <p className="mt-6 text-[11px] text-slate-600">
            Fictional training environment · Apex Manufacturing Group datasets are
            simulated
          </p>
        </div>

        {/* ═══════════ RIGHT: Login Form ═══════════ */}
        <div className="flex items-center justify-center px-6 py-10 lg:px-12">
          <div
            className="w-full max-w-sm anim-slide-up"
            style={{
              transform: `rotateY(${offset.x * -2}deg) rotateX(${offset.y * 2}deg)`,
              transition: 'transform 0.3s ease-out',
            }}
          >
            <div className="glass-strong rounded-2xl p-8 shadow-2xl shadow-black/40">
              {/* mobile wordmark */}
              <div className="mb-6 text-center lg:hidden">
                <Wordmark />
                <p className="mt-2 text-xs text-slate-400">
                  Level up your audit skills, one mission at a time.
                </p>
              </div>

              <h2 className="text-xl font-bold tracking-tight text-white">
                Welcome back
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Your next case file is waiting.
              </p>

              <form onSubmit={submit} className="mt-6 space-y-4">
                {error && <Alert variant="danger">{error}</Alert>}

                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail size={15} />}
                />

                <Input
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock size={15} />}
                />

                <Button
                  type="submit"
                  loading={loading}
                  className="w-full shadow-lg shadow-emerald-500/20"
                  size="lg"
                >
                  Sign in <ArrowRight size={16} />
                </Button>
              </form>

              <div className="mt-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.08]" />
                <span className="text-[11px] text-slate-500 uppercase tracking-wider">
                  or
                </span>
                <div className="h-px flex-1 bg-white/[0.08]" />
              </div>

              <p className="mt-4 text-center text-sm text-slate-400">
                New to AuditLab?{' '}
                <Link
                  to="/signup"
                  className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors hover:underline"
                >
                  Create a free account
                </Link>
              </p>
            </div>


          </div>
        </div>
      </div>
    </div>
  )
}