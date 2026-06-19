# OAuth Providers (Google / GitHub / Apple) — Design

**Data**: 2026-06-18
**Status**: Aprovado (brainstorming)
**Fase**: Implementação pendente

---

## Contexto

O SPEC (`RF-001`, `CA-002`) exige login OAuth via Google, Apple e GitHub. O estado atual do projeto:

- `AuthContext` já expõe `signInWithProvider('google' | 'apple' | 'github')` chamando `supabase.auth.signInWithOAuth`.
- UI da `/auth` renderiza botões Google + GitHub. Apple está em i18n mas não aparece.
- `supabase/config.toml` só tem bloco `[auth.external.apple]` com `enabled = false`. Nenhum provider está ativo.
- Sem rota `/auth/callback` (necessária para fluxo PKCE).
- Schema `public.profiles` tem `display_name text UNIQUE` — não separa `full_name` (repetível) de `username` (único).
- Login é **opcional** — o jogador pode jogar anonimamente sem conta. Essa característica deve ser preservada.

---

## Objetivo

Habilitar login OAuth Google + GitHub ponta-a-ponta (PKCE + callback), preparar Apple para flip futuro, e resolver colisão de identidade introduzindo `username` único distinto de `full_name` repetível, com gate pós-login para escolha de username (OAuth e contas existentes sem username).

Login **não obrigatório**: usuários não autenticados nunca passam pelo gate de username e podem jogar livremente.

---

## Escopo

### Inclui

- Habilitar providers Google + GitHub no `supabase/config.toml` (Apple fica `enabled = false` até Apple Developer Program ativo).
- Botão Apple na `/auth` page (alinhado com Google/GitHub).
- Supabase client com `flowType: 'pkce'` + `detectSessionInUrl: true`.
- Rota `/auth/callback` que troca `code` por sessão e redireciona.
- Schema: quebrar `profiles.display_name` em `full_name` (nullable, repetível) + `username` (único case-insensitive, nullable até o gate) + `email` (único, nullable).
- Gate de username client-side no `AuthContext` (só para usuários autenticados com `username IS NULL`).
- Página `/setup-username` com validação de uniqueness em tempo real.
- Endpoints API `GET /api/profiles/username-available` + `PATCH /api/profiles/me`.
- Migration que adiciona colunas, copia `email` de `auth.users`, e deixa `username` NULL para todos (gate força setup no próximo login).
- i18n strings novas (en + pt-BR).
- Atualizar `SPEC.md` (marcar CA-002 OAuth items, ajustar modelo de dados).
- Atualizar `.env.example` com novas chaves OAuth.
- Atualizar todos os consumers de `display_name` (API: leaderboard/stats/admin/seed; Web: leaderboard/profile; Admin: dashboard) para usar `username`/`full_name` conforme decisão de UX.
- Atualizar `README.md` / `AGENTS.md` com instruções de redirect URLs nos consoles dos providers.

### Não inclui

- Login anônimo / vinculação anônimo → permanente (`RF-001` parcial — fase futura).
- Mobile (React Native) — fase futura.
- Avatar upload real (continua usando inicial do nome, conforme `RF-009`).
- E2E automatizado (Playwright) — dúvida pendente no `SPEC.md`.
- Configuração das credenciais Apple (depende Apple Developer Program $99/yr).

---

## Arquitetura

### Camadas envolvidas

```
Supabase (GoTrue + PostgreSQL)
  ├─ auth.external.google/github habilitados
  ├─ auth.external.apple pronto p/ flip (enabled = false)
  └─ profiles: full_name (repete), username (único lower), email (único)

apps/web
  ├─ lib/supabase.ts            → flowType: 'pkce', detectSessionInUrl
  ├─ app/auth/callback/route.ts → GET troca code por session, redirect
  ├─ app/auth/page.tsx          → usa OAuthButton (3 providers)
  ├─ app/setup-username/        → gate pós-login
  ├─ contexts/AuthContext.tsx   → busca profile; redirect gate quando username null
  └─ components/OAuthButton/    → encapsula 3 botões com brand styling

apps/api
  ├─ api/routes/profiles.ts     → GET /me, GET /username-available, PATCH /me
  ├─ api/middleware/auth.ts     → já existente, reusado
  └─ api/index.ts               → registra /api/profiles router

packages/types
  └─ Profile: { id, username, full_name, email, avatar_url, xp, level, ... }

supabase/migrations/<timestamp>_profile_username_split.sql
```

### Responsabilidades isoladas

