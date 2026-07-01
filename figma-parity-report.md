# Pixel-Parity Report — SendRequest (Figma node 935-3563)

**Ground truth source:** Figma Dev Mode `get_design_context` for node 935-3563
**Code under review:** [src/screens/SendRequest/SendRequest.tsx](src/screens/SendRequest/SendRequest.tsx)
**Summary:** **7 critical · 9 major · 4 minor**

---

## CRITICAL drifts — visible at a glance

### C1. App background color
- **Figma:** `#1b1b1b`
- **Code:** `#0a0a0a` (`bg-app` token)
- **Visible:** Top strip behind header is too dark.
- **Fix:** Update `app` token in [tailwind.config.ts](tailwind.config.ts) from `#0a0a0a` → `#1b1b1b`.

### C2. Modal sheet color
- **Figma:** `#ffffff` (pure white)
- **Code:** `#ededed` (`bg-sheet` token)
- **Visible:** Whole modal should be white, not light gray.
- **Note:** Same `bg-sheet` is used on Home drawer; changing the token affects Home too. Solution → keep `sheet` token for Home, introduce a `modal` token = `#ffffff` for this screen.

### C3. Missing inner gray card wrapping the form
- **Figma:** Form content (X button, "What do you give?", chips, display, keypad, Next) is wrapped in a `#dcdcdc` rounded card (`radius: 27`, `padding: 9`) at `left=14, top=196`.
- **Code:** Form items sit directly on the sheet.
- **Visible:** No visible "inset card" frame — items float on white.
- **Fix:** Wrap the form content in a `bg-[#dcdcdc] rounded-[27px] p-[9px]` container at the correct position.

### C4. Keypad missing inner light card
- **Figma:** Keypad is inside its own `#f1f1f1` rounded container (`radius: 20`, `padding: 20`).
- **Code:** Keypad buttons sit directly on the form background.
- **Fix:** Wrap the keypad grid in `bg-[#f1f1f1] rounded-[20px] p-[20px]`.

### C5. Sheet corner radius
- **Figma:** `40px` top corners + shadow `0 4px 4px rgba(0,0,0,0.25)`
- **Code:** `rounded-t-sheet` (= `32px`), no shadow
- **Fix:** `rounded-t-[40px] shadow-[0_4px_4px_rgba(0,0,0,0.25)]`

### C6. Chip background color
- **Figma:** `#d0d0d0` (solid)
- **Code:** `bg-black/[0.06]` (RGBA over white = approx `#f0f0f0`)
- **Visible:** Chips should be visibly darker than the form bg.
- **Fix:** `bg-[#d0d0d0]`.

### C7. Next button color
- **Figma:** `#f75f19`
- **Code:** `#ff5f1f` (`bg-accent` token)
- **Drift:** R `+8`, G `±0`, B `+6` channels off — visible side-by-side.
- **Fix:** Update `accent` token to `#f75f19`. (Affects Home Fuel Request button too — same color in design.)

---

## MAJOR drifts — visible on inspection

### M1. Font family
- **Figma:** `Plus Jakarta Sans` (Bold/Medium/Regular/SemiBold) for most text; `Inter` (Medium/SemiBold) for "What do you give?", chip labels, "Sara M."
- **Code:** System fonts (`-apple-system, SF Pro Display, Inter, system-ui`)
- **Visible:** All text renders in a different typeface than the design — most noticeable on the big "0" and on "Send Request" title.
- **Fix:** Add `Plus Jakarta Sans` (and `Inter` if not already there) via Google Fonts; update Tailwind `fontFamily`.

### M2. Status pill background
- **Figma:** `rgba(0,0,0,0.2)`, padding `10` all around, gap `23` between groups, radius `30`
- **Code:** `bg-pill/85` (`#2a2a2a` @ 85% opacity), gap `14`, no explicit padding
- **Fix:** `bg-black/20 p-[10px] gap-[23px] rounded-[30px]`

