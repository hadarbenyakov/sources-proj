import type { ReactNode } from 'react'

/**
 * iOS "liquid glass" pill — translucent black with a backdrop blur and a thin
 * gradient stroke that's brightest at the top-left & bottom-right corners and
 * fades to nothing at the other two. Shared header chrome.
 * Figma nodes 925:2345 (status pill) and 925:1694 (clock).
 *
 * Pass padding / gap / justify via `className`; the glass surface + border are
 * fixed here so every glass pill stays consistent.
 */
export default function GlassPill({
  className = '',
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={`relative inline-flex items-center rounded-[30px] bg-black/25 backdrop-blur-sm ${className}`}
    >
      {/* Gradient stroke (masked to a super-thin ring). Radial glows pinned to
          the TL & BR corners — robust to the pill's aspect ratio. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[30px]"
        style={{
          padding: '0.5px',
          background:
            'radial-gradient(110% 75% at 0% 0%, rgba(190,190,190,0.55) 35%, rgba(190,190,190,0) 92%), radial-gradient(110% 75% at 100% 100%, rgba(190,190,190,0.55) 35%, rgba(190,190,190,0) 92%)',
          WebkitMask:
            'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      {children}
    </div>
  )
}
