# OAuth Providers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable Google + GitHub OAuth login (PKCE + callback), prepare Apple for future activation, and introduce a unique `username` field (distinct from repeatable `full_name`) with a post-login gate for choosing it.

**Architecture:** Client-side gate in `AuthContext` fetches profile after auth state changes; if `username` is null, redirects to `/setup-username`. New API endpoints `GET /api/profiles/me`, `GET /api/profiles/username-available`, `PATCH /api/profiles/me` back the gate. Schema migration renames `display_name` → `full_name`, adds `username` + `email` columns, and drops the old unique constraint. Login remains optional — unauthenticated users never hit the gate.

**Tech Stack:** Next.js 15 (App Router), Express 5, Supabase (GoTrue + PostgreSQL), `@supabase/supabase-js` PKCE flow, Vitest, CSS Modules, pnpm workspaces + Turborepo.

## Global Constraints

- **Username regex:** `^[a-zA-Z0-9_]{3,20}$` (enforced client and server-side).
- **Username uniqueness:** case-insensitive via `lower(username)` partial unique index.
- **Banned words:** `admin`, `root`, `system`, `null`, `undefined`, `auth`, `api`, `support`, `me`, `mine`, `minesweeper`, `official` (hardcoded list, lowercase compare).
- **Login is optional:** unauthenticated users never hit the username gate; gate only fires inside `if (session?.user)`.
- **PKCE flow:** `supabase.auth.signInWithOAuth({ provider, options: { redirectTo: '/auth/callback' } })` + `/auth/callback` route calls `exchangeCodeForSession`.
- **Apple stays `enabled = false`** until Apple Developer Program is active; button renders but shows "Em breve" tooltip.
- **Schema preservation:** `xp`, `level`, `avatar_url`, `banned`, `banned_at`, `is_admin`, `created_at`, `updated_at` unchanged. Existing users keep all data.
- **Profile type omits `is_admin` and `banned_at`** (not exposed to client).
- **`api` client pattern:** all web→API calls go through `apps/web/src/lib/api.ts` (handles token, offline detection, sync queue). No raw `fetch` in React contexts.
- **Test commands:** `pnpm --filter @minesweeper/api test` (API), `pnpm --filter @minesweeper/web test` (web), `pnpm test` (all via turbo).
- **Lint/typecheck:** `pnpm lint` and `pnpm typecheck` at root (turbo).
- **Commits:** conventional commits (`feat:`, `chore:`, `test:`, `docs:`, `refactor:`).
- **No comments in code** unless asked.

---

## File Structure

**New files:**
- `supabase/migrations/<timestamp>_profile_username_split.sql` — schema migration.
- `apps/api/api/routes/profiles.ts` — new router: `GET /me`, `GET /username-available`, `PATCH /me`.
- `apps/api/src/__tests__/profiles.test.ts` — API tests.
- `apps/web/src/app/auth/callback/route.ts` — PKCE code exchange.
- `apps/web/src/app/setup-username/page.tsx` — gate page.
- `apps/web/src/app/setup-username/page.module.css` — page styles.
- `apps/web/src/components/OAuthButton/index.tsx` — 3-provider button group.
- `apps/web/src/components/OAuthButton/OAuthButton.module.css` — styles.
- `apps/web/src/contexts/__tests__/AuthContext.test.tsx` — gate logic tests.

**Modified files:**
- `packages/types/src/index.ts` — add `Profile` interface.
- `apps/api/api/index.ts` — register `/api/profiles` router.
- `apps/api/api/routes/leaderboard.ts` — `p.display_name` → `p.username` + `p.full_name`.
- `apps/api/api/routes/stats.ts` — `display_name` → `username` + `full_name` in public route.
- `apps/api/api/routes/admin.ts` — search/PATCH/top-players use `username`/`email`/`full_name`.
- `apps/api/src/seed.ts` — `display_name` → `full_name` + add `username`.
- `apps/api/src/__tests__/routes.test.ts` — update mock returning `display_name`.
- `apps/web/src/lib/api.ts` — add `api.profiles.{me, usernameAvailable, updateMe}`.
- `apps/web/src/lib/supabase.ts` — PKCE config.
- `apps/web/src/contexts/AuthContext.tsx` — gate logic via `api.profiles.me()`.
- `apps/web/src/app/auth/page.tsx` — use `OAuthButton`, add Apple, handle `?error=oauth`.
- `apps/web/src/app/leaderboard/page.tsx` — `display_name` → `username`.
- `apps/web/src/app/profile/page.tsx` — `display_name` → `username` + `full_name`.
- `apps/web/src/app/profile/[userId]/page.tsx` — `display_name` → `username` + `full_name`.
- `apps/web/src/lib/__tests__/api.test.ts` — update mock returning `display_name`.
- `apps/web/src/messages/en.json` — add `setupUsername.*`, `auth.oauthError`, `auth.appleSoon`.
- `apps/web/src/messages/pt-BR.json` — same keys, PT-BR strings.
- `apps/admin/src/app/dashboard/page.tsx` — `display_name` → `username` + `email`.
- `supabase/config.toml` — add `additional_redirect_urls`, enable Google + GitHub, leave Apple disabled.
- `.env.example` — add 4 new OAuth env vars.
- `SPEC.md` — update `profiles` schema, mark CA-002 OAuth items.
- `README.md` — add "OAuth provider setup" section with redirect URL instructions.

---

## Task 1: Schema Migration

**Files:**
- Create: `supabase/migrations/20260618230000_profile_username_split.sql`

**Interfaces:**
- Produces: `profiles` table with columns `id, full_name (text, nullable, repeatable), username (text, nullable, unique-lower-partial), email (text, nullable, unique-lower-partial), avatar_url, xp, level, banned, banned_at, is_admin, created_at, updated_at`. Function `handle_new_user()` inserts `full_name`, `email`, `avatar_url` (username stays NULL until gate).

- [ ] **Step 1: Write the migration SQL**

Create `supabase/migrations/20260618230000_profile_username_split.sql`:

```sql
-- Rename display_name -> full_name; drop the old unique constraint explicitly
-- (RENAME COLUMN preserves constraints, so we drop it by name).
alter table public.profiles rename column display_name to full_name;
alter table public.profiles drop constraint if exists profiles_display_name_key;
alter table public.profiles alter column full_name drop not null;

-- Add nullable columns (gate preenche username; email backfilled from auth.users)
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists email text;

-- Unique partial indexes (case-insensitive; both allow multiple NULLs)
create unique index if not exists profiles_username_unique
  on public.profiles(lower(username)) where username is not null;
create unique index if not exists profiles_email_unique
  on public.profiles(lower(email)) where email is not null;

-- Backfill email from auth.users for existing profiles
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- Recreate handle_new_user for new schema (username stays NULL until gate)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', null),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;
```

- [ ] **Step 2: Reset local Supabase to apply migration**

Run: `supabase db reset`
Expected: migration applies cleanly; `supabase db reset` exits 0. If `supabase` CLI is not running, start it with `supabase start` first.

- [ ] **Step 3: Verify schema**