- **`AuthContext`**: orquestra auth state + profile fetch + redirect gate. Não implementa UI. Não afeta usuários não autenticados.
- **`/setup-username` page**: form + validação client + chamada à API. Não orquestra auth.
- **`/api/profiles`**: validação server-side (regex, length, uniqueness case-insensitive, banned words). Não conhece UI.
- **`/auth/callback`**: única responsabilidade é trocar `code` por session e redirect. Sem lógica de negócio.
- **`OAuthButton`**: encapsula 3 botões com brand styling e SVG icons inline. Reutilizável.

### O que NÃO muda

- Engine, hooks, API de games/achievements — intocados.
- RLS policies existentes (`auth.uid() = user_id`) continuam válidas; novas colunas herdam RLS de `profiles`.
- Experiência de jogo offline / sem login — preservada. Usuário não autenticado nunca vê o gate.

### Consumers de `display_name` que PRECISAM ser atualizados

A migration renomeia `display_name` → `full_name`. Todos os consumidores abaixo referenciam `display_name` em SQL ou tipos e quebrarão se não forem atualizados. Cada um deve migrar para `username` (identificador único público) ou `full_name` (nome de exibição repetível) conforme a decisão de UX acima.

**`apps/api`**:
- `api/routes/leaderboard.ts:69,82,129` — `select p.display_name` em joins → trocar por `p.username` (com `full_name` opcional).
- `api/routes/stats.ts:58` — `select id, display_name, ...` → `select id, username, full_name, ...`.
- `api/routes/admin.ts:44,46,77,84-86,139,140` — search por `display_name ilike`, PATCH `display_name`, top-players `select display_name` → search em `username`/`email`/`full_name`, PATCH em `username`/`full_name`, top-players por `username`.
- `src/seed.ts:69` — `update profiles set display_name = ...` → `set full_name = ..., username = ...`.
- `src/__tests__/routes.test.ts:224` — mock `{ display_name: 'Test' }` → `{ username: 'test', full_name: 'Test' }`.

**`apps/web`**:
- `app/leaderboard/page.tsx:16,28,199,207` — tipos + render `entry.display_name` → `entry.username` (com `full_name` subtítulo).
- `app/profile/page.tsx:12` — tipo `profile.display_name` → `profile.username` + `profile.full_name`.
- `app/profile/[userId]/page.tsx:11,70` — tipo + render `profile.display_name` → `profile.username` (título) + `profile.full_name` (subtítulo).
- `lib/__tests__/api.test.ts:54,64` — mock `{ display_name: 'Player' }` → `{ username: 'player', full_name: 'Player' }`.

**`apps/admin`**:
- `app/dashboard/page.tsx:16,21,161,198` — tipos `topPlayers.display_name`, `users.display_name` + render → `username` + `email`.

---

## Fluxos

### Fluxo OAuth (Google / GitHub)

1. Usuário clica botão no `OAuthButton` → `signInWithOAuth({ provider, options: { redirectTo: '/auth/callback' } })`.
2. Browser vai ao provider → retorna com `?code=...` em `/auth/callback`.
3. Route handler chama `supabase.auth.exchangeCodeForSession(code)`.
4. `onAuthStateChange` dispara no `AuthContext` → busca `GET /api/profiles/me`.
5. Se `profile.username === null` → `router.push('/setup-username')`.
6. Usuário digita username → validação em tempo real (debounce 400ms) → `PATCH /api/profiles/me` → redirect `/`.

### Fluxo email+senha (passa pelo mesmo gate)

Mesmos passos 4-6. Usuários existentes com `username IS NULL` caem no gate no próximo login.

### Fluxo sem login (NÃO passa pelo gate)

- Usuário abre o app sem estar autenticado.
- `AuthContext` detecta `user === null` → não busca profile, não redireciona.
- Usuário joga livremente (offline-first, conforme `RF-012`).
- Se futuramente fizer login, o gate dispara normalmente.

---

## Detalhes técnicos

### Schema migration

Arquivo: `supabase/migrations/<timestamp>_profile_username_split.sql`

