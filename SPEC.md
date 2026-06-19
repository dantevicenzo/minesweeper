# Minesweeper — Campo Minado

## Visão Geral

Jogo Campo Minado clássico multiplataforma (web + mobile) com sistema de contas, ranking global, estatísticas, conquistas e progressão. Arquitetura offline-first com sincronização em nuvem.

---

## Problema Resolvido

Não há um Campo Minado moderno, multiplataforma, open-source, com suporte a contas sincronizadas e rico em funcionalidades — combinando a experiência clássica com sistema de progressão e leaderboard.

---

## Objetivos

- Entregar um Campo Minado completo, fiel ao clássico, em web e mobile.
- Oferecer experiência offline-first com sincronização entre dispositivos.
- Criar um sistema de progressão (XP, níveis, conquistas) que engaje jogadores recorrentes.
- Construir com excelência de engenharia (Clean Architecture, DDD, SOLID) como portfólio.
- Manter 100% gratuito com doação opcional (sem anúncios, sem paywall).

---

## Escopo

### O que faz
- Jogo Campo Minado completo com suporte a múltiplas dificuldades.
- Autenticação de usuários (anônima, email+senha, OAuth).
- Leaderboard global por dificuldade.
- Estatísticas individuais de jogador.
- Salvamento automático de partidas na nuvem com continuidade entre dispositivos.
- Sistema de XP, níveis e conquistas.
- Painel administrativo para moderação de usuários e analytics.
- Internacionalização multi-idioma.
- Acessibilidade básica (teclado, leitor de telas, contraste).
- Suporte offline com sincronização.

### O que NÃO faz (fase 1)
- Modos alternativos de jogo (variações de regras) — futuros.
- Compartilhamento social.
- Partidas multiplayer.
- Anúncios ou modelos de assinatura.
- Editor de temas.

---

## Personas

### Jogador Casual
- Joga esporadicamente, quer uma experiência simples e rápida.
- Pode jogar sem criar conta (anônimo).
- Valores: simplicidade, responsividade, funcionar offline.

### Jogador Entusiasta
- Joga com frequência, busca melhorar recordes e estatísticas.
- Cria conta, acompanha leaderboard, desbloqueia conquistas.
- Valores: estatísticas detalhadas, sincronia multiplataforma, progressão.

### Administrador
- Gerencia usuários (banir, resetar).
- Acompanha métricas do sistema.
- Valores: painel claro, dados confiáveis, ações simples.

---

## Requisitos Funcionais

### RF-001 — Autenticação de Usuários
- Suporte a login anônimo (jogar sem conta).
- Cadastro e login por email + senha.
- Login via OAuth (Google, Apple, GitHub).
- Vinculação de conta anônima a conta registrada.
- Gerenciamento de sessão (token JWT — Supabase Auth).

### RF-002 — Jogo Campo Minado Clássico
- Tabuleiro com células clicáveis.
- Clique esquerdo: revelar célula.
- Clique direito: alternar bandeira/interrogação.
- Clique duplo (ou clique em célula revelada com número igual a bandeiras adjacentes): revelar vizinhos seguros.
- Primeiro clique nunca é mina.
- Timer regressivo ou progressivo.
- Contador de minas restantes (minas totais - bandeiras colocadas).
- Detecção de vitória (todas as células seguras reveladas).
- Detecção de derrota (clique em mina revela todas as minas).
- Flood fill automático ao revelar célula vazia.

### RF-003 — Dificuldades
- Fácil: 9×9, 10 minas.
- Médio: 16×16, 40 minas.
- Difícil: 30×16, 99 minas.
- Customizado: usuário define largura, altura e número de minas (com limites).
- Níveis pré-definidos adicionais (definir durante implementação — ex: "Insano").

### RF-004 — Salvamento de Partidas
- Auto-save do estado da partida em andamento no backend.
- Restauração automática ao retornar ao jogo (mesmo em outro dispositivo).
- Sincronização offline-first: salva localmente, sincroniza quando conectado.
- Resolução de conflitos (último estado vence — timestamp-based).