Run: `supabase db describe` (or inspect via `psql`):
```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "\d public.profiles"
```
Expected: table has `full_name`, `username`, `email` columns; no `display_name`; no `profiles_display_name_key` constraint; `profiles_username_unique` and `profiles_email_unique` indexes exist.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260618230000_profile_username_split.sql
git commit -m "feat: add profile_username_split migration (full_name, username, email)"
```

---

## Task 2: Profile Type in packages/types

**Files:**
- Modify: `packages/types/src/index.ts`

**Interfaces:**
- Produces: `export interface Profile { id: string; username: string | null; full_name: string | null; email: string | null; avatar_url: string | null; xp: number; level: number; banned: boolean; created_at: string; updated_at: string }`

- [ ] **Step 1: Add Profile interface to packages/types**

Append to `packages/types/src/index.ts` (after the existing `export type { ... } from '@minesweeper/engine'`):

```ts
export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  email: string | null
  avatar_url: string | null
  xp: number
  level: number
  banned: boolean
  created_at: string
  updated_at: string
}
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm --filter @minesweeper/types typecheck`
Expected: PASS (no errors). If `typecheck` script doesn't exist, run `pnpm typecheck` at root and confirm no errors in `packages/types`.

- [ ] **Step 3: Commit**

```bash
git add packages/types/src/index.ts
git commit -m "feat: add Profile interface to packages/types"
```

---

## Task 3: API Profiles Routes + Tests

**Files:**
- Create: `apps/api/api/routes/profiles.ts`
- Create: `apps/api/src/__tests__/profiles.test.ts`
- Modify: `apps/api/api/index.ts`

**Interfaces:**
- Consumes: `requireAuth`, `requireNotBanned`, `AuthenticatedRequest` from `../middleware/auth`; `query`, `queryOne` from `../utils/supabase`; `Profile` from `@minesweeper/types`.
- Produces:
  - `GET /api/profiles/me` → `{ profile: Profile }` (401 if not auth, 404 if no profile)
  - `GET /api/profiles/username-available?u=<username>` → `{ available: boolean, reason?: 'taken' | 'invalid' | 'banned' }` (401 if not auth, 400 if regex fail)
  - `PATCH /api/profiles/me` body `{ username: string, full_name?: string }` → `{ profile: Profile }` (401, 400 invalid/banned, 409 taken)

- [ ] **Step 1: Write the failing tests**

Create `apps/api/src/__tests__/profiles.test.ts`:

```ts
import { describe, it, expect, vi, afterAll } from 'vitest'
import { createServer } from 'node:http'

const mockQuery = vi.fn()
const mockQueryOne = vi.fn()

vi.mock('../../api/utils/supabase', () => ({
  query: mockQuery,
  queryOne: mockQueryOne,
}))

async function createTestServer(path: string, options?: RequestInit) {
  const { default: app } = await import('../../api/index')
  return new Promise<Response>((resolve, reject) => {
    const server = createServer(app)
    server.listen(0, () => {
      const addr = server.address()
      if (!addr || typeof addr === 'string') {
        reject(new Error('Failed to get address'))
        return
      }
      const url = `http://localhost:${addr.port}${path}`
      fetch(url, options)
        .then(res => { server.close(); resolve(res) })
        .catch(err => { server.close(); reject(err) })
    })
  })
}

const realFetch = globalThis.fetch

function mockAuthFetch() {
  vi.restoreAllMocks()
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as any).url
    if (url.includes('/auth/v1/user')) {
      const token = init?.headers && typeof init.headers === 'object' && !Array.isArray(init.headers)
        ? (init.headers as Record<string, string>)['Authorization']?.replace('Bearer ', '')
        : undefined
      if (token === 'invalid-token') return new Response(null, { status: 401 })
      return new Response(JSON.stringify({ id: 'test-user-id' }), { status: 200 })
    }
    if (url.startsWith('http://localhost')) return realFetch(input, init)
    return new Response(null, { status: 404 })
  })
}

