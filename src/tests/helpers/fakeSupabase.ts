/**
 * Minimal in-memory stand-in for `@supabase/supabase-js`.
 *
 * It covers exactly the surface AuditLab uses: the auth methods called from the
 * store, and the query chains built in `lib/sync.ts` (`select().eq().order()`,
 * `select().eq().maybeSingle()`, `upsert(rows, opts)` and `delete().eq()`).
 * Tests mock `../lib/supabase` with the singleton exported here so they can
 * also inspect and seed the underlying tables.
 */

type Row = Record<string, unknown>

interface Result {
  data: Row[] | Row | null
  error: { message: string } | null
}

export interface FakeUser {
  id: string
  email: string
  user_metadata: Record<string, unknown>
  created_at: string
}

function matches(row: Row, filters: [string, unknown][]): boolean {
  return filters.every(([col, value]) => row[col] === value)
}

/** `onConflict: 'user_id,mission_id'` → ['user_id', 'mission_id'] */
function conflictKeys(onConflict: string | undefined): string[] {
  return onConflict ? onConflict.split(',').map((k) => k.trim()) : ['id']
}

export class FakeDb {
  tables: Record<string, Row[]> = {}
  /** When set, the next query fails once — used to simulate an outage. */
  failNext: { message: string } | null = null

  reset(): void {
    this.tables = {}
    this.failNext = null
  }

  from(table: string): FakeQuery {
    return new FakeQuery(this, table)
  }
}

export class FakeQuery implements PromiseLike<Result> {
  private db: FakeDb
  private table: string
  private op: 'select' | 'upsert' | 'delete' = 'select'
  private filters: [string, unknown][] = []
  private payload: Row[] = []
  private onConflict: string | undefined
  private ignoreDuplicates = false
  private single = false
  private orderBy: string | null = null

  constructor(db: FakeDb, table: string) {
    this.db = db
    this.table = table
  }

  select(): this {
    this.op = 'select'
    return this
  }

  eq(column: string, value: unknown): this {
    this.filters.push([column, value])
    return this
  }

  order(column: string): this {
    this.orderBy = column
    return this
  }

  maybeSingle(): this {
    this.single = true
    return this
  }

  upsert(rows: Row | Row[], options: { onConflict?: string; ignoreDuplicates?: boolean } = {}): this {
    this.op = 'upsert'
    this.payload = Array.isArray(rows) ? rows : [rows]
    this.onConflict = options.onConflict
    this.ignoreDuplicates = Boolean(options.ignoreDuplicates)
    return this
  }

  delete(): this {
    this.op = 'delete'
    return this
  }

  then<TResult1 = Result, TResult2 = never>(
    onfulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.run().then(onfulfilled, onrejected)
  }

  private async run(): Promise<Result> {
    if (this.db.failNext) {
      const error = this.db.failNext
      this.db.failNext = null
      return { data: null, error }
    }

    const rows = this.db.tables[this.table] ?? (this.db.tables[this.table] = [])

    if (this.op === 'upsert') {
      const keys = conflictKeys(this.onConflict)
      for (const row of this.payload) {
        const index = rows.findIndex((r) => keys.every((k) => r[k] === row[k]))
        if (index >= 0) {
          if (!this.ignoreDuplicates) rows[index] = { ...rows[index], ...row }
        } else {
          rows.push({ ...row })
        }
      }
      return { data: null, error: null }
    }

    if (this.op === 'delete') {
      this.db.tables[this.table] = rows.filter((row) => !matches(row, this.filters))
      return { data: null, error: null }
    }

    let selected = rows.filter((row) => matches(row, this.filters))
    const orderBy = this.orderBy
    if (orderBy) {
      selected = [...selected].sort((a, b) => String(a[orderBy]).localeCompare(String(b[orderBy])))
    }
    if (this.single) return { data: selected[0] ?? null, error: null }
    return { data: selected.map((row) => ({ ...row })), error: null }
  }
}

function createFakeSupabase() {
  const db = new FakeDb()
  const users = new Map<string, { password: string; user: FakeUser }>()
  const listeners: ((event: string, session: unknown) => void)[] = []
  let session: { user: FakeUser } | null = null
  let nextId = 1

  const client = {
    db,

    /** Simulates "Confirm email": signUp creates the user but returns no session. */
    requireEmailConfirmation: false,
    /** Addresses that `auth.resend` was asked to re-send to. */
    resentEmails: [] as string[],
    /** When set, the next `auth.resend` call fails once (e.g. rate limiting). */
    failResend: null as { message: string } | null,

    /** Wipe tables, accounts and the session — called from `beforeEach`. */
    reset(): void {
      db.reset()
      users.clear()
      listeners.length = 0
      session = null
      nextId = 1
      client.requireEmailConfirmation = false
      client.resentEmails.length = 0
      client.failResend = null
    },

    /** Seed an account that `auth.signInWithPassword` accepts. */
    addUser(email: string, password: string, metadata: Record<string, unknown> = {}): FakeUser {
      const user: FakeUser = {
        id: `00000000-0000-4000-8000-${String(nextId++).padStart(12, '0')}`,
        email,
        user_metadata: metadata,
        created_at: '2026-01-01T00:00:00.000Z',
      }
      users.set(email, { password, user })
      return user
    },

    /** Put a session in place without going through the sign-in form. */
    signInAs(user: FakeUser): void {
      session = { user }
    },

    get sessionUser(): FakeUser | null {
      return session?.user ?? null
    },

    from(table: string): FakeQuery {
      return db.from(table)
    },

    auth: {
      getSession: async () => ({ data: { session }, error: null }),

      onAuthStateChange: (callback: (event: string, s: unknown) => void) => {
        listeners.push(callback)
        return { data: { subscription: { unsubscribe: () => undefined } } }
      },

      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        const record = users.get(email)
        if (!record || record.password !== password) {
          return {
            data: { user: null, session: null },
            error: { message: 'Invalid login credentials' },
          }
        }
        session = { user: record.user }
        for (const listener of listeners) listener('SIGNED_IN', session)
        return { data: { user: record.user, session }, error: null }
      },

      signUp: async ({
        email,
        password,
        options,
      }: {
        email: string
        password: string
        options?: { data?: Record<string, unknown> }
      }) => {
        const user = client.addUser(email, password, options?.data ?? {})
        if (client.requireEmailConfirmation) {
          return { data: { user, session: null }, error: null }
        }
        session = { user }
        for (const listener of listeners) listener('SIGNED_IN', session)
        return { data: { user, session }, error: null }
      },

      resend: async ({ email }: { type: string; email: string }) => {
        if (client.failResend) {
          const error = client.failResend
          client.failResend = null
          return { data: null, error }
        }
        client.resentEmails.push(email)
        return { data: {}, error: null }
      },

      signOut: async () => {
        session = null
        for (const listener of listeners) listener('SIGNED_OUT', null)
        return { error: null }
      },
    },
  }

  return client
}

/** Shared instance — the mocked module and the tests both use this one. */
export const fakeSupabase = createFakeSupabase()