### RF-005 — Leaderboard Global
- Ranking de melhores tempos por dificuldade.
- Exibição de posição, nome do jogador, tempo, data.
- Filtro por período (hoje, semana, mês, todos).
- Paginação.
- Atualização automática ao finalizar partida vitoriosa.
- Leaderboard apenas para partidas com conta logada.

### RF-006 — Estatísticas do Jogador
- Partidas jogadas (total, por dificuldade).
- Partidas vencidas/perdidas.
- Taxa de vitórias.
- Melhor tempo por dificuldade.
- Tempo total jogado.
- Recorde de detecção de minas (eficiência: cliques vs tamanho do tabuleiro).

### RF-007 — Sistema de Progressão (XP e Níveis)
- Ganho de XP ao completar partidas vencidas. Bônus por: dificuldade, tempo recorde, eficiência.
- Níveis de jogador com progressão visível.

### RF-008 — Conquistas
- Lista de conquistas desbloqueáveis.
- 12 conquistas implementadas:
  - `first_win`: Primeira Vitória — vença sua primeira partida
  - `speed_demon_easy`: Demônio da Velocidade — vença o Fácil em < 30s
  - `medium_win`: Desafiante — vença uma partida Médio
  - `expert_win`: Especialista — vença uma partida Difícil
  - `perfect_game`: Partida Perfeita — vença sem usar bandeiras
  - `win_streak_5`: Em Chamas — vença 5 partidas consecutivas
  - `win_50`: Veterano — vença 50 partidas
  - `win_100`: Lendário — vença 100 partidas
  - `speed_demon_medium`: Relâmpago — vença o Médio em < 60s
  - `speed_demon_hard`: Implacável — vença o Difícil em < 120s
  - `level_10`: Dedicado — alcance o nível 10
  - `level_25`: Mestre — alcance o nível 25
- Notificação ao desbloquear conquista.
- Perfil público com conquistas exibidas.

### RF-009 — Perfil de Jogador
- Nome de jogador (display name).
- Avatar (inicial do nome ou seleção de ícones).
- Estatísticas públicas.
- Conquistas exibidas.

### RF-010 — Admin Dashboard
- Listagem de usuários com busca e paginação.
- Ações: banir/desbanir usuário, resetar senha.
- Dashboard analítico:
  - Total de usuários ativos.
  - Partidas jogadas (total, hoje, semana, mês).
  - Distribuição por dificuldade.
  - Usuários com maior pontuação/XP.
- Acesso restrito a administradores.

### RF-011 — Internacionalização
- Suporte a múltiplos idiomas desde o MVP.
- Idiomas iniciais: português (PT-BR) e inglês (EN).
- Arquitetura preparada para adicionar novos idiomas via arquivos de tradução.
- Detecção automática de idioma do navegador/sistema.
- Seletor de idioma nas configurações.

### RF-012 — Modo Offline
- Jogo completamente funcional offline.
- Partidas offline salvas localmente e sincronizadas ao reconectar.
- Leaderboard e estatísticas indisponíveis offline (dados locais armazenados para sync).
- Conquistas offline concedidas localmente, sincronizadas ao conectar.

---

## Requisitos Não Funcionais

### RNF-001 — Performance
- Tabuleiros de qualquer tamanho (até 100×100) devem ser renderizados sem lag.
- Cliques devem ter resposta visual em < 100ms.
- Flood fill de células vazias deve ser computacionalmente eficiente (BFS/DFS sem recursão profunda para evitar stack overflow).
- Primeira renderização do tabuleiro < 500ms em dispositivos médios.

### RNF-002 — Segurança
- Autenticação via Supabase (JWT seguro).
- Validação de dados no backend (nunca confiar no cliente para game state crítico).
- Sanitização de inputs.
- Rate limiting em endpoints de leaderboard.
- Proteção contra cheats (validação de tempo no servidor para leaderboard).

### RNF-003 — Disponibilidade
- Frontend web servido via Vercel (CDN global).
- Backend serverless (Vercel Functions) com cold start aceitável (< 1s).
- Supabase com alta disponibilidade gerenciada.

### RNF-004 — Offline-first
- Jogo deve funcionar sem internet.
- Sincronização não-bloqueante (assíncrona, sem impactar a experiência de jogo).
- Dados locais nunca devem ser perdidos por falta de sincronização.

