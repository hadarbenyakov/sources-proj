# Implementation Plan — Sources App

A learning/design project: reproduce a full mobile app flow from Figma with perfect design accuracy. Not shipping to production. No backend or database in scope.

---

## Locked decisions

| Item | Value |
|---|---|
| Stack | React + Vite + TypeScript + Tailwind CSS v3 |
| Form factor | Web app, installable as PWA, designed for mobile |
| Design frame size | iPhone 16 — **393 × 852** |
| Phone frame mockup | **No** — render screens directly at design width |
| Language / direction | English, LTR |
| Data layer | Local React state + `localStorage` (mock fixtures only) |
| Routing | React Router v6 |
| Design source of truth | Figma Dev Mode MCP (connected) |
| Per-screen QA | `figma-pixel-parity` skill (installed in `.claude/skills/`) |

---

## Working principles

1. **Nothing speculative.** Shared components, design tokens, colors, spacings, radii, fonts — none of them are invented up front. They are extracted from the actual Figma screens as they arrive.
2. **Screen-by-screen.** Each screen is built end-to-end before moving to the next: build → wire flow → pixel-parity QA → commit.
3. **Tokens before utilities.** As recurring design values appear across screens (e.g. a color used 3+ times, a radius used in multiple components), they get promoted into `tailwind.config.ts` under `theme.extend` so the parity skill can resolve utilities to ground-truth values.
4. **Promote to shared, don't predict shared.** A button becomes a shared `<Button>` component only after the same visual treatment appears in 2+ screens.
5. **Wire flows as we go.** Every interactive element on a screen gets its target route the moment its destination screen exists. Buttons that point at unbuilt screens get a temporary `// TODO: route to <Name>` marker.

---

## Foundation (the minimal scaffold)

This is the only code written before screens arrive. It contains zero design assumptions.

### Already created
- `package.json` — React 18, Vite 5, TS 5, Tailwind 3, React Router 6
- `vite.config.ts` — Vite with React plugin, `@/*` alias to `src/*`, dev server on :5173
- `tsconfig.json` — strict TS
- `tailwind.config.ts` — empty `theme.extend` (tokens added per screen)
- `postcss.config.js` — Tailwind + autoprefixer
- `.mcp.json` — Figma Dev Mode MCP at `http://127.0.0.1:3845/mcp`
- `.claude/skills/figma-pixel-parity/` — the parity skill (project-scoped)

### Still to create (right before first screen)
- `index.html` — viewport meta set up for mobile (`width=device-width, initial-scale=1, viewport-fit=cover`)
- `src/main.tsx` — React root + Router
- `src/App.tsx` — Router with route table (initially empty; screens added as built)
- `src/styles/globals.css` — Tailwind directives + `html, body { margin: 0; background: #000; }` (background gets replaced with real value from first screen)
- `src/theme/tokens.ts` — typed exports of design tokens (mirrors `tailwind.config.ts`)
- `src/lib/storage.ts` — tiny typed `localStorage` wrapper for mock data persistence
- `src/screens/` — empty directory; each screen gets its own folder

### Display container
Render the app at exactly **393px wide**, centered on desktop, full-width on mobile. No bezel, no shadow, no decorative frame. Achieved with a single wrapper `<div class="mx-auto w-[393px] min-h-[852px]">` (or full viewport on screens < 393px).

---

## Per-screen workflow

For every screen you send, the loop is:

1. **Capture ground truth.** Pull the design context from Figma MCP (`get_design_context`, `get_variable_defs`, `get_screenshot`) for the node ID.
2. **Token diff.** Compare colors / spacings / radii / typography in the design against what's already in `tailwind.config.ts`. New values → add to tokens; reused values → reuse.
3. **Promote shared components.** If the screen contains an element visually identical to one in a prior screen, lift it into `src/components/` and have both screens use it.
4. **Build the screen** under `src/screens/<ScreenName>/`. One folder per screen: `<ScreenName>.tsx`, optional local sub-components, optional `data.ts` for fixtures.
5. **Register the route** in `src/App.tsx`.
6. **Wire interactions.** Every button/link/tap target gets either: a `navigate('/target')`, a state change, or a `// TODO: route to <unbuilt-screen>` marker.
7. **Pixel-parity QA.** Run the `figma-pixel-parity` skill: compare the rendered screen against the Figma source, produce a structured diff, apply approved fixes.
8. **Sanity check the flow.** Tap the buttons that lead to already-built screens to confirm navigation works.

---

## State & data

- Each screen owns its own UI state via `useState`.
- Cross-screen shared data (selected resource, user prefs, in-progress flow state) lives in a small React context, mirrored to `localStorage` so a refresh preserves the demo.
- Fixtures live next to the screen that introduces them (e.g. `src/screens/Home/data.ts`), promoted to `src/data/` only when shared across screens.
- No fetch calls, no API client, no auth.

---

## Tooling commands

```bash
npm install         # one-time, after the foundation is complete
npm run dev         # Vite dev server on http://localhost:5173
npm run build       # production bundle
npm run typecheck   # tsc --noEmit
```

---

## What this plan does NOT include

- Backend, database, authentication, real network calls.
- Native iOS/Android builds (this is a web app shown at iPhone-16 size).
- Animations or micro-interactions beyond what the Figma designs specify.
- Tests — out of scope for a design-fidelity learning project.
- Accessibility audits — not a stated goal; basic semantics only.

---

## Open items waiting on you

- **Screen 1.** Send the Figma node URL (Dev Mode link) and any spec notes. From there the per-screen workflow runs end-to-end.
- **App name + flow map.** When you've sent 2–3 screens I'll ask for the full flow map (which screen leads to which) so I can finalize the route table.
