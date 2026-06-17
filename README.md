# Minesweeper

Campo Minado clássico multiplataforma com contas sincronizadas, ranking global, conquistas e progressão. Web e mobile.

> Status: Em desenvolvimento

---

## Stack

- **Frontend Web:** Next.js, React, CSS Modules
- **Frontend Mobile:** React Native (futuro)
- **Backend:** Node.js, TypeScript, Vercel Serverless Functions
- **Banco:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth (anônimo, email+senha, OAuth Google/Apple/GitHub)
- **Monorepo:** pnpm, Turborepo
- **Erros:** Sentry
- **CI/CD:** GitHub Actions

---

## Funcionalidades

- Jogo Campo Minado completo com 3 dificuldades e modo customizado
- Primeiro clique seguro
- Bandeiras e chord click
- Auto-save com continuidade entre dispositivos
- Leaderboard global por dificuldade
- Estatísticas individuais
- Sistema de XP, níveis e conquistas
- Login anônimo, email ou OAuth
- Offline-first com sincronização
- Internacionalização (PT-BR, EN e mais)
- Acessibilidade (teclado, leitores de tela)
- Painel administrativo

---

## Começando

### Pré-requisitos

- Node.js 20+
- pnpm 9+

### Instalação

```bash
pnpm install
```

### Desenvolvimento

```bash
pnpm dev
```

### Testes

```bash
pnpm test
pnpm lint
pnpm typecheck
```

---

## Estrutura

```
apps/
  web/       Next.js (jogadores)
  admin/     Next.js (administradores)
  api/       Vercel Serverless Functions
  mobile/    React Native (futuro)

packages/
  engine/          Motor puro do jogo
  ui/              Componentes compartilhados
  types/           Tipos TypeScript
  utils/           Utilitários
  hooks/           Hooks React
  design-tokens/   Design tokens (CSS)
```

---

## Arquitetura

Clean Architecture com monorepo. O motor do jogo (`packages/engine`) tem zero dependências externas e é compartilhado entre web, mobile e backend.

Documentação completa em [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## Contribuindo

1. Leia [`AGENTS.md`](./AGENTS.md) e [`CONTRIBUTING.md`](./CONTRIBUTING.md)
2. Siga as diretrizes em [`DEVELOPMENT_GUIDELINES.md`](./DEVELOPMENT_GUIDELINES.md)
3. Convenções de estilo em [`STYLING_GUIDELINES.md`](./STYLING_GUIDELINES.md)

---

## Licença

MIT
