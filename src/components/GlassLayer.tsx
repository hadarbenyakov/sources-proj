/**
 * Drop-in "liquid glass" surface — the same translucent blur + thin gradient
 * stroke used by the header GlassPill, but as an absolute background layer so it
 * can be placed inside any `relative` container (cards, search bars, …).
 *
 * Usage: put `<GlassLayer radius={24} />` as the first child of a `relative`
 * (or absolutely-positioned) element, then render the real content after it.
 */
const STROKE =
  'radial-gradient(110% 75% at 0% 0%, rgba(190,190,190,0.55) 35%, rgba(190,190,190,0) 92%), radial-gradient(110% 75% at 100% 100%, rgba(190,190,190,0.55) 35%, rgba(190,190,190,0) 92%)'

export default function GlassLayer({ radius = 24 }: { radius?: number }) {
  return (
    <>
      <div
        className="absolute inset-0 bg-black/25 backdrop-blur-sm"
        style={{ borderRadius: radius }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: radius,
          padding: '0.5px',
          background: STROKE,
          WebkitMask:
            'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
    </>
  )
}
