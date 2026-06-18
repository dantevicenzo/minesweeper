# Minesweeper

Campo Minado clássico multiplataforma com contas sincronizadas, ranking global, conquistas e progressão. Web e mobile.

> Status: Em desenvolvimento

---

## Deployments

| Aplicação | URL |
|---|---|
| Web (jogadores) | https://minesweeper-web-iota.vercel.app |
| Admin (painel) | https://minesweeper-admin-orcin.vercel.app |
| API | https://api-theta-three-88.vercel.app |
| API Health | https://api-theta-three-88.vercel.app/api/health |

### Credenciais de teste (admin, apenas local)

Para desenvolvimento local, use o seed do banco de dados local:

```bash
pnpm --filter @minesweeper/api seed
```

O seed cria um usuário de teste com email `test@minesweeper.local` e senha `test123456`, com perfil admin.

---

## API

Base URL: `https://api-theta-three-88.vercel.app/api`

### Endpoints

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/health` | Health check | Não |
| POST | `/games` | Criar novo jogo | Bearer JWT |
| GET | `/games/:id` | Obter jogo por ID | Bearer JWT |
| PUT | `/games/:id` | Atualizar jogo (jogada, finalizar) | Bearer JWT |
| POST | `/auth/login` | Login email/senha (retorna token) | Não |
| POST | `/auth/refresh` | Refresh token | Não |
| GET | `/leaderboard` | Ranking paginado | Não |
| GET | `/profile/:id` | Perfil do jogador | Não |
| GET | `/stats/:id` | Estatísticas do jogador | Não |
| GET | `/achievements` | Listar conquistas | Não |
| GET | `/achievements/user/:id` | Conquistas do jogador | Não |
| GET | `/admin/users` | Listar usuários (admin) | Bearer JWT (admin) |
| GET | `/admin/analytics` | Analytics (admin) | Bearer JWT (admin) |

---

## Stack

- **Frontend Web:** Next.js 15, React 19, CSS Modules + Design Tokens (Cal.com)
- **Frontend Mobile:** React Native (futuro)
- **Backend:** Node.js, TypeScript, Express, Vercel Serverless Functions
- **Banco:** PostgreSQL 15 (Supabase Cloud + Supabase local)
- **Auth:** Supabase Auth (anônimo, email+senha, OAuth Google/Apple/GitHub)
- **Monorepo:** pnpm 11, Turborepo
- **CI/CD:** GitHub Actions

---

## Funcionalidades

- Jogo Campo Minado completo com 3 dificuldades (Iniciante, Intermediário, Expert)
- Primeiro clique seguro, bandeiras e chord click
- Auto-save com continuidade entre dispositivos (offline-first)
- Leaderboard global por dificuldade
- Estatísticas individuais e perfil de jogador
- Sistema de XP, níveis e conquistas (8 conquistas)
- Login anônimo, email ou OAuth (Google, GitHub)
- Offline-first com sincronização automática
- Internacionalização (PT-BR, EN)
- Painel administrativo (usuários, analytics)

---

## Começando

### Pré-requisitos

- Node.js 20+
- pnpm 9+
- Orbstack ou Docker Desktop
- Supabase CLI (`npm install -g supabase`)

### Setup local

```bash
# Instalar dependências
pnpm install

# Iniciar Supabase local
supabase start

# Copiar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com os valores de `supabase status`

# Iniciar API + Web em dev
pnpm dev
```

A API roda em `http://localhost:3001`, o Web em `http://localhost:3000`.

### Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | Chave anônima do Supabase |
| `NEXT_PUBLIC_API_URL` | Sim | URL base da API |
| `SUPABASE_DB_URL` | Sim (API) | Connection string PostgreSQL |
| `SUPABASE_SERVICE_KEY` | Sim (API) | Service role key do Supabase |
| `SUPABASE_URL` | Sim (API) | URL do projeto Supabase (admin) |
| `SUPABASE_ANON_KEY` | Sim (API) | Chave anônima do Supabase (admin) |

### Testes

```bash
pnpm test        # todos os testes (47)
pnpm lint        # lint
pnpm typecheck   # verificação de tipos
```

### Seed

```bash
pnpm --filter @minesweeper/api seed
```

Cria 8 conquistas, usuário de teste, jogos, leaderboard e eventos de XP.

---

## Estrutura

```
apps/
  web/       Next.js (jogadores) — 6 rotas
  admin/     Next.js (administradores) — login + dashboard
  api/       Express API (Vercel Serverless)

packages/
  engine/          Motor puro do jogo (29 testes, zero dependências)
  ui/              Componentes compartilhados (Button)
  types/           Tipos TypeScript
  utils/           Utilitários
  hooks/           Hooks React (useGame, useApiGame)
  design-tokens/   Design tokens (CSS custom properties)
```

---

## Arquitetura

Clean Architecture com monorepo. O motor do jogo (`packages/engine`) tem zero dependências externas e é compartilhado entre web, mobile e backend.

```
Aplicação (Next.js/RN) → Hooks → Engine (domínio puro)
                              → API (Express) → PostgreSQL
```

### Fluxo de dados (jogo)

1. Usuário faz uma jogada no tabuleiro
2. `useGame` (engine pura) processa a ação localmente
3. `useApiGame` salva o estado no localStorage (offline-first)
4. Se online, sincroniza com a API via `gameSync`
5. Se offline, a jogada é enfileirada e sincronizada quando a conexão voltar

### XP e Níveis

- Base XP por vitória: 100 (iniciante), 150 (intermediário), 200 (expert)
- Bônus de sequência: +10 por vitória consecutiva (máx +100)
- Conquistas: +50 XP cada
- Level = `floor(sqrt(xp / 100)) + 1`

---

## Licença

MIT