### RNF-005 — Acessibilidade
- Navegação completa por teclado (web).
- Suporte a leitores de tela (ARIA labels, roles).
- Contraste mínimo de 4.5:1 para texto normal.
- Foco visível em todos os elementos interativos.
- Compatibilidade com redução de movimento (prefers-reduced-motion).

### RNF-006 — Testabilidade
- Motor do jogo 100% testável (funções puras, sem dependências externas).
- Testes unitários no engine (todas as regras de negócio).
- Testes de integração na API.
- Testes E2E nas interfaces críticas.

### RNF-007 — Observabilidade
- Sentry para captura de erros (frontend web + mobile + backend).
- Logs estruturados no backend.

---

## Regras de Negócio

### RN-001 — Primeiro Clique Seguro
O primeiro clique em uma partida nunca pode ser uma mina. As minas devem ser posicionadas após o primeiro clique, garantindo que a célula clicada e seu entorno imediato estejam livres.

### RN-002 — Validação de Leaderboard
Apenas partidas vencidas com conta autenticada são elegíveis para leaderboard. O tempo é validado no servidor contra o timestamp de início da partida.

### RN-003 — Partida Inválida
Partidas com tempo suspeito (ex: abaixo do mínimo teórico) ou com manipulação de estado são descartadas do leaderboard.

### RN-004 — Vinculação de Conta
Uma conta anônima pode ser vinculada a um email/OAuth apenas uma vez. Após vinculação, o progresso anônimo é transferido para a conta permanente.

### RN-005 — XP por Partida
- Vitória no fácil: 100 XP base.
- Vitória no médio: 150 XP base.
- Vitória no difícil: 200 XP base.
- Streak bonus: +10 XP por vitória consecutiva (máximo +100 XP).
- Conquista desbloqueada: +50 XP.
- Derrota: 0 XP.
- Fórmula de nível: `floor(sqrt(xp / 100)) + 1`.

### RN-006 — Limites de Customização
Campos customizados devem respeitar: mínimo 5×5, máximo 100×100. Número de minas deve ser no mínimo 1 e no máximo (largura × altura - 1).

### RN-007 — Auto-save
O estado do jogo é salvo após cada ação (clique, bandeira). O salvamento é debounced para evitar excesso de chamadas ao backend.

---

## Arquitetura Conceitual

### Domínio
- **Minesweeper Engine** (`packages/engine`): lógica pura do jogo, sem dependências de UI ou backend.
  - Geração de tabuleiro com seed determinística.
  - Posicionamento de minas (primeiro clique seguro).
  - Cálculo de números adjacentes.
  - Flood fill de células vazias.
  - Detecção de vitória/derrota.
  - Validação de estado.
- **Game Domain** (`packages/types`): entidades, value objects e interfaces do domínio.
- **Progress Domain**: XP, níveis e conquistas.

### Aplicação
- **Web** (`apps/web`): Next.js. Camada de apresentação React + CSS Modules.
- **Mobile** (`apps/mobile`): React Native. Compartilha engine e hooks com web.
- **Admin** (`apps/admin`): Next.js separado, painel de administração.
- **API** (`apps/api`): Node.js + TypeScript (Express/Fastify), deploy como Vercel Serverless Functions.

### Infraestrutura
- **Database**: PostgreSQL via Supabase.
- **Auth**: Supabase Auth (email+senha, OAuth Google/Apple/GitHub, anônimo).
- **Storage**: Supabase Storage (avatares, assets).
- **Hosting Web**: Vercel.
- **Hosting API**: Vercel Serverless Functions.
- **Error Tracking**: Sentry.
- **CI/CD**: GitHub Actions.

### Integrações
- Supabase (banco, auth, storage).
- OAuth providers (Google, Apple, GitHub).
- Sentry (error tracking).

---

## Modelo de Dados

### Entidades

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

#### games
- id: uuid
- user_id: uuid (FK → profiles.id, nullable para anônimo)
- width: integer
- height: integer
- mine_count: integer
- state: jsonb (tabuleiro serializado — células, bandeiras, timer, status)
- difficulty: enum (easy, medium, hard, custom)
- status: enum (in_progress, won, lost)
- started_at: timestamp
- completed_at: timestamp?
- duration_ms: integer?
- created_at: timestamp
- updated_at: timestamp

