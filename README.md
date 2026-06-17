# Minesweeper

Campo Minado clássico multiplataforma com contas sincronizadas, ranking global, conquistas e progressão. Web e mobile.

> Status: Em desenvolvimento

---

## Stack

- **Frontend Web:** Next.js, React, CSS Modules
- **Frontend Mobile:** React Native (futuro)
- **Backend:** Node.js, TypeScript, Express, Vercel Serverless Functions
- **Banco:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth (anônimo, email+senha, OAuth Google/Apple/GitHub)
- **Monorepo:** pnpm, Turborepo
- **Erros:** Sentry
- **CI/CD:** GitHub Actions

---

## Funcionalidades

- Jogo Campo Minado completo com 3 dificuldades
- Primeiro clique seguro, bandeiras e chord click
- Auto-save com continuidade entre dispositivos
- Leaderboard global por dificuldade
- Estatísticas individuais e perfil de jogador
- Sistema de XP, níveis e conquistas
- Login anônimo, email ou OAuth (Google, GitHub)
- Offline-first com sincronização
- Internacionalização (PT-BR, EN)
- Acessibilidade (teclado, leitores de tela)
- Painel administrativo

---

## Começando

### Pré-requisitos

- Node.js 20+
- pnpm 9+
- Orbstack ou Docker Desktop
- Supabase CLI (`npm install -g supabase`)

### Setup

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

### Testes

```bash
pnpm test        # todos os testes
pnpm lint        # lint
pnpm typecheck   # verificação de tipos
```

---

## Estrutura

```
apps/
  web/       Next.js (jogadores)
  admin/     Next.js (administradores)
  api/       Express API (Vercel Serverless)

packages/
  engine/          Motor puro do jogo (29 testes)
  ui/              Componentes compartilhados
  types/           Tipos TypeScript
  utils/           Utilitários
  hooks/           Hooks React
  design-tokens/   Design tokens (CSS)
```

---

## Arquitetura

Clean Architecture com monorepo. O motor do jogo (`packages/engine`) tem zero dependências externas e é compartilhado entre web, mobile e backend.

```
Aplicação (Next.js/RN) → Hooks → Engine (domínio puro)
                              → API (Express) → Supabase
```

---

## Licença

MIT
