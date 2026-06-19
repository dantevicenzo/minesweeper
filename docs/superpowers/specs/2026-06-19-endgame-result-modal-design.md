# Endgame Result Modal

## Summary

Modal de resultado que aparece ao vencer ou perder uma partida, exibindo tempo, estatísticas básicas, progressão (XP) e botão "Jogar Novamente".

---

## Escopo

### O que faz
- Modal overlay centralizado sobre o tabuleiro ao fim da partida
- Exibe status (vitória/derrota), tempo, estatísticas e XP ganho
- Botão "Jogar Novamente" para reiniciar a partida

### O que NÃO faz
- Não tem botão "Voltar ao Menu"
- Não exibe conquistas desbloqueadas (requer API; será adicionado futuramente)
- Não tem animação de explosão

---

## Design

### Componentes

#### `ResultModal.tsx` + `ResultModal.module.css` (novo)
Props:
- `isOpen: boolean`
- `status: 'won' | 'lost'`
- `time: number` (segundos)
- `difficulty: string`
- `mineCount: number`
- `flagCount: number`
- `clickCount: number`
- `width: number`
- `height: number`
- `xpEarned?: number` (undefined se anônimo)
- `onPlayAgain: () => void`

Renderizado condicionalmente dentro do `GameBoard` quando `game.status` é `'won'` ou `'lost'`.

#### `GameBoard.tsx` (modificado)
- Adicionar `clickCountRef` incrementado a cada dispatch
- Quando `game.status` muda para `'won'`/`'lost'`, renderizar `<ResultModal>`
- Calcular `xpEarned` baseado na dificuldade (100/150/200) apenas se usuário logado

### Layout

```
┌──────────────────────────────────┐
│           Backdrop               │
│  ┌──────────────────────────┐    │
│  │         😎/💀            │    │
│  │   You Win! / Game Over   │    │
│  │                          │    │
│  │  ─── Statistics ───     │    │
│  │  Time:        45s       │    │
│  │  Board:       9×9       │    │
│  │  Mines:       10/10     │    │
│  │  Clicks:      23        │    │
│  │                          │    │
│  │  ─── Progression ───    │    │
│  │  XP Earned:   +100      │    │
│  │                          │    │
│  │  [Play Again]           │    │
│  └──────────────────────────┘    │
└──────────────────────────────────┘
```

### Animações
- Backdrop: fadeIn 0.15s (mesmo padrão do BottomSheet)
- Modal: scale up com fade (0.2s ease-out)

### Acessibilidade
- `role="dialog"`, `aria-modal="true"`
- `aria-labelledby` referenciando o título (vitória/derrota)
- Foco automático no botão "Play Again" ao abrir
- Escape fecha o modal
- Foco preso dentro do modal (focus trap)

---

## Dados

| Dado | Fonte | Observação |
|------|-------|------------|
| status | `game.status` | `'won'` ou `'lost'` |
| time | state `time` no GameBoard | Já existe e é atualizado |
| difficulty | prop `difficulty` | Já existe |
| mineCount | prop `mineCount` | Já existe |
| flagCount | `game.flagCount` | Já existe |
| clickCount | `useRef(0)` novo | Incrementado a cada `dispatch` |
| width/height | props | Já existem |
| xpEarned | calculado | 100 (easy), 150 (medium), 200 (hard/custom). Apenas em vitória com `user` logado. Em derrota ou anônimo: undefined. |

---

## Modificações em Arquivos

1. **`apps/web/src/components/ResultModal.tsx`** — novo componente
2. **`apps/web/src/components/ResultModal.module.css`** — estilos do modal
3. **`apps/web/src/components/GameBoard.tsx`** — adicionar clickCountRef, integrar ResultModal
4. **`apps/web/src/messages/en.json`** — adicionar chave `game.result.stats`, `game.result.board`, `game.result.clicks`, `game.result.xpEarned`
5. **`apps/web/src/messages/pt-BR.json`** — tradução das novas chaves

---

## Casos de Borda

- **Usuário anônimo:** não exibe seção de progressão (XP)
- **Clique no backdrop:** não fecha (apenas "Play Again" ou Escape)
- **Reset durante modal:** `onPlayAgain` chama `reset()` que limpa estado e fecha modal
- **Mobile:** modal ocupa largura total com padding; botão grande o suficiente para toque
