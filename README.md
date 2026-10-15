# AuditLab

> **Don't just learn Excel. Learn how to use Excel to think, investigate and work like an internal auditor.**

AuditLab is a production-quality SaaS learning platform that teaches Excel for internal
audit and manufacturing procurement auditing through practical, game-like missions.
Learners download realistic datasets, work them in Microsoft Excel, submit answers back
to the platform, receive immediate feedback, earn XP, unlock levels and eventually
complete a full **Procurement Audit** boss case.

The fictional client is **Apex Manufacturing Group** (Lagos plant, Ibadan warehouse,
Port Harcourt distribution centre) — the same organisation appears across all 40
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
| `npm test` | Vitest suite (datasets, missions, validation, hashes, per-user progress, contrast, app smoke tests) |
| `npm run lint` | oxlint (0 errors, 0 warnings) |

## What is inside

- **40 missions** across five levels: Audit Trainee (14), Audit Analyst (15),
  Internal Auditor (7), the **Senior Audit Analyst** boss level (1 — **THE
  PROCUREMENT AUDIT** engagement) and Audit Analytics Specialist (3). Two further
  levels (Audit Investigator, Audit Manager) are planned.
- **Six challenge types**: multiple choice, Excel formula, numeric, written response,
  exception selection and audit conclusion classification.
- **Deterministic dataset engine** — generates .xlsx registers (320 / 2,400 / 10,500
  invoice rows plus vendor master, PO, GRN, payment and approval-matrix registers) with
  planted anomalies: duplicate invoices, cross-vendor duplicates, missing POs/GRNs,
  approval breaches, split purchases, price outliers, shared bank accounts, inactive
  vendors, duplicate and early payments. Expected answers are computed from the same
  engine, so marking is always consistent with the data.
- **Progressive hints** (105 across the curriculum) with XP costs, a solution
  reveal, immediate per-question feedback and first-try bonuses.
- **XP → levels** (an 8-step ladder from Audit Trainee to Audit Manager; the
  first 5 progression levels have live content), badges, accuracy tracking,
  skills and a non-speed-based leaderboard.
- **Audit finding template** (Condition · Criteria · Cause · Effect · Recommendation)
  used by the boss case, with a scored engagement summary.
- **Admin area**: mission library CRUD (scenario, tasks, XP, questions, hints),
  learner submissions, analytics (attempts, success rates, hint usage, drop-off
  points). Admin views aggregate every account on the browser via `mergeProgress`.
- **Dark mode first**, light mode optional, fully responsive with a "desktop recommended"
  notice for practical dataset work.

## Architecture

```
src/
├── components/        UI kit, brand, mission components (cards, hints, questions, findings)
├── data/              Apex company data, achievements, learn links, leaderboard peers,
│                      40 mission seeds across five levels
├── datasets/          Deterministic generators, registry, xlsx/pdf export
├── hooks/             Derived progress hooks (XP, level, skills)
├── layout/            App shell (sidebar + mobile drawer)
├── lib/               Types, validation engine, levels, utils, seeded RNG
├── pages/             Dashboard, Learn, Missions, Mission workspace, Progress,
│                      Leaderboard, Profile, auth, admin
├── store/             Zustand stores: app state (auth/per-user progress/admin) + toasts
└── tests/             Vitest suites (8 files, 115 tests)
```

Key decisions:

- **Local-first with per-user progress**: all state persists to `localStorage`
  (`auditlab-store-v1`), so the app runs with zero backend setup. Every account
  gets its own progression slice (`progressByUserId`, keyed by `User.id`) — two
  accounts on one browser never share XP, records, submissions, badges, finding
  drafts or analytics events. Legacy v0/v1 payloads are migrated into the
  signed-in user's slice on rehydrate (`migratePersistedState`). Accounts store
  **salted SHA-256 password hashes** (`lib/hash.ts`) — raw passwords never touch
  localStorage, and v0–v2 payloads are hashed during migration. Demo
  credentials are printed in the README on purpose; they are demo accounts.
  The store is the single seam for swapping in Supabase (auth/Postgres/RLS)
  later — replace the actions in `src/store/app.ts`.
- **Admin analytics aggregate across users**: `mergeProgress` merges every
  account's slice — completion outranks in-progress, attempts/hints take the
  max, submissions and events are concatenated chronologically.
- **Mission catalogue is code-split**: pages consume `useMissions()` from the
  store; the 40-mission seed (`data/missions/catalog.ts`) loads via a dynamic
  import after first paint (`ensureCatalogue()`), keeping it out of the initial
  bundle. Catalogue-independent helpers live in `data/missions/pure.ts`.
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