#### leaderboard_entries
- id: uuid
- user_id: uuid (FK → profiles.id)
- game_id: uuid (FK → games.id)
- difficulty: enum
- duration_ms: integer
- rank: integer (calculado)
- created_at: timestamp

#### achievements
- id: uuid
- key: string (único, ex: "first_win", "no_flags")
- name_key: string (chave i18n)
- description_key: string (chave i18n)
- icon: string
- criteria: jsonb (regras para desbloqueio)

#### user_achievements
- user_id: uuid (FK → profiles.id)
- achievement_id: uuid (FK → achievements.id)
- unlocked_at: timestamp
- notified: boolean

#### xp_events
- id: uuid
- user_id: uuid
- amount: integer
- reason: string (ex: "game_won", "achievement", "time_bonus")
- metadata: jsonb
- created_at: timestamp

### Relacionamentos
- users (auth) → profiles (1:1)
- profiles → games (1:N)
- profiles → leaderboard_entries (1:N)
- profiles → user_achievements (1:N)
- achievements → user_achievements (1:N)
- games → leaderboard_entries (1:1, apenas partidas vencidas)

---

## APIs

### Endpoints

#### Auth (via Supabase SDK)
Gerenciado pelo cliente Supabase. Endpoints padrão de sign-up, sign-in, sign-out, OAuth, anonymous.

#### Games
- `POST /api/games` — Criar nova partida / salvar estado
- `GET /api/games?status=in_progress` — Listar partidas do usuário
- `GET /api/games/:id` — Obter estado da partida
- `PUT /api/games/:id` — Atualizar estado da partida (jogada)
- `DELETE /api/games/:id` — Remover partida (abandonar)

#### Leaderboard
- `GET /api/leaderboard?difficulty=easy&period=all&page=1&limit=20` — Listar ranking
- `GET /api/leaderboard/me?difficulty=easy` — Posição do usuário no ranking

#### Profiles
- `GET /api/profiles/me` — Perfil do usuário autenticado
- `PATCH /api/profiles/me` — Atualizar próprio perfil
- `GET /api/profiles/username-available?u=` — Verificar disponibilidade de username

#### Stats
- `GET /api/stats/me` — Estatísticas do usuário autenticado
- `GET /api/stats/:userId` — Estatísticas do jogador (público)

#### Achievements
- `GET /api/achievements` — Listar todas as conquistas
- `GET /api/achievements/me` — Conquistas do usuário com status
- `GET /api/achievements/:userId` — Conquistas de um jogador (público)

#### Admin
- `GET /api/admin/users?page=1&limit=20&search=` — Listar usuários
- `PUT /api/admin/users/:id` — Atualizar usuário (banir, permissões)
- `GET /api/admin/stats` — Dashboard analytics

---

## Fluxos

### Fluxo Principal — Jogar
1. Usuário abre o app (web ou mobile).
2. Tabuleiro é carregado diretamente com a dificuldade padrão (Fácil).
3. Menu de configurações é acessado por botão no tabuleiro (BottomSheet com GameMenu).
4. No GameMenu: seleciona dificuldade, customiza parâmetros, ou inicia nova partida.
5. Tabuleiro é gerado (minas posicionadas após primeiro clique).
6. Usuário joga (revelar, bandeira, chord).
7. Ao vencer/perder:
   a. Modal de resultado (ResultModal) exibe tempo, estatísticas, XP.
   b. Se logado: partida salva no backend, leaderboard atualizado, XP/conquistas processados.
   c. Opção: "Jogar Novamente".
8. Se sair durante a partida: estado auto-salvo, restaurado ao próximo clique em "Novo Jogo".

### Fluxo — Autenticação
1. Usuário pode jogar anonimamente.
2. Ao tentar acessar leaderboard/estatísticas ou salvar partida, é incentivado a criar conta.
3. Criação: email+senha ou OAuth (Google/Apple/GitHub).
4. Conta anônima pode ser vinculada após criação.
5. Sessão mantida via JWT (Supabase), persistida localmente.

