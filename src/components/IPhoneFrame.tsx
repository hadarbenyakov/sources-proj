import type { ReactNode } from 'react'

// Bezel thickness around the 393×852 screen
export const BX = 13   // left + right
export const BT = 13   // top
export const BB = 28   // bottom chin
export const FRAME_W = 393 + BX * 2  // 419
export const FRAME_H = 852 + BT + BB  // 893

// iPhone 15 — Midnight (Space Black) colorway
const BODY      = '#1c1c1e'
const EDGE_HI   = '#323234'  // slightly lighter for edge chamfer
const BTN_DARK  = '#161618'
const BTN_LIGHT = '#2e2e30'

// A single side button (flush with the outside of the frame)
function SideBtn({
  side,
  top,
  height,
}: {
  side: 'left' | 'right'
  top: number
  height: number
}) {
  const isLeft = side === 'left'
  return (
    <div
      style={{
        position: 'absolute',
        [isLeft ? 'left' : 'right']: -4,
        top,
        width: 4,
        height,
        background: isLeft
          ? `linear-gradient(to right, ${BTN_DARK}, ${BTN_LIGHT})`
          : `linear-gradient(to left, ${BTN_DARK}, ${BTN_LIGHT})`,
        borderRadius: isLeft ? '3px 0 0 3px' : '0 3px 3px 0',
        boxShadow: isLeft
          ? 'inset 1px 0 0 rgba(255,255,255,0.07)'
          : 'inset -1px 0 0 rgba(255,255,255,0.07)',
      }}
    />
  )
}

// Small speaker/mic hole dots at the bottom
function BottomDots({ cx, count = 6 }: { cx: number; count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: cx + (i - (count - 1) / 2) * 5.5,
            top: FRAME_H - 17,
            width: 3.5,
            height: 3.5,
            borderRadius: '50%',
            background: '#111',
            boxShadow: 'inset 0 0.5px 1px rgba(0,0,0,0.7)',
          }}
        />
      ))}
    </>
  )
}

export default function IPhoneFrame({ children }: { children: ReactNode }) {
  const cx = FRAME_W / 2

  return (
    <div
      style={{
        position: 'relative',
        width: FRAME_W,
        height: FRAME_H,
        background: `linear-gradient(
          155deg,
          ${EDGE_HI} 0%,
          ${BODY}    15%,
          ${BODY}    85%,
          ${EDGE_HI} 100%
        )`,
        borderRadius: 56,
        boxShadow: [
          // inner chamfer highlight
          'inset 0 0 0 1px rgba(255,255,255,0.10)',
          'inset 0 1px 0   rgba(255,255,255,0.18)',
          'inset 1px 0 0   rgba(255,255,255,0.05)',
          // outer drop-shadow
          '0 40px 100px rgba(0,0,0,0.90)',
          '0  8px  30px rgba(0,0,0,0.50)',
          '0 0 0 0.5px rgba(0,0,0,0.7)',
        ].join(', '),
      }}
    >
      {/* ── Screen ─────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          left: BX,
          top: BT,
          width: 393,
          height: 852,
          borderRadius: 47,
          overflow: 'hidden',
          background: '#000',
          // subtle screen-edge glow so it doesn't look pasted
          boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.06)',
        }}
      >
        {children}
      </div>

      {/* ── Dynamic Island ─────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          left: cx - 63,
          top: BT + 10,
          width: 126,
          height: 37,
          background: '#000',
          borderRadius: 18,
          zIndex: 20,
          boxShadow: '0 0 0 0.5px rgba(255,255,255,0.04)',
        }}
      />

      {/* ── Left buttons ───────────────────────────────────── */}
      {/* Action button */}
      <SideBtn side="left" top={BT + 95}  height={30} />
      {/* Volume Up */}
      <SideBtn side="left" top={BT + 148} height={65} />
      {/* Volume Down */}
      <SideBtn side="left" top={BT + 228} height={65} />

      {/* ── Right button ───────────────────────────────────── */}
      {/* Power / side button */}
      <SideBtn side="right" top={BT + 168} height={95} />

      {/* ── Bottom chrome ──────────────────────────────────── */}
      {/* USB-C port */}
      <div
        style={{
          position: 'absolute',
          left: cx - 27,
          top: FRAME_H - 22,
          width: 54,
          height: 10,
          background: '#0a0a0a',
          borderRadius: 5,
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.9)',
        }}
      />
      {/* Speaker & mic holes (symmetric clusters either side of USB-C) */}
      <BottomDots cx={cx - 62} count={6} />
      <BottomDots cx={cx + 62} count={6} />
    </div>
  )
}
