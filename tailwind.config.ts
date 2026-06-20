import type { Config } from 'tailwindcss'

/**
 * Tokens derived from Home screen (Figma node 925-1733). Initial values are
 * approximations from screenshot + variable defs; figma-pixel-parity QA
 * will refine exact hex/spacing values per element.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        app: '#1b1b1b',
        card: '#1c1c1c',
        cardAlt: '#262626',
        pill: '#2a2a2a',
        accent: '#ff5f1f',
        sheet: '#ededed',
        sheetText: '#1a1a1a',
        sheetChipActive: '#ffffff',
        sheetChipIdle: 'transparent',
        textPrimary: '#ffffff',
        textSecondary: '#9a9a9a',
        textMuted: '#6e6e6e',
        dotIdle: '#3a3a3a',
      },
      borderRadius: {
        card: '24px',
        pill: '9999px',
        chip: '14px',
        sheet: '32px',
      },
      fontFamily: {
        sans: [
          'Plus Jakarta Sans',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'system-ui',
          'sans-serif',
        ],
        inter: ['Inter', 'system-ui', 'sans-serif'],
        numeric: ['Montserrat Alternates', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