### M3. Value "0" font size
- **Figma:** `46px`, opacity `57%`, line-height `41px`
- **Code:** `42px`, no opacity
- **Fix:** `text-[46px] opacity-[0.57] leading-[41px]`

### M4. Status pill "P"/"F" size
- **Figma:** `18px`, Bold
- **Code:** `13px`, Medium
- **Fix:** `text-[18px] font-bold`

### M5. Status pill "78%"/"19%" size
- **Figma:** `14px`, Bold, with `gap: 6` between letter and percent
- **Code:** `13px`, Medium, gap `4`
- **Fix:** `text-[14px] font-bold` and structural gap `6`.

### M6. Keypad number size
- **Figma:** `24px`, Bold
- **Code:** `22px`, Medium
- **Fix:** `text-[24px] font-bold`

### M7. Chip text color
- **Figma:** `#636363`
- **Code:** `text-sheetText/85` (= `#1a1a1a` @ 85%)
- **Fix:** `text-[#636363]`

### M8. Value display radius
- **Figma:** `15px`
- **Code:** `rounded-card` (= `24px`)
- **Fix:** `rounded-[15px]`

### M9. Status pill mini indicators
- **Figma:** Uses an image asset (a screenshot of a ring) — not vector
- **Code:** Uses my `DotRing` SVG component
- **Visible:** Different look than the design.
- **Note:** This is technically a design choice ambiguity — the Figma is using a raster screenshot, which is itself a workaround. My DotRing is semantically the same idea. **Recommend keeping DotRing** but matching its visual treatment (size/dot count/color) to the screenshot.

---

## MINOR drifts

### m1. "KWh" font size: Figma `16px` vs code `15px`. Fix: `text-[16px]`.
### m2. "KWh" color: Figma `#5a5a5a` vs code `text-sheetText/55`. Fix: `text-[#5a5a5a]`.
### m3. Keypad button radius: Figma `40px` vs code `rounded-pill` (9999px). Visually nearly identical at this aspect ratio; can leave as-is or tighten to `rounded-[40px]`.
### m4. Next button radius: Figma `61px` vs code `rounded-pill`. Same as m3 — visually identical.

---

## Things I deliberately KEPT as-is

- **Element positions / sizes** — my interpolated layout (`top-[171px]` for chips, `top-[640px]` for Next, etc.) matches the Figma absolute positions within ~1px. No drift detected.
- **Resource chip icon set** (Fire / Lightning / Water / Meals) — Figma uses specific named icons (`Iconex/Filled/Fire`, `humidity_fill`, `burger`); my SVGs are reasonable visual stand-ins. Replacing them with Figma's exact SVG export would require fetching each asset from `localhost:3845/assets/…` — propose to do this in a separate pass.
- **"Back" arrow** — Figma has it at opacity 0 (hidden) on this state. Not rendering it is correct.

---

## Hidden behind the modal (informational only)

The Figma frame includes the "Exchange" screen *behind* the modal:
- Title "Exchange" (Plus Jakarta Sans SemiBold 27px) at `(26, 139)`
- "Your People" / "See all" row at y=183
- 3×2 grid of "Sara M." avatars with online-dot indicators at y=244 & y=362

These are fully covered by the modal in this state and **not in scope** for this screen. They'll be needed when that underlying screen exists.

---

## Proposed fix order (when you approve)

1. **Token updates** (one-time, also fixes Home): `app` → `#1b1b1b`, `accent` → `#f75f19`. Add `modal: #ffffff`, `formCard: #dcdcdc`, `keypad: #f1f1f1`, `chip: #d0d0d0`, `chipText: #636363`.
2. **Font** — load Plus Jakarta Sans + Inter, wire into Tailwind.
3. **Structural** — wrap form in `#dcdcdc` card, wrap keypad in `#f1f1f1` card, fix sheet corner radius + shadow.
4. **Typography** — apply the size/weight/color fixes listed above.
5. **Manual visual check** in the browser, then iterate on anything that still looks off.
