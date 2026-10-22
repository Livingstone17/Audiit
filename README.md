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

This works with **no backend at all** — everything is saved in the browser. To
switch on Supabase (shared accounts + cloud progress) see
[Backend: Supabase](#backend-supabase).

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
├── lib/               Types, validation engine, levels, utils, seeded RNG,
│                      Supabase client + cloud-sync layer (sync.ts)
├── pages/             Dashboard, Learn, Missions, Mission workspace, Progress,
│                      Leaderboard, Profile, auth, admin
├── store/             Zustand stores: app state (auth/per-user progress/admin),
│                      cloud sync lifecycle + toasts
└── tests/             Vitest suites (12 files, 139 tests)

supabase/
└── migrations/        Postgres schema + RLS migration (0001_init.sql)
```

Key decisions:

- **Local-first with per-user progress**: all state persists to `localStorage`
  (`auditlab-store-v1`), so the app runs with zero backend setup. Every account
  gets its own progression slice (`progressByUserId`, keyed by `User.id`) — two
  accounts on one browser never share XP, records, submissions, badges, finding
  drafts or analytics events. Legacy v0/v1 payloads are migrated into the
  signed-in user's slice on rehydrate (`migratePersistedState`). Local accounts
  store **salted SHA-256 password hashes** (`lib/hash.ts`) — raw passwords never
  touch localStorage, and v0–v2 payloads are hashed during migration. Demo
  credentials are printed in the README on purpose; they are demo accounts.
- **Supabase is an optional mirror, not a dependency**: with
  `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` set, auth moves to Supabase and
  learner data is synced to Postgres with RLS. The localStorage slice stays the
  source of truth, so the app keeps working offline and the cloud copy can never
  clobber newer local work — see [Backend: Supabase](#backend-supabase).
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

## Backend: Supabase

Learner data lives in `localStorage` first and is **mirrored** to Supabase when
credentials are present: the browser keeps working offline and the cloud copy is
what lets a learner continue on another device.

### 1. Create the project

Create a project at <https://supabase.com/dashboard>. For the fastest demo, turn
off **Authentication → Sign In / Providers → Email → Confirm email** so a new
signup gets a session immediately. With confirmation on, the signup page asks the
learner to open the emailed link and sign in, and Supabase's built-in SMTP rate
limit applies.

### 2. Create the schema

Open **SQL Editor → New query**, paste in
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) and run
it. That creates six tables (`profiles`, `user_progress`, `mission_records`,
`submissions`, `analytics_events`, `audit_findings`), enables row-level security
keyed on `auth.uid()` — owners read/write their own rows, administrators can read
all of them — and adds a trigger that gives every new user a profile and a
progress row.

### 3. Point the app at it

```bash
cp .env.example .env
```

Fill in the values from **Project Settings → API** and restart `npm run dev`:

```dotenv
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```

The sidebar now shows a sync pill — *Local only* with no credentials, otherwise
*Cloud ready → Syncing… → Synced*, or *Offline — will sync* when the network
drops. The Profile page has the same status with a manual **Sync now**.

### 4. Make yourself an administrator

Sign up in the app, then run:

```sql
update public.profiles set role = 'admin' where id = '<auth user uuid>';
```

The bundled `admin@auditlab.app` demo account stays local-only and is always an
admin.

### How syncing works

- `src/lib/sync.ts` is the only module that talks to Postgres.
- **Push** upserts the whole slice (profile, progress, mission records,
  submissions, events, findings). Every write is idempotent, so a sync can be
  replayed as often as needed.
- **Pull** reads the cloud copy and `mergeUserProgress` merges it with the local
  slice — completion outranks in-progress, counters take the max, append-only
  logs are unioned by id. Neither side can lose progress.
- Sync runs after every mutation (debounced), on login, on boot, and again
  whenever the browser comes back `online`. Failures are queued: the mutation is
  already saved locally, `pendingSync` is set, and the flush retries with
exponential backoff.
- **Reset progress** deletes the cloud rows and records a `reset_at` watermark,
  so a reset made while offline cannot be resurrected by a later pull.
- The browser client never writes `profiles.role`, and a `before update` trigger
  rejects role changes made by anyone who is not already an administrator — so a
  learner cannot promote themselves and read every row through the admin
  policies.
- With no `VITE_SUPABASE_*` values the sync layer is inert and the build behaves
  exactly like the local-only app.

## Deploy (Vercel)

The project is a standard Vite SPA with SPA rewrites in `vercel.json`:

```bash
npm run build   # outputs dist/
```

Import the repo in Vercel — framework preset **Vite**, build `npm run build`,
output `dist`. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the
project's environment variables to enable the Supabase backend in production;
without them the deploy runs local-only.

## MVP scope (deliberately excluded)

Browser Excel clone, multiplayer, live sessions, AI tutor/datasets, Power BI/SAP
integrations, SSO, certificates, payments and native apps. The core loop comes first:

**Learn → Investigate → Solve → Submit → Get Feedback → Earn XP → Unlock → Investigate again.**