### Fluxo — Offline
1. Usuário joga sem conexão.
2. Estado salvo localmente (localStorage).
3. Chamadas à API falham e são enfileiradas (sync queue em localStorage).
4. Ao reconectar (evento `online`), fila de sincronização é processada:
   - Partidas finalizadas são enviadas ao backend.
   - Leaderboard e conquistas são atualizados.
5. Conflitos resolvidos por timestamp (último vence).

### Fluxo — Admin
1. Admin faz login (rota separada /admin).
2. Dashboard exibe métricas principais.
3. Admin pode buscar usuários, ver detalhes, banir/desbanir.
4. Logout retorna ao login admin.

---

## Critérios de Aceitação

### CA-001 — Jogo Funcional
- [ ] Tabuleiro é gerado corretamente para todas as dificuldades.
- [ ] Primeiro clique nunca é mina.
- [ ] Flood fill revela região vazia corretamente.
- [ ] Bandeiras funcionam e contador de minas restantes é preciso.
- [ ] Chord click revela vizinhos corretos.
- [ ] Vitória detectada quando todas as células seguras estão reveladas.
- [ ] Derrota detectada ao clicar em mina, com animação de explosão.
- [ ] Timer funciona corretamente (inicia no primeiro clique, para na vitória/derrota).

### CA-002 — Contas e Autenticação
- [ ] Jogar anonimamente funciona sem pedir cadastro.
- [ ] Cadastro por email+senha funciona.
- [x] Login OAuth (Google/Apple/GitHub) funciona. (Google + GitHub ativos; Apple pendente Apple Developer Program)
- [ ] Vinculação de conta anônima preserva progresso. (Fora do escopo OAuth — fase futura)
- [ ] Sessão persiste entre fechar e reabrir o app.

### CA-003 — Leaderboard
- [ ] Partidas vencidas com conta aparecem no leaderboard.
- [ ] Ranking ordenado por tempo (menor primeiro).
- [ ] Posição do usuário é destacada.
- [ ] Filtros por dificuldade e período funcionam.

### CA-004 — Salvamento e Sincronização
- [ ] Partida em andamento é salva automaticamente (localStorage + API debounced).
- [ ] Ao abrir o app com partida salva, o estado é restaurado automaticamente no tabuleiro.
- [ ] Offline-first: jogar sem internet funciona, chamadas são enfileiradas e sincronizam ao reconectar.
- [ ] Progresso não é perdido entre dispositivos (dado mesmo login).

### CA-005 — Internacionalização
- [ ] Trocar idioma altera todos os textos da interface.
- [ ] Idioma é detectado automaticamente.
- [ ] Seleção de idioma persiste entre sessões.

### CA-006 — Admin
- [ ] Apenas admins acessam /admin.
- [ ] Listagem de usuários com busca funciona.
- [ ] Banir/desbanir usuário funciona.
- [ ] Dashboard exibe métricas corretas.

### CA-007 — Acessibilidade
- [ ] Todas as ações são realizáveis por teclado (web).
- [ ] Leitores de tela anunciam estado das células e ações.
- [ ] Contraste mínimo atende 4.5:1.

---

## Decisões Arquiteturais

### DA-001 — Supabase como Plataforma Central
Auth, banco (PostgreSQL) e storage centralizados no Supabase. Reduz complexidade operacional e custo (free tier generoso).

### DA-002 — API Separada do Next.js
Backend standalone em vez de API routes do Next.js para: desacoplamento entre frontend web e API, possibilidade de versionamento independente, e facilidade de testar a API isoladamente.

### DA-003 — Motor de Jogo Compartilhado
`packages/engine` contém toda a lógica pura de Campo Minado. Zero dependências de UI ou plataforma. Testável isoladamente. Reutilizado por web, mobile e validado no backend.

### DA-004 — Offline-first com Sincronização
Prioriza experiência offline completa. Dados locais são fonte primária; backend é eventualmente consistente via sincronização assíncrona.

### DA-005 — Clean Architecture com Monorepo
Separação clara entre domínio, aplicação e infraestrutura. Pacotes bem definidos com responsabilidades únicas. Facilita manutenção e evolução.

### DA-006 — Web-first
MVP entrega apenas web (Next.js). Mobile (React Native) é segunda fase, utilizando o motor de jogo e API já implementados.

