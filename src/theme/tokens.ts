/**
 * Design tokens derived from Figma. Initial values are reasonable approximations
 * from the Home-screen screenshot + Figma variable defs (text/primary = #ffffff,
 * icon/default/secondary = #757575). Pixel-parity QA will tighten these.
 */
export const tokens = {
  color: {
    app: '#1b1b1b',
    card: '#1a1a1a',
    cardAlt: '#222222',
    textPrimary: '#ffffff',
    textSecondary: '#757575',
    textMuted: '#9a9a9a',
    accent: '#ff5f1f',
    pillBg: '#1f1f1f',
    sheetBg: '#ededed',
    sheetText: '#1a1a1a',
    chipBg: '#ffffff',
  },
  radius: {
    card: 24,
    pill: 999,
    chip: 14,
  },
  font: {
    huge: '32px',
    medium: '16px',
    small: '13px',
    tiny: '12px',
  },
} as const