describe('GET /api/profiles/me', () => {
  afterAll(() => vi.restoreAllMocks())

  it('returns 401 without auth', async () => {
    mockAuthFetch()
    const res = await createTestServer('/api/profiles/me')
    expect(res.status).toBe(401)
  })

  it('returns profile when username is null', async () => {
    mockAuthFetch()
    mockQueryOne.mockResolvedValueOnce({ banned: false })
    mockQueryOne.mockResolvedValueOnce({
      id: 'test-user-id', username: null, full_name: 'Player', email: 'p@example.com',
      avatar_url: null, xp: 0, level: 1, banned: false, created_at: '2026-01-01', updated_at: '2026-01-01',
    })
    const res = await createTestServer('/api/profiles/me', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.profile.username).toBeNull()
  })

  it('returns profile when username is set', async () => {
    mockAuthFetch()
    mockQueryOne.mockResolvedValueOnce({ banned: false })
    mockQueryOne.mockResolvedValueOnce({
      id: 'test-user-id', username: 'alice', full_name: 'Alice', email: 'a@example.com',
      avatar_url: null, xp: 100, level: 2, banned: false, created_at: '2026-01-01', updated_at: '2026-01-01',
    })
    const res = await createTestServer('/api/profiles/me', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.profile.username).toBe('alice')
  })

  it('returns 404 when profile not found', async () => {
    mockAuthFetch()
    mockQueryOne.mockResolvedValueOnce({ banned: false })
    mockQueryOne.mockResolvedValueOnce(null)
    const res = await createTestServer('/api/profiles/me', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(404)
  })
})

describe('GET /api/profiles/username-available', () => {
  afterAll(() => vi.restoreAllMocks())

  it('returns 401 without auth', async () => {
    mockAuthFetch()
    const res = await createTestServer('/api/profiles/username-available?u=alice')
    expect(res.status).toBe(401)
  })

  it('returns available=true when username is free', async () => {
    mockAuthFetch()
    mockQueryOne.mockResolvedValueOnce({ banned: false })
    mockQueryOne.mockResolvedValueOnce(null)
    const res = await createTestServer('/api/profiles/username-available?u=newname', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.available).toBe(true)
  })

  it('returns available=false with reason=taken when username exists', async () => {
    mockAuthFetch()
    mockQueryOne.mockResolvedValueOnce({ banned: false })
    mockQueryOne.mockResolvedValueOnce({ id: 'other-user' })
    const res = await createTestServer('/api/profiles/username-available?u=alice', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.available).toBe(false)
    expect(body.reason).toBe('taken')
  })

  it('returns available=false with reason=invalid for bad regex', async () => {
    mockAuthFetch()
    mockQueryOne.mockResolvedValueOnce({ banned: false })
    const res = await createTestServer('/api/profiles/username-available?u=ab', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.available).toBe(false)
    expect(body.reason).toBe('invalid')
  })

  it('returns available=false with reason=banned for reserved word', async () => {
    mockAuthFetch()
    mockQueryOne.mockResolvedValueOnce({ banned: false })
    const res = await createTestServer('/api/profiles/username-available?u=admin', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.available).toBe(false)
    expect(body.reason).toBe('banned')
  })
})

describe('PATCH /api/profiles/me', () => {
  afterAll(() => vi.restoreAllMocks())

  it('returns 401 without auth', async () => {
    mockAuthFetch()
    const res = await createTestServer('/api/profiles/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alice' }),
    })
    expect(res.status).toBe(401)
  })

  it('updates username and returns profile', async () => {
    mockAuthFetch()
    mockQueryOne.mockResolvedValueOnce({ banned: false })
    mockQueryOne.mockResolvedValueOnce(null)
    mockQueryOne.mockResolvedValueOnce({
      id: 'test-user-id', username: 'alice', full_name: 'Alice', email: 'a@example.com',
      avatar_url: null, xp: 0, level: 1, banned: false, created_at: '2026-01-01', updated_at: '2026-06-18',
    })
    const res = await createTestServer('/api/profiles/me', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alice', full_name: 'Alice' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.profile.username).toBe('alice')
  })

  it('returns 400 for invalid username regex', async () => {
    mockAuthFetch()
    mockQueryOne.mockResolvedValueOnce({ banned: false })
    const res = await createTestServer('/api/profiles/me', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ab' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 for banned word', async () => {
    mockAuthFetch()
    mockQueryOne.mockResolvedValueOnce({ banned: false })
    const res = await createTestServer('/api/profiles/me', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 409 when username taken', async () => {
    mockAuthFetch()
    mockQueryOne.mockResolvedValueOnce({ banned: false })
    mockQueryOne.mockResolvedValueOnce({ id: 'other-user' })
    const res = await createTestServer('/api/profiles/me', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alice' }),
    })
    expect(res.status).toBe(409)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @minesweeper/api test`
Expected: FAIL — tests can't find `/api/profiles` route (404 responses, not the expected status codes).

- [ ] **Step 3: Create the profiles router**

Create `apps/api/api/routes/profiles.ts`:

```ts
import { Router } from 'express'
import { queryOne } from '../utils/supabase'
import { requireAuth, requireNotBanned } from '../middleware/auth'
import type { AuthenticatedRequest } from '../middleware/auth'
import type { Response } from 'express'
import type { Profile } from '@minesweeper/types'

const router = Router()

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/
const BANNED_WORDS = ['admin', 'root', 'system', 'null', 'undefined', 'auth', 'api', 'support', 'me', 'mine', 'minesweeper', 'official']

function isBannedWord(username: string): boolean {
  return BANNED_WORDS.includes(username.toLowerCase())
}

function validateUsername(username: string): { valid: boolean; reason?: 'invalid' | 'banned' } {
  if (!USERNAME_REGEX.test(username)) return { valid: false, reason: 'invalid' }
  if (isBannedWord(username)) return { valid: false, reason: 'banned' }
  return { valid: true }
}

const PROFILE_COLUMNS = `id, username, full_name, email, avatar_url, xp, level, banned, created_at, updated_at`

router.get('/me', requireAuth, requireNotBanned, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = await queryOne<Profile>(
      `select ${PROFILE_COLUMNS} from public.profiles where id = $1`,
      [req.userId]
    )
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' })
      return
    }
    res.json({ profile })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/username-available', requireAuth, requireNotBanned, async (req: AuthenticatedRequest, res: Response) => {
  const username = (req.query.u as string) ?? ''

  const { valid, reason } = validateUsername(username)
  if (!valid) {
    res.json({ available: false, reason })
    return
  }

  try {
    const existing = await queryOne<{ id: string }>(
      `select id from public.profiles where lower(username) = lower($1) limit 1`,
      [username]
    )
    res.json({ available: !existing, reason: existing ? 'taken' : undefined })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/me', requireAuth, requireNotBanned, async (req: AuthenticatedRequest, res: Response) => {
  const { username, full_name } = req.body ?? {}

  if (typeof username !== 'string') {
    res.status(400).json({ error: 'invalid_username' })
    return
  }

  const { valid, reason } = validateUsername(username)
  if (!valid) {
    res.status(400).json({ error: reason === 'banned' ? 'banned_username' : 'invalid_username' })
    return
  }

  if (full_name !== undefined && typeof full_name !== 'string') {
    res.status(400).json({ error: 'invalid_full_name' })
    return
  }

  if (typeof full_name === 'string' && full_name.length > 80) {
    res.status(400).json({ error: 'invalid_full_name' })
    return
  }

  try {
    const existing = await queryOne<{ id: string }>(
      `select id from public.profiles where lower(username) = lower($1) and id <> $2 limit 1`,
      [username, req.userId]
    )
    if (existing) {
      res.status(409).json({ error: 'username_taken' })
      return
    }

    const profile = await queryOne<Profile>(
      `update public.profiles
       set username = $1, full_name = coalesce($2, full_name), updated_at = now()
       where id = $3
       returning ${PROFILE_COLUMNS}`,
      [username, full_name ?? null, req.userId]
    )

    if (!profile) {
      res.status(404).json({ error: 'Profile not found' })
      return
    }

    res.json({ profile })
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'username_taken' })
      return
    }
    res.status(500).json({ error: err.message })
  }
})

export default router
```

- [ ] **Step 4: Register the router in apps/api/api/index.ts**

Add import after `adminRouter` import line:

```ts
import profilesRouter from './routes/profiles'
```

Add registration after `app.use('/api/admin', adminRouter)`:

```ts
app.use('/api/profiles', profilesRouter)
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter @minesweeper/api test`
Expected: PASS — all 11 new profiles tests pass; existing tests still pass.

- [ ] **Step 6: Run typecheck and lint**

Run: `pnpm --filter @minesweeper/api typecheck && pnpm --filter @minesweeper/api lint`
Expected: PASS (no errors).

- [ ] **Step 7: Commit**

```bash
git add apps/api/api/routes/profiles.ts apps/api/api/index.ts apps/api/src/__tests__/profiles.test.ts
git commit -m "feat: add /api/profiles routes (me, username-available, patch me)"
```

---

## Task 4: Update API Consumers of display_name

**Files:**
- Modify: `apps/api/api/routes/leaderboard.ts:69`
- Modify: `apps/api/api/routes/stats.ts:58`
- Modify: `apps/api/api/routes/admin.ts:44,46,77,84-86,139,140`
- Modify: `apps/api/src/seed.ts:69`
- Modify: `apps/api/src/__tests__/routes.test.ts:224`

**Interfaces:**
- Consumes: new schema columns `username`, `full_name`, `email`.
- Produces: leaderboard/stats/admin endpoints return `username` (+ `full_name` where relevant); admin search works on `username`, `email`, `full_name`.

- [ ] **Step 1: Update leaderboard.ts query**

In `apps/api/api/routes/leaderboard.ts:69`, replace `p.display_name` with `p.username, p.full_name`:

```ts
const data = await query(
  `select le.*, p.username, p.full_name, p.avatar_url, g.width, g.height, g.mine_count
   from public.leaderboard_entries le
   join public.profiles p on p.id = le.user_id
   ${GAMES_JOIN}
   where le.difficulty = $1 and p.banned = false ${q.customWhereSql} ${q.periodSql}
   order by le.duration_ms asc
   limit $${q.params.length + 1} offset $${q.params.length + 2}`,
  listParams
)
```

(Only the `select` list changes; the rest of the query stays the same.)

- [ ] **Step 2: Update stats.ts public route**

In `apps/api/api/routes/stats.ts:58`, replace `display_name` with `username, full_name`:

```ts
const profile = await queryOne<any>(
  `select id, username, full_name, avatar_url, xp, level from public.profiles where id = $1`,
  [userId]
)
```

- [ ] **Step 3: Update admin.ts user search**

In `apps/api/api/routes/admin.ts:44-47`, change the `ilike` search to search across `username`, `email`, and `full_name`:

```ts
if (search) {
  sql = `select id, username, full_name, email, xp, level, is_admin, banned, banned_at, created_at, updated_at
         from public.profiles
         where username ilike $1 or email ilike $1 or full_name ilike $1
         order by created_at desc limit $2 offset $3`
  params = [`%${search}%`, limit, offset]
  countSql = `select count(*)::int as count from public.profiles
              where username ilike $1 or email ilike $1 or full_name ilike $1`
  countParams = [`%${search}%`]
} else {
  sql = `select id, username, full_name, email, xp, level, is_admin, banned, banned_at, created_at, updated_at
         from public.profiles order by created_at desc limit $1 offset $2`
  params = [limit, offset]
  countSql = `select count(*)::int as count from public.profiles`
  countParams = []
}
```

- [ ] **Step 4: Update admin.ts PATCH user**

In `apps/api/api/routes/admin.ts:77`, destructure `username`, `full_name`, `is_admin`, `banned` (drop `display_name`):

```ts
const { id } = req.params
const { username, full_name, is_admin, banned } = req.body
```

At lines 84-86, replace the `display_name` block with `username` + `full_name`:

```ts
if (username !== undefined) {
  setClauses.push(`username = $${paramIndex++}`)
  params.push(username)
}
if (full_name !== undefined) {
  setClauses.push(`full_name = $${paramIndex++}`)
  params.push(full_name)
}
```

- [ ] **Step 5: Update admin.ts top-players query**

At `apps/api/api/routes/admin.ts:139-140`, change `display_name` to `username`:

```ts
const topPlayers = await query<{ username: string; xp: number }>(
  `select username, xp from public.profiles where banned = false order by xp desc limit 10`
)
```

- [ ] **Step 6: Update seed.ts**

At `apps/api/src/seed.ts:69`, replace `display_name` with `full_name` and add `username`:

```ts
await pool.query(
  `update public.profiles set full_name = $1, username = $2, xp = $3, level = $4 where id = $5`,
  ['Player Teste', 'player_teste', 250, 3, userId]
)
```

- [ ] **Step 7: Update routes.test.ts mock**

At `apps/api/src/__tests__/routes.test.ts:224`, replace `display_name: 'Test'` with the new columns:

```ts
mockQueryOne.mockResolvedValueOnce({ id: 'test-user-id', username: 'test', full_name: 'Test', xp: 500, level: 3 })
```

- [ ] **Step 8: Run all API tests + typecheck**

Run: `pnpm --filter @minesweeper/api test && pnpm --filter @minesweeper/api typecheck && pnpm --filter @minesweeper/api lint`
Expected: PASS — all tests green, no type errors.

- [ ] **Step 9: Verify no display_name references remain in apps/api**

Run: `grep -rn "display_name" apps/api/api apps/api/src`
Expected: no matches (only allowed: none — all references migrated).

- [ ] **Step 10: Commit**

```bash
git add apps/api/api/routes/leaderboard.ts apps/api/api/routes/stats.ts apps/api/api/routes/admin.ts apps/api/src/seed.ts apps/api/src/__tests__/routes.test.ts
git commit -m "refactor: migrate API consumers from display_name to username/full_name"
```

---

## Task 5: Update Web Consumers of display_name

**Files:**
- Modify: `apps/web/src/app/leaderboard/page.tsx:16,28,199,207`
- Modify: `apps/web/src/app/profile/page.tsx:12`
- Modify: `apps/web/src/app/profile/[userId]/page.tsx:11,70`
- Modify: `apps/web/src/lib/__tests__/api.test.ts:54,64`

**Interfaces:**
- Consumes: new API response shape with `username` (and `full_name` where returned).
- Produces: web pages display `username` (with `full_name` as subtitle where available).

- [ ] **Step 1: Update leaderboard page types and render**

In `apps/web/src/app/leaderboard/page.tsx`:

At line 16, replace `display_name: string` in `Entry` interface with `username: string` and add `full_name?: string | null`:

```ts
interface Entry {
  id: string
  user_id: string
  duration_ms: number
  difficulty: string
  created_at: string
  username: string
  full_name?: string | null
  avatar_url: string | null
  rank?: number
  width?: number
  height?: number
  mine_count?: number
}
```

At line 28, replace `display_name: string` in `MyEntry` interface with `username: string`:

```ts
interface MyEntry {
  id: string
  duration_ms: number
  rank: number
  username: string
}
```

At line 199, change the `isMe` comparison:

```ts
const isMe = user && entry.username && myEntry?.username === entry.username
```

At line 207, change the render to show `username`:

```ts
<Link href={`/profile/${entry.user_id}`} className={styles.playerLink}>
  {entry.username}
</Link>
```

- [ ] **Step 2: Update profile/page.tsx type**

At `apps/web/src/app/profile/page.tsx:12`, replace `display_name: string` with `username: string` + `full_name: string | null`:

```ts
interface ProfileData {
  profile: { xp: number; level: number; username: string; full_name: string | null; avatar_url: string | null }
  games: { total_games: number; wins: number; losses: number; avg_win_time_ms: number; best_time_ms: number }
}
```

(The render at line 65 already shows `user.email`; no other display_name render in this file. Leave it.)

- [ ] **Step 3: Update profile/[userId]/page.tsx type and render**

At `apps/web/src/app/profile/[userId]/page.tsx:11`, replace the type:

```ts
interface ProfileData {
  profile: { xp: number; level: number; username: string; full_name: string | null; avatar_url: string | null }
  games: { total_games: number; wins: number; losses: number; avg_win_time_ms: number; best_time_ms: number }
}
```

At line 70, replace `{profile.display_name}` with `{profile.username}`:

```tsx
<h1>{profile.username}</h1>
{profile.full_name && <p className={styles.emailLabel}>{profile.full_name}</p>}
```

(Uses the existing `.emailLabel` style from `page.module.css` for the subtitle — same visual treatment as the email label on the own-profile page.)

- [ ] **Step 4: Update api.test.ts mock**

At `apps/web/src/lib/__tests__/api.test.ts:54,64`, replace `display_name: 'Player'` with `username: 'player', full_name: 'Player'`:

```ts
json: () => Promise.resolve({ profile: { username: 'player', full_name: 'Player' } }),
```

And the assertion:

```ts
expect(result).toEqual({ profile: { username: 'player', full_name: 'Player' } })
```

- [ ] **Step 5: Run web tests + typecheck + lint**

Run: `pnpm --filter @minesweeper/web test && pnpm --filter @minesweeper/web typecheck && pnpm --filter @minesweeper/web lint`
Expected: PASS.

- [ ] **Step 6: Verify no display_name references remain in apps/web**

Run: `grep -rn "display_name" apps/web/src`
Expected: no matches.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/leaderboard/page.tsx apps/web/src/app/profile/page.tsx apps/web/src/app/profile/[userId]/page.tsx apps/web/src/lib/__tests__/api.test.ts
git commit -m "refactor: migrate web consumers from display_name to username/full_name"
```

---

## Task 6: Update Admin App Consumers of display_name

**Files:**
- Modify: `apps/admin/src/app/dashboard/page.tsx:16,21,161,198`

**Interfaces:**
- Consumes: new API response shape with `username` and `email`.
- Produces: admin dashboard displays `username` (with `email`); search works against new fields.

- [ ] **Step 1: Update Stats and User interfaces**

At `apps/admin/src/app/dashboard/page.tsx:16`, replace `display_name: string` in `topPlayers` with `username: string`:

```ts
interface Stats {
  totalUsers: number
  totalGames: number
  wonGames: number
  lostGames: number
  winRate: number
  gamesByDifficulty: Record<string, number>
  topPlayers: Array<{ username: string; xp: number }>
}
```

At line 21, replace `display_name: string` in `User` with `username: string` + `email: string | null`:

```ts
interface User {
  id: string
  username: string
  full_name: string | null
  email: string | null
  xp: number
  level: number
  is_admin: boolean
  banned: boolean
  banned_at: string | null
  created_at: string
}
```

- [ ] **Step 2: Update top-players render**

At line 161, change `{p.display_name}` to `{p.username}`:

```tsx
<li key={i}>{p.username} — {p.xp} XP</li>
```

- [ ] **Step 3: Update users table render**

At line 198, change `{u.display_name}` to show `username` + `email`:

```tsx
<td>{u.username}<br /><small>{u.email}</small></td>
```

- [ ] **Step 4: Update search placeholder**

At line 171, change the placeholder to reflect the new search scope:

```tsx
<input
  placeholder="Search by username, email, or name..."
  value={search}
  onChange={e => setSearch(e.target.value)}
  onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
/>
```

- [ ] **Step 5: Run admin typecheck + lint**

Run: `pnpm --filter @minesweeper/admin typecheck && pnpm --filter @minesweeper/admin lint`
Expected: PASS.

- [ ] **Step 6: Verify no display_name references remain in apps/admin**

Run: `grep -rn "display_name" apps/admin/src`
Expected: no matches.

- [ ] **Step 7: Commit**

```bash
git add apps/admin/src/app/dashboard/page.tsx
git commit -m "refactor: migrate admin dashboard from display_name to username/email"
```

---

## Task 7: Extend api client with profiles methods

**Files:**
- Modify: `apps/web/src/lib/api.ts`

**Interfaces:**
- Consumes: `Profile` from `@minesweeper/types`.
- Produces:
  - `api.profiles.me()` → `Promise<{ profile: Profile }>`
  - `api.profiles.usernameAvailable(username: string)` → `Promise<{ available: boolean; reason?: 'taken' | 'invalid' | 'banned' }>`
  - `api.profiles.updateMe(data: { username: string; full_name?: string })` → `Promise<{ profile: Profile }>`

- [ ] **Step 1: Add the profiles namespace to api.ts**

At the top of `apps/web/src/lib/api.ts`, add the import:

```ts
import type { Profile } from '@minesweeper/types'
```

Before the closing `}` of the `api` object (after the `achievements` namespace), add:

```ts
  profiles: {
    me: () => request<{ profile: Profile }>('/api/profiles/me'),

    usernameAvailable: (username: string) =>
      request<{ available: boolean; reason?: 'taken' | 'invalid' | 'banned' }>(
        `/api/profiles/username-available?u=${encodeURIComponent(username)}`
      ),

    updateMe: (data: { username: string; full_name?: string }) =>
      request<{ profile: Profile }>('/api/profiles/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },
```

- [ ] **Step 2: Run typecheck + lint**

Run: `pnpm --filter @minesweeper/web typecheck && pnpm --filter @minesweeper/web lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/api.ts
git commit -m "feat: add api.profiles.{me, usernameAvailable, updateMe} client methods"
```

---

## Task 8: Supabase Client PKCE Config

**Files:**
- Modify: `apps/web/src/lib/supabase.ts`

**Interfaces:**
- Produces: `supabase` client configured with `flowType: 'pkce'`, `detectSessionInUrl: true`, `persistSession: true`.

- [ ] **Step 1: Update supabase.ts**

Replace the contents of `apps/web/src/lib/supabase.ts` with:

```ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

if (!supabaseUrl) {
  throw new Error(
    'supabaseUrl is required. Configure NEXT_PUBLIC_SUPABASE_URL no seu .env.local'
  )
}

if (!supabaseAnonKey) {
  throw new Error(
    'supabaseAnonKey is required. Configure NEXT_PUBLIC_SUPABASE_ANON_KEY no seu .env.local'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: true,
    persistSession: true,
  },
})
```

- [ ] **Step 2: Run typecheck + lint + tests**

Run: `pnpm --filter @minesweeper/web typecheck && pnpm --filter @minesweeper/web lint && pnpm --filter @minesweeper/web test`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/supabase.ts
git commit -m "feat: configure supabase client with PKCE flow"
```

---

## Task 9: Auth Callback Route

**Files:**
- Create: `apps/web/src/app/auth/callback/route.ts`

**Interfaces:**
- Consumes: `supabase` from `../../../lib/supabase`.
- Produces: `GET /auth/callback` handler that exchanges `?code=...` for session and redirects to `next` (default `/`), or to `/auth?error=oauth` on failure.

- [ ] **Step 1: Create the callback route**

Create `apps/web/src/app/auth/callback/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }
  return NextResponse.redirect(`${origin}/auth?error=oauth`)
}
```

- [ ] **Step 2: Run typecheck + lint**

Run: `pnpm --filter @minesweeper/web typecheck && pnpm --filter @minesweeper/web lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/auth/callback/route.ts
git commit -m "feat: add /auth/callback route for PKCE code exchange"
```

---

## Task 10: Supabase config.toml + .env.example

**Files:**
- Modify: `supabase/config.toml`
- Modify: `.env.example`

**Interfaces:**
- Produces: Google + GitHub providers enabled with `env()`-substituted secrets; Apple remains `enabled = false`; `additional_redirect_urls` includes callback URLs.

- [ ] **Step 1: Update additional_redirect_urls in config.toml**

In `supabase/config.toml`, find the existing `additional_redirect_urls = ["https://127.0.0.1:3000"]` line (around line 163) and replace it with:

```toml
additional_redirect_urls = [
  "https://127.0.0.1:3000",
  "http://localhost:3000/auth/callback",
  "http://127.0.0.1:3000/auth/callback"
]
```

- [ ] **Step 2: Replace the [auth.external.apple] block and add google + github**

Find the existing `[auth.external.apple]` block (around line 322) and replace it with three provider blocks:

```toml
[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
redirect_uri = "http://localhost:3000/auth/callback"
skip_nonce_check = false
# If enabled, the nonce check will be skipped. Required for local sign in with Google auth.
# url = ""
# email_optional = false

[auth.external.github]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET)"
redirect_uri = "http://localhost:3000/auth/callback"

