# Mobile (React Native) — Fase 6

## Summary

App mobile React Native com paridade de funcionalidades com o web app atual. Compartilha engine, types, utils e hooks do monorepo. Navegação por bottom tabs com Game como tela principal.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | React Native CLI (com suporte a Expo Modules) |
| Navegação | React Navigation (bottom-tabs + native-stack) |
| Storage | AsyncStorage |
| Ícones | react-native-svg (conversão dos SVGs inline do web) |
| Tema | Appearance API + ThemeContext JS |
| Auth | supabase-js (funciona nativamente no RN) |
| Testes | @testing-library/react-native |
| Plataformas | iOS + Android simultaneamente |

---

## Escopo

### O que faz (MVP Mobile)
- Jogo Campo Minado completo (mesma engine do web)
- Autenticação (anônima, email+senha, OAuth Google/GitHub)
- Leaderboard global por dificuldade
- Estatísticas individuais do jogador
- Perfil com conquistas e XP/níveis
- Internacionalização (PT-BR, EN)
- Temas claro/escuro (sistema + manual)
- Offline-first com AsyncStorage e sync queue

### O que NÃO faz (primeira versão)
- Push notifications
- Deep linking avançado
- Widgets iOS/Android
- Apple OAuth (requer Apple Developer Program)
- E2E tests (Detox — fase futura)

---

## Navegação

```
BottomTab (3 abas)
  ├── Game       ← tela principal (tabuleiro + menu)
  ├── Leaderboard
  └── Profile

Stacks modais (sobrepostos ao tab):
  ├── Auth       — login/cadastro (via Profile se anônimo)
  ├── Settings   — via gear icon no Game
  └── SetupUsername — pós-login se username vazio
```

O Game abre direto (sem splash de menu). O menu de configurações/dificuldade é acessado via bottom sheet, igual ao web. A tela de jogo anterior no web (`/game`) não existe no mobile — é a rota raiz.

---

## Code Sharing

| Pacote | Estratégia |
|--------|-----------|
| `engine` | Compartilhado sem alterações — funções puras, zero dependências |
| `types` | Compartilhado sem alterações |
| `utils` | Compartilhado sem alterações |
| `hooks/useGame` | Compartilhado — React puro, sem dependências de plataforma |
| `hooks/useApiGame` | Versão mobile com AsyncStorage no lugar de localStorage |
| `design-tokens` | Convertido de CSS Custom Properties para objeto JS consumido por ThemeContext |
| `ui/Button` | Substituído por TouchableOpacity + Text estilizado (padrão RN) |

---

## Estrutura de Diretórios

```
apps/mobile/
  ├── App.tsx
  ├── app.json
  ├── metro.config.js
  ├── babel.config.js
  ├── tsconfig.json
  ├── package.json
  └── src/
      ├── navigation/
      │   ├── RootNavigator.tsx
      │   ├── GameStack.tsx          (se houver sub-navegação)
      │   └── types.ts
      ├── screens/
      │   ├── GameScreen.tsx
      │   ├── LeaderboardScreen.tsx
      │   ├── ProfileScreen.tsx
      │   └── AuthScreen.tsx
      ├── components/
      │   ├── GameBoard/
      │   │   ├── GameBoard.tsx
      │   │   ├── CellView.tsx
      │   │   ├── Header.tsx
      │   │   └── MineCounter.tsx
      │   ├── ResultModal.tsx
      │   ├── GameMenu.tsx
      │   ├── SimpleBottomSheet.tsx
      │   ├── StatRow.tsx
      │   ├── AchievementCard.tsx
      │   └── icons/
      │       ├── index.ts
      │       ├── FlagIcon.tsx
      │       ├── MineIcon.tsx
      │       ├── NumberIcon.tsx
      │       ├── SmileyIcon.tsx
      │       ├── TrophyIcon.tsx
      │       ├── GearIcon.tsx
      │       ├── ProfileIcon.tsx
      │       └── TimerDigit.tsx
      ├── contexts/
      │   ├── ThemeContext.tsx
      │   ├── AuthContext.tsx
      │   └── I18nContext.tsx
      ├── lib/
      │   ├── supabase.ts
      │   ├── api.ts
      │   └── sync.ts
      ├── messages/
      │   ├── en.json
      │   └── pt-BR.json
      └── __tests__/
```

---

## Telas (paridade com web)

### GameScreen
- GameBoard com header (contador LED, smiley, timer, botões flutuantes)
- BottomSheet para configurações (GameMenu)
- ResultModal ao fim da partida
- `transform: scale()` adaptado para `react-native-scalable` ou cálculo manual de scale