### DA-007 — API usa pg pool direto em vez de supabase-js
O Supabase local gera chaves no formato `sb_secret_*` que não são JWTs válidos. A API usa `pg.Pool` diretamente para conectar ao PostgreSQL, bypassando o REST client do Supabase. Auth verification é feita via fetch direto ao GoTrue API.

---

## Riscos

### R-001 — Complexidade de Sincronização Offline
Conflitos de sincronização podem ser complexos de resolver. A estratégia "último timestamp vence" é simples mas pode perder jogadas. **Mitigação**: manter histórico de eventos local para reconciliação manual futura.

### R-002 — Custo de Distribuição Mobile
App Store (Apple) requer assinatura anual de $99. Google Play é $25 única. **Impacto**: baixo, mas precisa ser considerado no orçamento.

### R-003 — Cold Start de Serverless Functions
Vercel Functions podem ter cold start de até 1s. Para uma API de jogo request-response, pode ser aceitável, mas precisa ser monitorado. **Mitigação**: manter functions aquecidas ou considerar migração se latência for problema.

### R-004 — Cheating no Leaderboard
Jogadores podem tentar manipular tempos ou estados de partida. **Mitigação**: validação de tempo no servidor, seed de tabuleiro server-side para leaderboard.

### R-005 — Escopo Crescente
"Classic first" foi definido, mas as variações e modos extras podem pressionar a entrega. **Mitigação**: manter backlog disciplinado, não expandir MVP.

---

## Dúvidas Pendentes

- Detalhes específicos do sistema de níveis (curva de XP, fórmula de level-up). → Resolvido: `floor(sqrt(xp / 100)) + 1`
- ~~Lista exata de conquistas (definir 10-15 conquistas iniciais).~~ ✅ Resolvido — 12 conquistas implementadas.
- Estratégia de teste E2E: qual ferramenta (Playwright, Detox, Appium)?
- Design visual: tema claro/escuro. → Resolvido: ambos implementados com ThemeContext + CSS vars.
- Triggers de notificação push no mobile? (Não especificado, assumir que não no MVP.)

---

## Hipóteses Não Validadas

- H-001: Jogadores se engajam com sistema de XP, níveis e conquistas em um jogo casual.
- H-002: Usuários estão dispostos a criar conta para acessar leaderboard e sincronização.
- H-003: Estratégia offline-first com sync eventual é suficiente para a experiência desejada.

---

## Áreas com Baixa Confiança

- **UX/Design**: não houve discussão sobre layout, cores, temas, navegação específica. A implementação precisará definir isso durante o desenvolvimento.
- **Lista de Conquistas**: apenas exemplos foram dados. A lista final precisa ser definida. → ✅ Resolvido — 12 conquistas implementadas.
- **Responsividade Mobile Web**: o layout precisa se adaptar entre web e mobile. O design system precisa suportar ambas as plataformas.
- **Detalhes da Admin Dashboard**: métricas específicas e layout do painel precisam ser detalhados.

---

## Plano de Implementação

### Fase 1 — Fundação ✅ Concluído
| Pacote | Entregáveis |
|---|---|
| Monorepo | pnpm workspace, turborepo, tsconfig, CI, gitignore |
| `packages/engine` | Board generation, mine placement, flood fill (BFS), win/loss, flag/chord. 29 testes unitários. |
| `packages/types` | Entidades do domínio, tipos compartilhados |
| `packages/utils` | Funções utilitárias |
| `packages/design-tokens` | CSS Variables (cores, espaçamento, tipografia, bordas) |
| `packages/ui` | Componentes base (Button) |
| `packages/hooks` | useGame (estado + dispatch) |

### Fase 2 — API ✅ Concluído
| App | Entregáveis |
|---|---|
| Supabase | Projeto local, schema PostgreSQL (7 tabelas, RLS, triggers), config Auth |
| `apps/api` | Express: CRUD games, leaderboard paginado, stats, achievements, admin. Middleware JWT via GoTrue API. `pg.Pool` direto (sem supabase-js). Seed script. 59 testes. |