[auth.external.apple]
enabled = false
client_id = ""
secret = "env(SUPABASE_AUTH_EXTERNAL_APPLE_SECRET)"
redirect_uri = ""
url = ""
skip_nonce_check = false
email_optional = false
```

- [ ] **Step 3: Update .env.example**

Append to `.env.example`:

```
# OAuth providers (Supabase Auth)
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your-google-client-id
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your-google-client-secret
SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID=your-github-client-id
SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET=your-github-client-secret
SUPABASE_AUTH_EXTERNAL_APPLE_SECRET=your-apple-client-secret
```

- [ ] **Step 4: Restart Supabase to pick up config changes**

Run: `supabase stop && supabase start`
Expected: Supabase restarts with new provider config. (If you haven't added real Google/GitHub secrets to `..env.local`, the providers will be enabled but auth calls will fail until secrets are present — that's expected; real verification happens in Task 16.)

- [ ] **Step 5: Commit**

```bash
git add supabase/config.toml .env.example
git commit -m "feat: enable Google + GitHub OAuth providers in supabase config"
```

---

## Task 11: AuthContext Gate Logic + Tests

**Files:**
- Modify: `apps/web/src/contexts/AuthContext.tsx`
- Create: `apps/web/src/contexts/__tests__/AuthContext.test.tsx`

**Interfaces:**
- Consumes: `api.profiles.me()` from `../lib/api`, `useRouter` from `next/navigation`.
- Produces: `AuthProvider` that, on `session?.user` change, fetches profile and redirects to `/setup-username` if `profile.username === null`. Unauthenticated users never trigger the gate.

- [ ] **Step 1: Write the failing tests**

Create `apps/web/src/contexts/__tests__/AuthContext.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import type { ReactNode } from 'react'

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signInWithOAuth: vi.fn(),
  signOut: vi.fn(),
  profilesMe: vi.fn(),
  push: vi.fn(),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
      signUp: mocks.signUp,
      signInWithPassword: mocks.signInWithPassword,
      signInWithOAuth: mocks.signInWithOAuth,
      signOut: mocks.signOut,
    },
  },
}))