```sql
-- 1. Rename display_name -> full_name (RENAME preserves constraints; drop unique explicitly)
alter table public.profiles rename column display_name to full_name;
alter table public.profiles drop constraint if exists profiles_display_name_key;
alter table public.profiles alter column full_name drop not null;

-- 2. Add nullable columns (gate preenche username)
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists email text;

-- 3. Unique partial indexes (case-insensitive username; ambos permitem NULLs)
create unique index if not exists profiles_username_unique
  on public.profiles(lower(username)) where username is not null;
create unique index if not exists profiles_email_unique
  on public.profiles(lower(email)) where email is not null;

-- 4. Backfill email a partir de auth.users
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- 5. Recria handle_new_user para novo schema
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

**Decisão de UX — o que cada consumidor exibe**:
- **Leaderboard** (web): mostra `username` (identificador único, sem ambiguidade no ranking). Se `full_name` existir, mostra como subtítulo.
- **Perfil público** (`/profile/[userId]`): mostra `username` como título, `full_name` como subtítulo (se existir).
- **Perfil próprio** (`/profile`): mostra ambos, editáveis.
- **Admin** (`apps/admin`): lista mostra `username` + `email`; busca funciona em `username`, `email`, e `full_name`.
- **API `stats`**: retorna `username` + `full_name` + `email` (para o dono) ou só `username` + `full_name` (público).

Username fica `NULL` para todos (existentes e novos). `PATCH /api/profiles/me` é o único caminho para preenchê-lo. Unique partial index em `lower(username)` permite múltiplos NULLs (SQL standard).

### `packages/types` — Profile (nova interface)

`packages/types` hoje só re-exporta tipos do engine. `Profile` é uma **nova adição** (não existe ainda), exportada de `packages/types/src/index.ts`:

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

`is_admin` e `banned_at` existem no schema mas são intencionalmente omitidos do tipo público (não expostos ao cliente).

### API endpoints

#### `GET /api/profiles/me`

- Middleware: `requireAuth`
- Query: `select id, username, full_name, email, avatar_url, xp, level, banned, created_at, updated_at from public.profiles where id = $1`
- Response 200: `{ profile: Profile }` (username pode ser `null` — gate usa isso)
- Response 401: não autenticado
- Response 404: profile não encontrado (caso raro — trigger falhou)
- Usado pelo `AuthContext` para decidir se dispara o gate de username.

#### `GET /api/profiles/username-available?u=<username>`

- Middleware: `requireAuth`
- Validação regex: `^[a-zA-Z0-9_]{3,20}$`
- Banned words hardcoded: `admin`, `root`, `system`, `null`, `undefined`, `auth`, `api`, `support`, `me`, `mine`, `minesweeper`, `official`
- Query: `select 1 from public.profiles where lower(username) = lower($1) limit 1`
- Response 200: `{ available: boolean, reason?: 'taken' | 'invalid' | 'banned' }`
- Response 400 (regex fail): `{ available: false, reason: 'invalid' }`
- Response 401: não autenticado

#### `PATCH /api/profiles/me`

- Middleware: `requireAuth`, `requireNotBanned`
- Body (zod): `{ username: string (regex), full_name?: string (max 80) }`
- Valida username (mesma regex + banned words + uniqueness case-insensitive)
- Query: `update public.profiles set username = $1, full_name = coalesce($2, full_name), updated_at = now() where id = $3 returning *`
- Response 200: `{ profile: Profile }`
- Response 409: username taken (`{ error: 'username_taken' }`)
- Response 400: regex/banned fail (`{ error: 'invalid_username' | 'banned_username' }`)
- Rate limit: 10 req/min por user (evita enumeration)

### `apps/web/src/lib/supabase.ts`

```ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: true,
    persistSession: true,
  },
})
```

### `apps/web/src/app/auth/callback/route.ts`

```ts
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

### `AuthContext` gate logic

Usa o client `api` existente em `apps/web/src/lib/api.ts` (que já trata token, offline detection e sync queue) em vez de `fetch` manual:

```ts
import { api } from '../lib/api'

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
        .catch(() => { /* loga no Sentry, não bloqueia */ })
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
        .catch(() => { /* loga no Sentry, não bloqueia */ })
    }
  })

  return () => listener?.subscription.unsubscribe()
}, [router])
```

Gate só dispara para `session?.user` existente. Usuário não autenticado nunca cai no gate.

**Extensão do `api` client** — adicionar em `apps/web/src/lib/api.ts`:

```ts
profiles: {
  me: () => request<{ profile: Profile }>('/api/profiles/me'),

  usernameAvailable: (username: string) =>
    request<{ available: boolean; reason?: string }>(
      `/api/profiles/username-available?u=${encodeURIComponent(username)}`
    ),

  updateMe: (data: { username: string; full_name?: string }) =>
    request<{ profile: Profile }>('/api/profiles/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
},
```

### `apps/web/src/app/setup-username/page.tsx`

- Campo `username` (input) com debounce 400ms → chama `username-available` → mostra ✓/✗/reason.
- Campo opcional `full_name` (pré-preenchido se vier do OAuth `user_metadata.full_name`).
- Submit button disabled até `available === true`.
- Após salvar → `router.push('/')`.
- CSS: reutiliza `styles` da auth page (mesma identidade visual).