### Fase 3 — Web App ✅ Concluído
| App | Entregáveis |
|---|---|
| `apps/web` | Next.js 15 App Router, i18n (context + JSON), Supabase Auth, CSS Modules |
| | **Telas:** Home, Game, Leaderboard, Profile, Settings, Auth |
| | **Funcionalidades:** Offline-first (localStorage + sync queue), auto-save (debounced), continue game, XP/níveis, conquistas (12), auto-create leaderboard entry |
| | API client com offline detection e fila de sincronização |

### Fase 4 — Admin ✅ Concluído
| App | Entregáveis |
|---|---|
| `apps/admin` | Next.js standalone. Login admin. User management (list, search, ban). Dashboard analytics. |

### Fase 5 — Concluído ✅
| Área | Entregáveis |
|---|---|
| Deploy | Vercel (web, api, admin), Supabase Cloud |
| Modo customizado | width/height/mines configuráveis pelo jogador |
| Acessibilidade | Navegação por teclado, ARIA labels, contraste, foco visível, reduced-motion |
| Sentry | Monitoramento de erros (frontend + backend) |
| Performance | Lazy loading do GameBoard com next/dynamic, loading states |
| Admin aprimorado | Campo `banned` no schema + migration, requireNotBanned middleware, ban/unban UI, toggle admin, server-side search com paginação |
| Leaderboard | Filtro por período (today/week/month/all), destacar posição do usuário, emojis top 3 |
| Anti-cheat | Validação de tempo mínimo por dificuldade/tamanho, rejeita tempos suspeitos no leaderboard |
| CI/CD | GitHub Actions: typecheck + lint + test on push/PR |

### Fase 6 — Mobile (Futuro)
| App | Entregáveis |
|---|---|
| `apps/mobile` | React Native. Reutiliza engine, hooks, types. UI nativa. |
| App Store + Google Play | Submissão, distribuição |

---

## Inconsistências Identificadas Durante a Descoberta

1. **Salvar partidas**: inicialmente descrito como funcionalidade de backend, depois corrigido para "apenas salvar finalizadas", depois corrigido novamente para "salvar estado no backend para continuar entre dispositivos". Versão final: auto-save de estado no backend.
2. **Compartilhamento social**: marcado indiretamente em "Experiência completa" mas depois removido explicitamente.
3. **Admin Dashboard**: `apps/admin` existe na FOLDER_STRUCTURE mas seu propósito preciso foi validado durante a descoberta como "user management + analytics".

---

## Recomendações Técnicas

### Engine deve ser funções puras
O motor do jogo em `packages/engine` deve conter apenas funções puras que recebem estado e retornam novo estado. Zero efeitos colaterais. Isso maximiza testabilidade e reuso.

### Avoid recursion for flood fill
Flood fill com recursão pode causar stack overflow em tabuleiros grandes (ex: 100×100). Usar BFS iterativo com fila.

### Seed determinística para auditabilidade
Usar uma seed baseada no timestamp + user_id para geração de tabuleiros. Permite reproduzir partidas para suporte e debugging.

### Vercel Functions como backend
Vercel Serverless Functions são a escolha natural dado o deploy gratuito. Cada endpoint deve ser um function isolado. Evitar estado em memória.

### Supabase RLS como primeira camada de segurança
Row Level Security do Supabase deve ser a primeira barreira de segurança no banco, antes mesmo da lógica da API. Garante que mesmo com um bypass na API, os dados estão protegidos no banco.

### i18n com next-intl ou react-i18next
Escolha a biblioteca que melhor se integra com Next.js App Router (recomendação: next-intl).

---

## Backlog Atual

| Prioridade | Task | Status |
|---|---|---|---|
| P1 | Fase 5 completa (deploy, custom, acessibilidade, sentry, performance, admin, leaderboard, anti-cheat, CI/CD) | ✅ Feito |
| P2 | Testes: 223 testes (engine 29, hooks 7, utils 18, api 59, web 109, admin 1) | ✅ Feito |
| P2 | Conquistas: 12 implementadas com avaliação server-side | ✅ Feito |
| P2 | Perfis: CRUD de perfil, verificação de username | ✅ Feito |
| P3 | Mobile (React Native) | Futuro |
| P3 | App Store + Google Play | Futuro |
