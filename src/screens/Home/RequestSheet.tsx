import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BackspaceIcon,
  FireIcon,
  LightningIcon,
  MealIcon,
  WaterDropIcon,
  XIcon,
} from './icons'

type Resource = 'Fuel' | 'Power' | 'Water' | 'Meals'

const RESOURCES = ['Fuel', 'Power', 'Water', 'Meals'] as const

const UNITS: Record<Resource, string> = {
  Fuel: 'L',
  Power: 'KWh',
  Water: 'L',
  Meals: 'pcs',
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'] as const

const SNAP = '320ms cubic-bezier(.22,.61,.36,1)'

function ResourceIcon({ r, size = 17 }: { r: Resource; size?: number }) {
  if (r === 'Fuel') return <FireIcon size={size} />
  if (r === 'Power') return <LightningIcon size={size} />
  if (r === 'Water') return <WaterDropIcon size={size} />
  return <MealIcon size={size} />
}

type Props = {
  defaultResource: Resource
  onClose: () => void
}

export default function RequestSheet({ defaultResource, onClose }: Props) {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Resource>(defaultResource)
  const [value, setValue] = useState('0')
  const [entered, setEntered] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{ startY: number } | null>(null)
  const unit = UNITS[selected]

  // Enter animation
  useEffect(() => {
    const r = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(r)
  }, [])

  function close() {
    setExiting(true)
    setTimeout(onClose, 340)
  }

  function press(k: (typeof KEYS)[number]) {
    setValue((v) => {
      if (k === 'del') return v.length <= 1 ? '0' : v.slice(0, -1)
      if (k === '.') return v.includes('.') ? v : v + '.'
      if (v === '0') return k
      if (v.replace('.', '').length >= 9) return v
      return v + k
    })
  }

  function next() {
    onClose()
    navigate('/receive-request', {
      state: { give: { resource: selected, amount: value } },
    })
  }

  // Drag handle gestures
  function onPointerDown(e: React.PointerEvent) {
    dragRef.current = { startY: e.clientY }
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    setDragging(true)
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return
    const dy = e.clientY - dragRef.current.startY
    setDragY(Math.max(0, dy)) // only drag downward
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!dragRef.current) return
    const dy = e.clientY - dragRef.current.startY
    dragRef.current = null
    setDragging(false)
    setDragY(0)
    if (dy > 80) close()
  }

  const sheetTransform = !entered || exiting
    ? 'translateY(100%)'
    : dragging
      ? `translateY(${dragY}px)`
      : 'translateY(0)'

  const sheetTransition = dragging ? 'none' : `transform ${SNAP}`

  return (
    <div className="absolute inset-0 z-50">
      {/* Scrim */}
      <div
        className="absolute inset-0 bg-black/40"
        style={{
          opacity: entered && !exiting ? 1 : 0,
          transition: `opacity ${SNAP}`,
        }}
        onClick={close}
      />

      {/* Sheet */}
      <div
        className="absolute left-0 right-0 top-[130px] bottom-0 bg-sheet text-sheetText rounded-t-[40px] shadow-[0_-4px_20px_rgba(0,0,0,0.18)] will-change-transform"
        style={{ transform: sheetTransform, transition: sheetTransition }}
      >
        {/* Drag handle area */}
        <div
          className="absolute left-0 right-0 top-0 h-[52px] cursor-grab touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="absolute left-1/2 -translate-x-1/2 top-[10px] w-[51px] h-[4px] rounded-full bg-black/20" />
        </div>

        {/* Title */}
        <div className="absolute left-0 right-0 top-[24px] text-center pointer-events-none">
          <span className="text-[20px] font-semibold text-sheetText">Send Request</span>
        </div>

        {/* Inner card frame */}
        <div className="absolute left-[14px] right-[14px] top-[66px] h-[580px] bg-[#dcdcdc] rounded-[27px]" />

        {/* Keypad frame */}
        <div className="absolute left-[23px] right-[23px] top-[370px] h-[258px] bg-[#f1f1f1] rounded-[20px]" />

        {/* X close */}
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-[18px] top-[70px] w-[38px] h-[38px] flex items-center justify-center text-sheetText/60 hover:text-sheetText"
        >
          <XIcon size={18} />
        </button>

        {/* Question */}
        <div className="absolute left-0 right-0 top-[119px] text-center">
          <span className="text-[18px] font-semibold text-sheetText">What do you give?</span>
        </div>

        {/* Resource chips */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[161px] flex items-center gap-[8px]">
          {RESOURCES.map((r) => {
            const isSel = selected === r
            return (
              <button
                key={r}
                type="button"
                onClick={() => setSelected(r)}
                className={`px-[9px] py-[6px] rounded-[30px] flex items-center gap-[4px] font-inter text-[14px] font-medium transition-colors ${
                  isSel ? 'bg-[#8e8e8e] text-white' : 'bg-black/[0.08] text-sheetText/85'
                }`}
              >
                <ResourceIcon r={r} />
                <span>{r}</span>
              </button>
            )
          })}
        </div>

        {/* Value display */}
        <div className="absolute left-[23px] right-[23px] top-[213px] h-[136px] rounded-card bg-black/[0.07] flex items-center justify-center">
          <div className="flex items-baseline gap-[10px]">
            <span className="text-[42px] font-bold text-sheetText/85 leading-none">{value}</span>
            <span className="text-[15px] font-medium text-sheetText/55">{unit}</span>
          </div>
        </div>

        {/* Keypad */}
        <div className="absolute left-[41px] right-[41px] top-[390px] grid grid-cols-3 gap-[10px]">
          {KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => press(k)}
              className="h-[47px] rounded-pill bg-white text-sheetText text-[22px] font-bold flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.08)] active:bg-black/5"
            >
              {k === 'del' ? <BackspaceIcon size={22} /> : k}
            </button>
          ))}
        </div>

        {/* Next button */}
        <button
          type="button"
          onClick={next}
          className="absolute left-[23px] right-[23px] top-[630px] h-[48px] rounded-pill bg-accent text-white text-[16px] font-semibold"
        >
          Next
        </button>
      </div>
    </div>
  )
}