vi.mock('../../lib/api', () => ({
  api: {
    profiles: { me: mocks.profilesMe },
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}))

import { AuthProvider } from '../AuthContext'

function renderWithProvider(ui: ReactNode) {
  return render(<AuthProvider>{ui}</AuthProvider>)
}

beforeEach(() => {
  vi.restoreAllMocks()
  mocks.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
  mocks.push.mockReset()
})

afterEach(cleanup)

describe('AuthProvider username gate', () => {
  it('does not redirect when user is null (no session)', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null } })
    renderWithProvider(<div>child</div>)
    await new Promise(r => setTimeout(r, 0))
    expect(mocks.profilesMe).not.toHaveBeenCalled()
    expect(mocks.push).not.toHaveBeenCalledWith('/setup-username')
  })

  it('redirects to /setup-username when profile.username is null', async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' }, access_token: 'tok' } },
    })
    mocks.profilesMe.mockResolvedValue({ profile: { username: null, full_name: null } })
    renderWithProvider(<div>child</div>)
    await new Promise(r => setTimeout(r, 10))
    expect(mocks.profilesMe).toHaveBeenCalled()
    expect(mocks.push).toHaveBeenCalledWith('/setup-username')
  })

  it('does not redirect when profile.username is set', async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' }, access_token: 'tok' } },
    })
    mocks.profilesMe.mockResolvedValue({ profile: { username: 'alice', full_name: 'Alice' } })
    renderWithProvider(<div>child</div>)
    await new Promise(r => setTimeout(r, 10))
    expect(mocks.profilesMe).toHaveBeenCalled()
    expect(mocks.push).not.toHaveBeenCalledWith('/setup-username')
  })

  it('does not throw or redirect when api.profiles.me rejects (network error)', async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' }, access_token: 'tok' } },
    })
    mocks.profilesMe.mockRejectedValue(new Error('network'))
    renderWithProvider(<div>child</div>)
    await new Promise(r => setTimeout(r, 10))
    expect(mocks.push).not.toHaveBeenCalledWith('/setup-username')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @minesweeper/web test`
Expected: FAIL — current `AuthContext` doesn't call `api.profiles.me()` or redirect. The "redirect when username null" test will fail.

- [ ] **Step 3: Update AuthContext with gate logic**

Replace the contents of `apps/web/src/contexts/AuthContext.tsx`:

```tsx
'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithProvider: (provider: 'google' | 'apple' | 'github') => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
      if (data.session?.user) {
        api.profiles.me()
          .then(({ profile }) => {
            if (profile && !profile.username) {
              router.push('/setup-username')
            }
          })
          .catch(() => {})
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        api.profiles.me()
          .then(({ profile }) => {
            if (profile && !profile.username) {
              router.push('/setup-username')
            }
          })
          .catch(() => {})
      }
    })

    return () => listener?.subscription.unsubscribe()
  }, [router])

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signInWithProvider = useCallback(async (provider: 'google' | 'apple' | 'github') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: '/auth/callback' },
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signInWithProvider, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @minesweeper/web test`
Expected: PASS — all 4 new gate tests pass; existing ThemeContext tests still pass.

- [ ] **Step 5: Run typecheck + lint**

Run: `pnpm --filter @minesweeper/web typecheck && pnpm --filter @minesweeper/web lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/contexts/AuthContext.tsx apps/web/src/contexts/__tests__/AuthContext.test.tsx
git commit -m "feat: add username gate to AuthContext (redirect to /setup-username when null)"
```

---

## Task 12: /setup-username Page

**Files:**
- Create: `apps/web/src/app/setup-username/page.tsx`
- Create: `apps/web/src/app/setup-username/page.module.css`

**Interfaces:**
- Consumes: `useAuth` (for OAuth user metadata), `api.profiles.usernameAvailable` + `api.profiles.updateMe`, `useI18n`, `useRouter`.
- Produces: page at `/setup-username` with username input (debounced 400ms validation), optional `full_name` input, submit button disabled until `available === true`.

- [ ] **Step 1: Create the page styles**

Create `apps/web/src/app/setup-username/page.module.css` (reuses auth page visual identity):

```css
.page {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px 16px;
}

