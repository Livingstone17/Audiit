# AuditLab

> **Don't just learn Excel. Learn how to use Excel to think, investigate and work like an internal auditor.**

AuditLab is a production-quality SaaS learning platform that teaches Excel for internal
audit and manufacturing procurement auditing through practical, game-like missions.
Learners download realistic datasets, work them in Microsoft Excel, submit answers back
to the platform, receive immediate feedback, earn XP, unlock levels and eventually
complete a full **Procurement Audit** boss case.

The fictional client is **Apex Manufacturing Group** (Lagos plant, Ibadan warehouse,
Port Harcourt distribution centre) — the same organisation appears across all 24
missions so learners feel like they are conducting a real audit.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173 and sign in with a demo account:

| Role | Email | Password |
| --- | --- | --- |
| Learner | `zoe@auditlab.app` | `demo1234` |
| Admin | `admin@auditlab.app` | `admin1234` |

Or create a new account — onboarding takes ~10 seconds.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck (`tsc -b`) + production build |
| `npm run preview` | Serve the production build |
| `npm test` | Vitest suite (datasets, missions, validation, app smoke tests) |
| `npm run lint` | oxlint (0 errors, 0 warnings) |

## What is inside

- **24 missions** across four levels: Excel Foundations (10), Procurement Audit (8),
  Procurement Investigation (5) and the final **THE PROCUREMENT AUDIT** boss case.
- **Six challenge types**: multiple choice, Excel formula, numeric, written response,
  exception selection and audit conclusion classification.
- **Deterministic dataset engine** — generates .xlsx registers (320 / 2,400 / 10,500
  invoice rows plus vendor master, PO, GRN, payment and approval-matrix registers) with
  planted anomalies: duplicate invoices, cross-vendor duplicates, missing POs/GRNs,
  approval breaches, split purchases, price outliers, shared bank accounts, inactive
  vendors, duplicate and early payments. Expected answers are computed from the same
  engine, so marking is always consistent with the data.
- **Progressive hints** with XP costs, a solution reveal, immediate per-question
  feedback and first-try bonuses.
- **XP → levels** (Audit Trainee → Audit Manager; first 4 levels live), badges,
  accuracy tracking, skills and a non-speed-based leaderboard.
- **Audit finding template** (Condition · Criteria · Cause · Effect · Recommendation)
  used by the boss case, with a scored engagement summary.
- **Admin area**: mission library CRUD (scenario, tasks, XP, questions, hints), learner
  submissions, analytics (attempts, success rates, hint usage, drop-off points).
- **Dark mode first**, light mode optional, fully responsive with a "desktop recommended"
  notice for practical dataset work.

## Architecture

```
src/
├── components/        UI kit, brand, mission components (cards, hints, questions, findings)
├── data/              Apex company data, achievements, leaderboard peers, 24 mission seeds
├── datasets/          Deterministic generators, registry, audit analysis, xlsx/pdf export
├── hooks/             Derived progress hooks (XP, level, skills)
├── layout/            App shell (sidebar + mobile drawer)
├── lib/               Types, validation engine, levels, utils, seeded RNG
├── pages/             Dashboard, Learn, Missions, Mission workspace, Progress,
│                      Leaderboard, Profile, auth, admin
├── store/             Zustand stores: app state (auth/progress/XP/admin) + toasts
└── tests/             Vitest suites (30 tests)
```

Key decisions:

- **Local-first**: all state persists to `localStorage` (`auditlab-store-v1`), so the app
  runs with zero backend setup. The store is the single seam for swapping in
  Supabase (auth/Postgres/RLS) later — replace the actions in `src/store/app.ts`.
- **Mission answers as code**: dataset-derived answers are functions over the
  deterministic generators (`() => duplicateRecordCount('pr-full')`), resolved at
  validation time and flattened to static values by the admin editor.
- **Downloads are generated client-side**: `.xlsx` via `write-excel-file`, the
  procurement policy PDF via lazily-loaded `jsPDF`.

## Deploy (Vercel)

The project is a standard Vite SPA with SPA rewrites in `vercel.json`:

```bash
npm run build   # outputs dist/
```

Import the repo in Vercel — framework preset **Vite**, build `npm run build`,
output `dist`. No environment variables required.

## MVP scope (deliberately excluded)

Browser Excel clone, multiplayer, live sessions, AI tutor/datasets, Power BI/SAP
integrations, SSO, certificates, payments and native apps. The core loop comes first:

**Learn → Investigate → Solve → Submit → Get Feedback → Earn XP → Unlock → Investigate again.**
