import { useEffect, useRef, useState } from 'react'

/**
 * Renders an offer amount that springs whenever it changes — up when the value
 * grows, down when it shrinks. Works for both the +/- steppers and the keypad
 * (the value is compared numerically, so "1" → "12" reads as growing).
 *
 * Re-mounting via a changing `key` is what replays the CSS animation each time.
 * The first render never animates, so the form just appears at rest.
 */
export default function AnimatedNumber({
  value,
  className,
}: {
  value: string
  className?: string
}) {
  const [state, setState] = useState<{ key: number; dir: 'up' | 'down' }>({
    key: 0,
    dir: 'up',
  })
  const prev = useRef(value)

  useEffect(() => {
    if (prev.current === value) return
    const dir = (parseFloat(value) || 0) >= (parseFloat(prev.current) || 0) ? 'up' : 'down'
    prev.current = value
    setState((s) => ({ key: s.key + 1, dir }))
  }, [value])

  const anim =
    state.key === 0 ? '' : state.dir === 'up' ? 'anim-num-up' : 'anim-num-down'

  return (
    <span key={state.key} className={`inline-block ${anim} ${className ?? ''}`}>
      {value}
    </span>
  )
}