### `apps/web/src/components/OAuthButton/`

- 3 botões (Google, GitHub, Apple) com SVG icon inline (sem deps externas).
- Apple com `disabled` visualmente + tooltip "Em breve" enquanto `enabled = false`.
- Props: `onProviderClick: (provider: 'google' | 'apple' | 'github') => void`.
- Estilo via CSS Modules, segue design tokens existentes.

### `supabase/config.toml`

Atualizar a seção `[auth]` existente para incluir a redirect URL do callback:

```toml
[auth]
# ... configurações existentes ...
additional_redirect_urls = [
  "https://127.0.0.1:3000",
  "http://localhost:3000/auth/callback",
  "http://127.0.0.1:3000/auth/callback"
]
```

E habilitar os providers (substituindo o bloco `[auth.external.apple]` existente e adicionando os outros):

```toml
[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
redirect_uri = "http://localhost:3000/auth/callback"
skip_nonce_check = false

[auth.external.github]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET)"
redirect_uri = "http://localhost:3000/auth/callback"

[auth.external.apple]
enabled = false  # até ter Apple Developer Program
client_id = ""
secret = "env(SUPABASE_AUTH_EXTERNAL_APPLE_SECRET)"
redirect_uri = ""
```

`.env.example` atualizado com as 4 novas chaves (2 providers × 2 vars).

### i18n keys novas

Arquivos: `apps/web/src/messages/en.json` e `apps/web/src/messages/pt-BR.json`.

`auth.apple` ("Continue with Apple" / "Continuar com Apple") **já existe** em ambos os arquivos — não re-adicionar. Apenas `oauthError` e `appleSoon` são novas dentro de `auth`.

Novas chaves:

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
"auth": {
  "oauthError": "Authentication failed. Please try again.",
  "appleSoon": "Coming soon"
}
```

`pt-BR.json` equivalente com as mesmas chaves traduzidas.

---

## Tratamento de erros

- **OAuth cancelado** (user fecha popup/redirect): volta para `/auth` sem erro visível.
- **OAuth error** (provider down): `/auth/callback` redirect para `/auth?error=oauth` → auth page mostra `t.auth.oauthError`.
- **Network error no gate**: `AuthContext` loga via Sentry, mantém usuário na home sem redirect (não bloqueia jogo).
- **API 409 conflict em PATCH**: page mostra toast "tente outro username".
- **Email colisão** (raro, email+senha já existe e tenta OAuth com mesmo email): Supabase retorna `user_already_exists` — auth page mostra mensagem sugerindo "entrar com email+senha".

---

## Testes

- **API** (`apps/api/src/__tests__/profiles.test.ts`):
  - `GET /me`: success (com e sem username), not auth 401, not found 404.
  - `GET /username-available`: caso válido livre, taken, banned, regex inválido.
  - `PATCH /me`: success, duplicate 409, not auth 401, regex fail 400, banned word 400.
- **Web** (`apps/web/src/contexts/__tests__/AuthContext.test.tsx` — co-located, segue convenção de `ThemeContext.test.tsx`):
  - Gate redirect quando `profile.username === null` e usuário autenticado.
  - Sem redirect quando `username` preenchido.
  - Sem redirect quando `user === null` (não autenticado).
- E2E (futuro, fora deste plano): fluxo OAuth completo com credenciais reais.

---

## Ordem de implementação

Incremental, testável em cada passo. Cada passo = commit isolado.

1. Schema migration (com `drop constraint profiles_display_name_key`) + `supabase db reset` local.
2. `packages/types` — adicionar nova interface `Profile`.
3. API endpoints (`profiles.ts`: `GET /me`, `GET /username-available`, `PATCH /me`) + testes.
4. Atualizar consumers de `display_name` na API (`leaderboard.ts`, `stats.ts`, `admin.ts`, `seed.ts`, `routes.test.ts`).
5. Atualizar consumers de `display_name` no web (`leaderboard/page.tsx`, `profile/page.tsx`, `profile/[userId]/page.tsx`, `lib/api.test.ts`).
6. Atualizar consumers de `display_name` no admin (`apps/admin/src/app/dashboard/page.tsx`).
7. Estender `lib/api.ts` com `api.profiles.me()`, `usernameAvailable()`, `updateMe()`.
8. `lib/supabase.ts` — PKCE config.
9. `/auth/callback` route.
10. `supabase/config.toml` — habilitar Google + GitHub + `additional_redirect_urls`. `.env.example`.
11. `AuthContext` gate (usando `api.profiles.me()`).
12. `/setup-username` page.
13. `OAuthButton` component.
14. `/auth` page — usar `OAuthButton`.
15. i18n strings (en + pt-BR).
16. Manual E2E local (Google real + GitHub real + email+senha existente).
17. Atualizar `SPEC.md` (CA-002 OAuth items + modelo de dados).
18. Atualizar `README.md`/`AGENTS.md` com instruções de redirect URLs nos consoles dos providers.

---

## Riscos & mitigações

| Risco | Mitigação |
|---|---|
| OAuth redirect URLs precisam estar cadastradas nos consoles Google/GitHub | Documentar em `README.md`/`AGENTS.md`. Devs adicionam `http://localhost:3000/auth/callback` nos consoles. |
| Email colisão entre email+senha e OAuth | Supabase retorna `user_already_exists`. Auth page exibe mensagem sugerindo login email+senha. |
| Usuários existentes com `display_name` "Player" genérico ficam sem `full_name` | Aceitável — `full_name` é opcional. Gate só pede `username`. |
| `username` case-sensitive na checagem mas não no INSERT | Unique index em `lower(username)`. API sempre compara com `lower($1)`. Previne "Joao" vs "joao". |
| Apple exige `redirect_uri` com formato específico (`https://...`) | Apple continua `enabled = false`. Configurada manualmente quando ativa. Sem impacto no fluxo atual. |
| `auth.users.email` pode ser NULL (futuro anônimo) | `email` column em `profiles` é nullable. Unique partial index permite NULLs. |
| Race condition: dois `PATCH /profiles/me` com mesmo username quase simultâneos | Unique constraint no DB é a defesa final — um falha com 409, page mostra toast. |
| `handle_new_user` trigger falha se `new.email` for NULL (OAuth sem email) | `email` column é nullable; `coalesce` no trigger garante NULL seguro. |
| Gate dispara para usuários não autenticados | Garantido: gate só executa dentro de `if (session?.user)`. Sem auth, sem fetch, sem redirect. |
| Rename `display_name` → `full_name` quebra 25+ consumers | Ordem de implementação inclui passo explícito (4-6) para atualizar todos os consumers na API, web e admin antes de testar o fluxo OAuth. |
| `RENAME COLUMN` preserva a unique constraint de `display_name` | Migration inclui `alter table ... drop constraint if exists profiles_display_name_key` explícito. |