### LeaderboardScreen
- Tabela de ranking por dificuldade (Picker/tabs)
- Filtro por período (today/week/month/all)
- Posição do usuário destacada
- Top 3 com medalhas

### ProfileScreen
- Informações do perfil (username, avatar, XP, nível)
- Estatísticas (partidas, taxa de vitória, melhores tempos)
- Grade de conquistas
- Botão de logout / login

### AuthScreen
- Opções: Google, GitHub, email+senha
- Suporte a anônimo (jogar sem conta)

---

## Temas

Os mesmos tokens de cor do `design-tokens` são convertidos para objeto JS:

```ts
type ThemeTokens = {
  bg: string
  bgSecondary: string
  surface: string
  border: string
  text: string
  textSecondary: string
  primary: string
  // ... todos os tokens existentes
}
```

O `ThemeContext` detecta:
1. Preferência salva (AsyncStorage)
2. Fallback: Appearance API do sistema
3. Fornece `theme` + `colors` para toda a árvore

---

## Tratamento de Estados

### Loading
- Skeleton simplificado (fundo cinza + ActivityIndicator) enquanto carrega leaderboard/perfil
- Tabuleiro: ActivityIndicator no centro até engine inicializar

### Error
- Toast ou inline error para falhas de API
- Offline: badge sutil indicando "offline" no header
- Auth error: mensagem inline no formulário

---

## Google Auth no React Native

GIS (Google Identity Services) é uma API de navegador — não funciona em React Native. O mobile usará `@react-native-google-signin/google-signin` para autenticação Google, que:
- Abre chrome custom tab (Android) ou ASWebAuthenticationSession (iOS)
- Retorna um token ID
- O token é passado para `supabase.auth.signInWithIdToken()`

GitHub e email+senha continuam usando `supabase.auth.signInWithOAuth` e `signInWithPassword` respectivamente — funcionam no RN.

---

### Empty
- Leaderboard vazio: mensagem "Nenhuma partida registrada"
- Conquistas vazias: "Jogue para desbloquear conquistas"

---

## Casos de Borda

- **Anônimo**: leaderboard e estatísticas mostram "Faça login para ver"
- **Offline**: jogo funciona normalmente; leaderboard mostra dados locais ou mensagem offline
- **Primeiro clique**: mesma lógica do engine — minas posicionadas após primeiro click
- **Tabuleiro grande (100×100)**: scroll nativo + scale do grid
- **Notch/Ilha dinâmica**: SafeAreaView nos layouts
- **Rotações**: suporte a portrait + landscape (tabuleiro se adapta)

---

## Testes

- Unitários: componentes com @testing-library/react-native
- Hooks compartilhados: já testados no web (não duplicar)
- Engine: já testada (não duplicar)
- E2E: separado para fase futura (Detox)

---

## Dependências

```json
{
  "dependencies": {
    "react-native": "0.79.x",
    "@react-navigation/native": "^7.x",
    "@react-navigation/bottom-tabs": "^7.x",
    "@react-navigation/native-stack": "^7.x",
    "react-native-screens": "^4.x",
    "react-native-safe-area-context": "^5.x",
    "react-native-svg": "^15.x",
    "@react-native-async-storage/async-storage": "^2.x",
    "@react-native-community/netinfo": "^11.x",
    "@supabase/supabase-js": "^2.x"
  },
  "devDependencies": {
    "@testing-library/react-native": "^12.x",
    "react-native-svg-transformer": "^1.x",
    "typescript": "^5.x"
  }
}
```

---

## Plano de Implementação

O desenvolvimento será dividido em tasks sequenciais:

1. **Setup do projeto** — `npx react-native init`, config monorepo (pnpm workspace, tsconfig, metro), dependências
2. **Navegação** — BottomTab (Game, Leaderboard, Profile) + stacks modais (Auth, Settings, SetupUsername)
3. **Tema + i18n** — ThemeContext (Appearance API), I18nContext (compartilhado com web), mensagens
4. **GameBoard** — Tabuleiro, CellView, Header (contador, timer, smiley), BottomSheet, ResultModal
5. **Leaderboard** — Lista paginada, filtros, destaque do usuário, top 3
6. **Profile** — Dados do perfil, estatísticas, conquistas, logout
7. **Auth** — Login Google (GIS no WebView?), GitHub, email+senha, anônimo
8. **Offline-first** — AsyncStorage sync queue, NetInfo, adaptação do useApiGame
9. **Polimento** — SafeAreaView, notch, rotações, loading/error/empty states
10. **Testes** — Unitários dos componentes mobile
