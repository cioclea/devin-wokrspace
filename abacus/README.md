# Abacus · Soroban Academy – Modulul 1

Interactive lesson "Descoperă Sorobanul" for learning the Japanese abacus (Soroban). One tap toggles a bead, the bead animates to the beam and the digit/number explanation updates instantly.

Stack: Next.js 15 (App Router) · React 19 · TypeScript · Vitest · ESLint.

## Scripts

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm test           # Vitest unit tests (soroban logic + lesson reducer)
npm run lint
npm run typecheck
```

## Structure

| Path | Purpose |
| --- | --- |
| `src/lib/soroban.ts` | Pure Soroban model: bead toggling (beads move together), digit/total values, hints, texts |
| `src/lib/lesson.ts` | Missions, parts, goals, points and the `lessonReducer` state machine |
| `src/components/AbacusApp.tsx` | Client app shell: reducer, toasts, confetti, modals, keyboard digits |
| `src/components/Soroban.tsx` | Interactive soroban (tap/click/keyboard, arrow-key navigation) |
| `src/components/*` | Header, mission card, info panel, parts explorer, goals, bottom bar |
| `src/app/globals.css` | Design system (warm palette, wood frame, responsive bead sizing) |

## Soroban rules implemented

- Each rod is a decimal place; upper bead = 5, each lower bead = 1.
- Only beads touching the central beam count.
- Tapping lower bead *i* pushes beads 1..*i* to the beam; tapping an active bead drops it and the beads below it.
- Keyboard: Tab/arrows to move between beads, Enter/Space to toggle, `0`–`9` to set the selected rod.