.backLink {
  display: inline-block;
  margin-bottom: 16px;
  color: var(--color-primary, #2563eb);
  text-decoration: none;
  font-size: 14px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 320px;
}

.input {
  padding: 10px 12px;
  font-size: 16px;
  border: 1px solid var(--color-border, #d4d4d4);
  border-radius: 6px;
}

.submitBtn {
  padding: 10px;
  font-size: 16px;
  border: none;
  border-radius: 6px;
  background: var(--color-primary, #2563eb);
  color: white;
  cursor: pointer;
}

.submitBtn:disabled {
  background: var(--color-border, #d4d4d4);
  cursor: not-allowed;
}

.submitBtn:not(:disabled):hover {
  background: var(--color-primary-hover, #1d4ed8);
}

.feedback {
  font-size: 14px;
  min-height: 20px;
}

.available {
  color: var(--color-success, #16a34a);
}

.taken {
  color: var(--color-danger, #dc2626);
}

.error {
  color: var(--color-danger, #dc2626);
  font-size: 14px;
}
```

- [ ] **Step 2: Create the page**

Create `apps/web/src/app/setup-username/page.tsx`:

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { useI18n } from '../../contexts/I18nContext'
import { api } from '../../lib/api'
import styles from './page.module.css'

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/
const DEBOUNCE_MS = 400

type CheckState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'banned'

export default function SetupUsernamePage() {
  const { t, user } = useAuth()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [checkState, setCheckState] = useState<CheckState>('idle')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/auth')
      return
    }
    const oauthFullName =
      (user.user_metadata as { full_name?: string; name?: string } | undefined)?.full_name ??
      (user.user_metadata as { full_name?: string; name?: string } | undefined)?.name ??
      ''
    if (oauthFullName) setFullName(oauthFullName)
  }, [user, router])

  const checkUsername = useCallback(async (value: string) => {
    if (!USERNAME_REGEX.test(value)) {
      setCheckState('invalid')
      return
    }
    setCheckState('checking')
    try {
      const result = await api.profiles.usernameAvailable(value)
      if (result.available) {
        setCheckState('available')
      } else {
        setCheckState(result.reason === 'taken' ? 'taken' : result.reason === 'banned' ? 'banned' : 'invalid')
      }
    } catch {
      setCheckState('idle')
    }
  }, [])

  useEffect(() => {
    if (!username) {
      setCheckState('idle')
      return
    }
    const handle = setTimeout(() => checkUsername(username), DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [username, checkUsername])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (checkState !== 'available') return
    setSubmitting(true)
    setError('')
    try {
      await api.profiles.updateMe({ username, full_name: fullName || undefined })
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
      setSubmitting(false)
    }
  }

  const feedbackMessage = () => {
    switch (checkState) {
      case 'checking': return t.setupUsername.checking
      case 'available': return t.setupUsername.available
      case 'taken': return t.setupUsername.taken
      case 'invalid': return t.setupUsername.invalid
      case 'banned': return t.setupUsername.banned
      default: return ''
    }
  }

  const canSubmit = checkState === 'available' && !submitting

  return (
    <main className={styles.page}>
      <h1>{t.setupUsername.title}</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label>
          {t.setupUsername.username}
          <input
            className={styles.input}
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder={t.setupUsername.username}
            autoComplete="username"
            required
          />
        </label>
        {checkState !== 'idle' && (
          <p className={`${styles.feedback} ${checkState === 'available' ? styles.available : styles.taken}`}>
            {feedbackMessage()}
          </p>
        )}
        <label>
          {t.setupUsername.fullName}
          <input
            className={styles.input}
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder={t.setupUsername.fullName}
            autoComplete="name"
          />
        </label>
        <button className={styles.submitBtn} type="submit" disabled={!canSubmit}>
          {t.setupUsername.submit}
        </button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
    </main>
  )
}
```

- [ ] **Step 3: Run typecheck + lint**

Run: `pnpm --filter @minesweeper/web typecheck && pnpm --filter @minesweeper/web lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/setup-username/page.tsx apps/web/src/app/setup-username/page.module.css
git commit -m "feat: add /setup-username page with debounced availability check"
```

---

## Task 13: OAuthButton Component

**Files:**
- Create: `apps/web/src/components/OAuthButton/index.tsx`
- Create: `apps/web/src/components/OAuthButton/OAuthButton.module.css`

**Interfaces:**
- Consumes: `useI18n` for button labels.
- Produces: `<OAuthButton onProviderClick={(provider) => void} />` rendering 3 buttons (Google, GitHub enabled; Apple disabled with "Coming soon" tooltip).

- [ ] **Step 1: Create the component styles**

Create `apps/web/src/components/OAuthButton/OAuthButton.module.css`:

```css
.group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 320px;
  width: 100%;
}

.button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid var(--color-border, #d4d4d4);
  border-radius: 6px;
  background: var(--color-surface, #fff);
  color: var(--color-text, #111);
  cursor: pointer;
  width: 100%;
}

.button:not(:disabled):hover {
  background: var(--color-bg, #f5f5f5);
}

.button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
```

- [ ] **Step 2: Create the component**

Create `apps/web/src/components/OAuthButton/index.tsx`:

```tsx
'use client'

import { useI18n } from '../../contexts/I18nContext'
import styles from './OAuthButton.module.css'

type Provider = 'google' | 'apple' | 'github'

interface OAuthButtonProps {
  onProviderClick: (provider: Provider) => void
}

function GoogleIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.2-3.1-.12-.29-.52-1.46.11-3.05 0 0 .98-.31 3.2 1.18a11.1 11.1 0 0 1 5.83 0c2.22-1.49 3.2-1.18 3.2-1.18.63 1.59.23 2.76.11 3.05.75.81 1.2 1.84 1.2 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M17.05 12.04c-.03-3.07 2.51-4.55 2.62-4.62-1.43-2.09-3.66-2.38-4.45-2.41-1.87-.19-3.68 1.11-4.64 1.11-.97 0-2.44-1.09-4.02-1.06-2.05.03-3.97 1.21-5.03 3.06-2.17 3.76-.55 9.29 1.53 12.33 1.04 1.49 2.26 3.15 3.86 3.09 1.56-.06 2.14-1 4.02-1 1.87 0 2.41 1 4.04.97 1.67-.03 2.72-1.49 3.72-2.99 1.2-1.71 1.68-3.38 1.7-3.47-.04-.02-3.24-1.24-3.27-4.92zm-3.1-9.04c.85-1.03 1.42-2.46 1.27-3.88-1.22.05-2.7.81-3.58 1.84-.79.91-1.48 2.37-1.29 3.76 1.36.1 2.75-.69 3.6-1.72z"/>
    </svg>
  )
}

const PROVIDERS: { provider: Provider; icon: () => JSX.Element; disabled?: true }[] = [
  { provider: 'google', icon: GoogleIcon },
  { provider: 'github', icon: GitHubIcon },
  { provider: 'apple', icon: AppleIcon, disabled: true },
]

export function OAuthButton({ onProviderClick }: OAuthButtonProps) {
  const { t } = useI18n()

  return (
    <div className={styles.group}>
      {PROVIDERS.map(({ provider, icon: Icon, disabled }) => {
        const label = t.auth[provider]
        return (
          <button
            key={provider}
            type="button"
            className={styles.button}
            onClick={() => !disabled && onProviderClick(provider)}
            disabled={disabled}
            title={disabled ? t.auth.appleSoon : undefined}
            aria-disabled={disabled || undefined}
          >
            <Icon />
            {label}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Run typecheck + lint**

Run: `pnpm --filter @minesweeper/web typecheck && pnpm --filter @minesweeper/web lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/OAuthButton/
git commit -m "feat: add OAuthButton component (Google, GitHub, Apple-disabled)"
```

---

## Task 14: Update /auth Page

**Files:**
- Modify: `apps/web/src/app/auth/page.tsx`

**Interfaces:**
- Consumes: `OAuthButton` from `../../components/OAuthButton`, `useAuth().signInWithProvider`, `useRouter` for reading `?error=oauth` query.
- Produces: auth page with `OAuthButton` replacing the inline Google/GitHub buttons, Apple button present (disabled), error banner when `?error=oauth` is present.

- [ ] **Step 1: Update auth/page.tsx**

Replace the contents of `apps/web/src/app/auth/page.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { useI18n } from '../../contexts/I18nContext'
import { OAuthButton } from '../../components/OAuthButton'
import styles from './page.module.css'

export default function AuthPage() {
  const { t } = useI18n()
  const { signIn, signUp, signInWithProvider } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [oauthError, setOauthError] = useState(false)

  useEffect(() => {
    if (searchParams.get('error') === 'oauth') {
      setOauthError(true)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setOauthError(false)
    try {
      if (isSignUp) {
        await signUp(email, password)
      } else {
        await signIn(email, password)
      }
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleProvider = async (provider: 'google' | 'apple' | 'github') => {
    setOauthError(false)
    try {
      await signInWithProvider(provider)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OAuth failed')
    }
  }

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.backLink}>{'< Back'}</Link>
      <h1>{isSignUp ? t.auth.signUp : t.auth.signIn}</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          className={styles.input}
          type="email"
          placeholder={t.auth.email}
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          className={styles.input}
          type="password"
          placeholder={t.auth.password}
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button className={styles.submitBtn} type="submit">
          {isSignUp ? t.auth.signUp : t.auth.signIn}
        </button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
      {oauthError && <p className={styles.error}>{t.auth.oauthError}</p>}
      <hr className={styles.divider} />
      <OAuthButton onProviderClick={handleProvider} />
      <p>
        <button
          className={styles.toggleBtn}
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? t.auth.hasAccount : t.auth.noAccount}
        </button>
      </p>
    </main>
  )
}
```

- [ ] **Step 2: Run typecheck + lint + tests**

Run: `pnpm --filter @minesweeper/web typecheck && pnpm --filter @minesweeper/web lint && pnpm --filter @minesweeper/web test`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/auth/page.tsx
git commit -m "feat: use OAuthButton on auth page, show oauth error from callback"
```

---

## Task 15: i18n Strings

**Files:**
- Modify: `apps/web/src/messages/en.json`
- Modify: `apps/web/src/messages/pt-BR.json`

**Interfaces:**
- Produces: new `setupUsername` namespace + new `auth.oauthError` and `auth.appleSoon` keys in both locales.

- [ ] **Step 1: Update en.json**

In `apps/web/src/messages/en.json`, inside the `auth` object, add `oauthError` and `appleSoon` keys (alongside the existing `apple` key). Add a new `setupUsername` top-level namespace.

The `auth` block should become:

```json
"auth": {
  "signIn": "Sign In",
  "signUp": "Sign Up",
  "signOut": "Sign Out",
  "email": "Email",
  "password": "Password",
  "google": "Continue with Google",
  "apple": "Continue with Apple",
  "github": "Continue with GitHub",
  "noAccount": "Don't have an account?",
  "hasAccount": "Already have an account?",
  "oauthError": "Authentication failed. Please try again.",
  "appleSoon": "Coming soon"
},
```

Add a new top-level `setupUsername` block (after `auth`, before `settings`):

```json
"setupUsername": {
  "title": "Choose your username",
  "username": "Username",
  "fullName": "Full name (optional)",
  "available": "Available",
  "taken": "Already taken",
  "invalid": "3-20 letters, numbers, or underscore",
  "banned": "This username is not allowed",
  "submit": "Save",
  "checking": "Checking..."
},
```

- [ ] **Step 2: Update pt-BR.json**

In `apps/web/src/messages/pt-BR.json`, make the same structural changes with Portuguese strings.

The `auth` block should become:

```json
"auth": {
  "signIn": "Entrar",
  "signUp": "Cadastrar",
  "signOut": "Sair",
  "email": "Email",
  "password": "Senha",
  "google": "Continuar com Google",
  "apple": "Continuar com Apple",
  "github": "Continuar com GitHub",
  "noAccount": "Não tem conta?",
  "hasAccount": "Já tem conta?",
  "oauthError": "Falha na autenticação. Tente novamente.",
  "appleSoon": "Em breve"
},
```

Add a new top-level `setupUsername` block:

```json
"setupUsername": {
  "title": "Escolha seu username",
  "username": "Username",
  "fullName": "Nome completo (opcional)",
  "available": "Disponível",
  "taken": "Já em uso",
  "invalid": "3-20 letras, números ou underline",
  "banned": "Este username não é permitido",
  "submit": "Salvar",
  "checking": "Verificando..."
},
```

- [ ] **Step 3: Run typecheck + lint + tests**

Run: `pnpm --filter @minesweeper/web typecheck && pnpm --filter @minesweeper/web lint && pnpm --filter @minesweeper/web test`
Expected: PASS — both locale files are valid JSON, types match.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/messages/en.json apps/web/src/messages/pt-BR.json
git commit -m "feat: add setupUsername + auth.oauthError/appleSoon i18n strings"
```

---

## Task 16: Update SPEC.md and README.md

**Files:**
- Modify: `SPEC.md`
- Modify: `README.md`

**Interfaces:**
- Produces: `SPEC.md` updated `profiles` schema (full_name, username, email), CA-002 OAuth items marked. `README.md` has "OAuth provider setup" section with redirect URLs.

- [ ] **Step 1: Update SPEC.md profiles entity**

In `SPEC.md`, find the `#### profiles` block (around lines 284-292). Replace it with:

```markdown
#### profiles
- id: uuid (FK → auth.users)
- username: string (único, case-insensitive, nullable até gate pós-login)
- full_name: string? (repetível, opcional)
- email: string? (único, case-insensitive, backfilled de auth.users)
- avatar_url: string?
- xp: integer (default 0)
- level: integer (default 1)
- created_at: timestamp
- updated_at: timestamp
```

- [ ] **Step 2: Update CA-002 checkboxes in SPEC.md**

Find `### CA-002 — Contas e Autenticação` (around lines 432-437) and mark the OAuth items:

```markdown
### CA-002 — Contas e Autenticação
- [ ] Jogar anonimamente funciona sem pedir cadastro.
- [ ] Cadastro por email+senha funciona.
- [x] Login OAuth (Google/Apple/GitHub) funciona. (Google + GitHub ativos; Apple pendente Apple Developer Program)
- [ ] Vinculação de conta anônima preserva progresso. (Fora do escopo OAuth — fase futura)
- [ ] Sessão persiste entre fechar e reabrir o app.
```

- [ ] **Step 3: Add OAuth setup section to README.md**

In `README.md`, add a new section after the existing "Setup" / "Environment" section (or at the end if no such section exists). Use this content:

```markdown
## OAuth Provider Setup

To enable Google and GitHub login locally:

1. Create OAuth credentials in the provider consoles:
   - **Google**: https://console.cloud.google.com/apis/credentials
   - **GitHub**: https://github.com/settings/developers
2. Add the following redirect URI to each provider's authorized redirect URIs:
   ```
   http://localhost:3000/auth/callback
   ```
3. Set the following in your `.env.local` (Supabase will pick these up via `env(...)` in `supabase/config.toml`):
   ```
   SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=<your-client-id>
   SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=<your-secret>
   SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID=<your-client-id>
   SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET=<your-secret>
   ```
4. Restart Supabase: `supabase stop && supabase start`.

**Apple** is wired but `enabled = false` in `supabase/config.toml` until an Apple Developer Program ($99/yr) is active. To enable: obtain a Client ID + Secret, set `SUPABASE_AUTH_EXTERNAL_APPLE_SECRET`, set `enabled = true` and fill `client_id` + `redirect_uri` (must be `https://...`).
```

- [ ] **Step 4: Commit**

```bash
git add SPEC.md README.md
git commit -m "docs: update SPEC.md schema + CA-002, add OAuth setup to README"
```

---

## Task 17: Full Verification

**Files:** none (verification only).

- [ ] **Step 1: Run all tests, typecheck, lint at root**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: PASS — turbo runs all packages; no errors anywhere.

- [ ] **Step 2: Verify no display_name references remain anywhere**

Run: `grep -rn "display_name" apps/ packages/ supabase/migrations/20260618230000_profile_username_split.sql`
Expected: the only match should be inside the new migration's comment ("Rename display_name -> full_name"). No code references in `apps/` or `packages/`.

- [ ] **Step 3: Verify the new migration is idempotent**

Run: `supabase db reset`
Expected: applies cleanly (no errors about missing columns or duplicate indexes).

- [ ] **Step 4: Manual smoke test — email+senha existing user hits gate**

1. Start the stack: `supabase start` (if not running), `pnpm --filter @minesweeper/api dev`, `pnpm --filter @minesweeper/web dev`.
2. Run the seed: `pnpm --filter @minesweeper/api seed` (creates a test user with `username = 'player_teste'` after Task 4 updated the seed — this user won't hit the gate. To test the gate, manually null out the username: `psql ... -c "update profiles set username = null where email = 'test@minesweeper.local'"`).
3. Open `http://localhost:3000`, click "Sign In", log in with `test@minesweeper.local` / `test123456`.
4. Expected: redirected to `/setup-username`.
5. Type a username, see "Available" feedback, click Save.
6. Expected: redirected to `/`; profile now has username set.

- [ ] **Step 5: Manual smoke test — unauthenticated user never hits gate**

1. Sign out (or open incognito).
2. Open `http://localhost:3000`.
3. Start a new game without logging in.
4. Expected: no redirect to `/auth` or `/setup-username`; game works.

- [ ] **Step 6: Manual smoke test — OAuth flow (requires real Google/GitHub credentials in .env.local)**

If you have real OAuth credentials set up:
1. Go to `/auth`, click "Continue with Google" (or GitHub).
2. Complete the provider consent flow.
3. Expected: redirected back to `/auth/callback`, then to `/` (if profile already has username) or `/setup-username` (first OAuth login — username is null).
4. If at `/setup-username`: choose a username, save, land on `/`.

If you don't have credentials yet, skip this step and note it in the PR description.

- [ ] **Step 7: Final commit (if any fixups needed)**

If steps 1-6 surfaced any issues, fix them and commit. Otherwise no commit needed.

---

## Self-Review Checklist

After writing the plan, verify against the spec:

**Spec coverage:**
- ✅ Migration renames display_name → full_name, drops unique constraint, adds username + email, backfills email, recreates trigger — Task 1.
- ✅ `Profile` interface added to packages/types — Task 2.
- ✅ `GET /api/profiles/me`, `GET /api/profiles/username-available`, `PATCH /api/profiles/me` — Task 3.
- ✅ All API consumers of `display_name` updated — Task 4.
- ✅ All web consumers of `display_name` updated — Task 5.
- ✅ Admin app consumers updated — Task 6.
- ✅ `api` client extended with `profiles.me/usernameAvailable/updateMe` — Task 7.
- ✅ Supabase client PKCE config — Task 8.
- ✅ `/auth/callback` route — Task 9.
- ✅ `config.toml` providers enabled, `additional_redirect_urls` updated, `.env.example` updated — Task 10.
- ✅ `AuthContext` gate logic + tests — Task 11.
- ✅ `/setup-username` page with debounced validation — Task 12.
- ✅ `OAuthButton` component (3 providers, Apple disabled) — Task 13.
- ✅ `/auth` page uses `OAuthButton`, handles `?error=oauth` — Task 14.
- ✅ i18n strings in en + pt-BR — Task 15.
- ✅ SPEC.md + README.md updated — Task 16.
- ✅ Full verification + manual smoke tests — Task 17.

**Placeholder scan:** no TBDs, no "implement later", every code step shows complete code.

**Type consistency:** `Profile` interface defined in Task 2 is used consistently in Task 3 (API routes), Task 7 (api client), Task 11 (gate fetches profile). `api.profiles.me()` returns `{ profile: Profile }` consistently across API (Task 3), client (Task 7), and AuthContext (Task 11). `username: string | null` matches the nullable column in the migration (Task 1).
