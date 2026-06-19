# Full-Screen Game Redesign

Date: 2026-06-18

## Problem

The home page shows a menu, and the game is at `/game`. This creates friction: the player must navigate to play. For a casual game, the game should be immediate.

## Solution

The home page (`/`) becomes the game in full screen. All menu functionality is moved to a bottom sheet triggered by a gear button in the game header. A flag toggle button is added for mobile touch players.

## Routes

| Route | Before | After |
|---|---|---|
| `/` | Menu page (Continue, New Game, Leaderboard, etc.) | Game in full screen |
| `/game` | Game board | Redirect to `/` |
| `/leaderboard` | Leaderboard | Unchanged |
| `/profile` | Profile | Unchanged |
| `/profile/[userId]` | Public profile | Unchanged |
| `/settings` | Settings (language + theme) | Redirect to `/` (language/theme now inline in gear menu) |
| `/auth` | Auth | Unchanged |

## Game Header Layout

```
[mine counter] [⚙️ gear] [🙂 smiley] [🚩 flag toggle] [timer]
```

- **Mine counter** (left): unchanged, shows remaining mines
- **⚙️ Gear** (center-left): opens bottom sheet menu
- **🙂 Smiley** (center): resets game (unchanged)
- **🚩 Flag toggle** (center-right): toggles reveal/flag mode
- **Timer** (right): unchanged

## Flag Toggle

- Toggle state: `reveal` (default) or `flag`
- Visual: button is highlighted/active when in `flag` mode
- Desktop: right-click always flags regardless of toggle state
- Mobile/touch: tap behavior depends on toggle state
  - `reveal` mode: tap reveals cell
  - `flag` mode: tap flags/unflags cell
- Keyboard: space/enter flags when toggle is in `flag` mode

## Bottom Sheet (Gear Menu)

- Opens from bottom, ~70% viewport height
- Semi-transparent backdrop (tap to close)
- Swipe down to close
- Menu items (all inline, no nesting):
  - **Continue** — only shown if there's a saved game in progress
  - **Novo Jogo** — starts a new game with current difficulty
  - **Dificuldade** — inline selector (Easy / Medium / Hard / Custom) with custom inputs
  - **Leaderboard** — navigates to `/leaderboard`
  - **Perfil** — navigates to `/profile`
  - **Idioma** — inline selector (English / Português)
  - **Tema** — inline selector (Claro / Escuro)
  - **Sair** — sign out (only if authenticated)
- Close button (X) in top-right corner

## Implementation Plan

### Files to create:
1. `apps/web/src/components/BottomSheet.tsx` — reusable bottom sheet component
2. `apps/web/src/components/BottomSheet.module.css`
3. `apps/web/src/components/GameMenu.tsx` — menu content for the bottom sheet
4. `apps/web/src/components/GameMenu.module.css`

### Files to modify:
5. `apps/web/src/app/page.tsx` — replace with game page
6. `apps/web/src/app/page.module.css` — full-screen game styles
7. `apps/web/src/app/game/page.tsx` — redirect to `/`
8. `apps/web/src/components/GameBoard.tsx` — add gear + flag to header, pass flagMode to CellView
9. `apps/web/src/components/GameBoard.module.css` — update header layout
10. `apps/web/src/components/CellView.tsx` — handle flag toggle mode
11. `apps/web/src/app/game/page.module.css` — simplify

### Files to remove:
12. `apps/web/src/app/settings/page.tsx` — no longer needed (settings inline in menu)
13. `apps/web/src/app/settings/page.module.css` — no longer needed

### Testing:
14. `apps/web/src/components/__tests__/BottomSheet.test.tsx` — render, open/close
13. `apps/web/src/components/__tests__/GameBoard.test.tsx` — update for flag toggle behavior