---

## Critérios de aceitação

- [ ] Google login funciona ponta-a-ponta local (com credenciais reais).
- [ ] GitHub login funciona ponta-a-ponta local.
- [ ] Apple botão aparece "Em breve" e não quebra ao clicar.
- [ ] Após primeiro login OAuth, usuário é redirecionado para `/setup-username`.
- [ ] Usuário com email+senha existente (sem username) também cai no gate no próximo login.
- [ ] Usuário com username já preenchido não é redirecionado.
- [ ] Usuário **não autenticado** nunca é redirecionado ao gate. Pode jogar anonimamente.
- [ ] `/setup-username` valida uniqueness em tempo real (debounce 400ms).
- [ ] Submit bem-sucedido redireciona para `/`.
- [ ] Tentar username duplicado mostra erro e bloqueia submit.
- [ ] Regex `^[a-zA-Z0-9_]{3,20}$` aplicada client e server-side.
- [ ] Banned words rejeitadas (admin, root, etc.).
- [ ] Case-insensitive ("Joao" = "joao").
- [ ] Usuários existentes não perdem dados (`full_name`, `xp`, `level`, `avatar_url`).
- [ ] Todos os consumers de `display_name` atualizados (API leaderboard/stats/admin/seed, web leaderboard/profile, admin dashboard) — sem referências restantes a `display_name`.
- [ ] Leaderboard exibe `username` (identificador único) em vez de `display_name`.
- [ ] `SPEC.md` atualizado com novo schema e CA-002 OAuth items marcados.
- [ ] Testes API passando (`username-available`, `PATCH /profiles/me`).
- [ ] Testes web passando (gate logic do `AuthContext`).
- [ ] Lint + typecheck + test no CI verdes.

---

## Fora do escopo (explícito)

- Login anônimo + linking (`RF-001` parcial — fase futura).
- Mobile (React Native) — fase futura.
- Avatar upload real (continua usando inicial do nome, `RF-009`).
- E2E automatizado (Playwright) — dúvida pendente no `SPEC.md`.
- Configuração das credenciais Apple (depende Apple Developer Program $99/yr).
