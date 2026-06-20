type Props = {
  percent: number
  size?: number
  dots?: number
  dotSize?: number
  activeColor?: string
  idleColor?: string
  trackColor?: string // when set, draws a solid ring behind the dots (Figma 925:1750)
}

/**
 * Ring of dots representing a percentage. Used for the Power / Fuel
 * circular indicator. Renders `dots` evenly spaced circles around the
 * ring; the first `round(dots * percent/100)` are colored as active.
 */
export default function DotRing({
  percent,
  size = 98,
  dots = 13,
  dotSize = 14,
  activeColor = '#ffffff',
  idleColor = '#3a3a3a',
  trackColor,
}: Props) {
  const cx = size / 2
  const cy = size / 2
  const radius = size / 2 - dotSize / 2
  const activeCount = Math.round((percent / 100) * dots)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {trackColor && (
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={dotSize}
        />
      )}
      {Array.from({ length: dots }).map((_, i) => {
        const angle = (i / dots) * 2 * Math.PI - Math.PI / 2
        const x = cx + Math.cos(angle) * radius
        const y = cy + Math.sin(angle) * radius
        const active = i < activeCount
        // With a track, the empty portion is shown by the track itself — only
        // render dots for the filled amount.
        if (!active && trackColor) return null
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={dotSize / 2}
            fill={active ? activeColor : idleColor}
          />
        )
      })}
    </svg>
  )
}
