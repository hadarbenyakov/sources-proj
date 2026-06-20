import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import StatusPill from '../../components/StatusPill'
import {
  BackspaceIcon,
  BellIcon,
  ChevronLeftIcon,
  FireIcon,
  LightningIcon,
  MealIcon,
  MenuIcon,
  WaterDropIcon,
  XIcon,
} from '../Home/icons'
import { addExchange } from '../Home/exchanges'

const RESOURCES = ['Fuel', 'Power', 'Water', 'Meals'] as const
type Resource = (typeof RESOURCES)[number]

const UNITS: Record<Resource, string> = {
  Fuel: 'L',
  Power: 'KWh',
  Water: 'L',
  Meals: 'pcs',
}

function ResourceChipIcon({ r, size = 17 }: { r: Resource; size?: number }) {
  if (r === 'Fuel') return <FireIcon size={size} />
  if (r === 'Power') return <LightningIcon size={size} />
  if (r === 'Water') return <WaterDropIcon size={size} />
  return <MealIcon size={size} />
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'] as const

type Mode = 'give' | 'get' | 'describe'
type Props = { mode?: Mode }
type Entry = { resource: Resource; amount: string }
type FlowState = { give?: Entry; get?: Entry }

const QUESTIONS: Record<Mode, string> = {
  give: 'What do you give?',
  get: 'What do you want to get?',
  describe: 'Write a description',
}

export default function SendRequest({ mode = 'give' }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  // Quantities entered in earlier steps, carried forward to the summary screen.
  const incoming = (location.state as FlowState | null) ?? {}
  // Always start with a category selected (give → Fuel, get → Power).
  const [selected, setSelected] = useState<Resource>(mode === 'get' ? 'Power' : 'Fuel')
  const [value, setValue] = useState<string>('0')
  const [description, setDescription] = useState<string>('')
  const unit = UNITS[selected]

  // Slide the modal up from the bottom when first opened (from the Home plus).
  // Later steps swap content in place, so only the "give" step animates in.
  const [entered, setEntered] = useState(mode !== 'give')
  useEffect(() => {
    if (mode !== 'give') return
    const r = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(r)
  }, [mode])

  const question = QUESTIONS[mode]
  const showBack = mode !== 'give'

  function press(k: (typeof KEYS)[number]) {
    setValue((v) => {
      if (k === 'del') return v.length <= 1 ? '0' : v.slice(0, -1)
      if (k === '.') return v.includes('.') ? v : v + '.'
      if (v === '0') return k
      if (v.replace('.', '').length >= 9) return v
      return v + k
    })
  }

  function close() {
    navigate('/home')
  }

  function back() {
    navigate(-1)
  }

  function next() {
    if (mode === 'give') {
      const give: Entry = { resource: selected, amount: value }
      navigate('/receive-request', { state: { give } })
    } else if (mode === 'get') {
      const get: Entry = { resource: selected, amount: value }
      navigate('/describe-request', { state: { ...incoming, get } })
    } else if (mode === 'describe') {
      if (incoming.give && incoming.get) addExchange(incoming.give, incoming.get)
      navigate('/request-sent', { state: incoming })
    }
  }

  // Swipe-right gesture for describe mode (click also works as desktop fallback)
  const swipeRef = useRef<{ startX: number; startY: number; moved: boolean } | null>(null)
  function onSwipeDown(e: React.PointerEvent) {
    swipeRef.current = { startX: e.clientX, startY: e.clientY, moved: false }
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  }
  function onSwipeMove(e: React.PointerEvent) {
    const s = swipeRef.current
    if (!s) return
    if (Math.abs(e.clientX - s.startX) > 4 || Math.abs(e.clientY - s.startY) > 4) {
      s.moved = true
    }
  }
  function onSwipeUp(e: React.PointerEvent) {
    const s = swipeRef.current
    swipeRef.current = null
    if (!s) return
    const dx = e.clientX - s.startX
    const dy = Math.abs(e.clientY - s.startY)
    // Swipe right OR a tap/click on desktop
    if ((dx > 50 && dy < 80) || !s.moved) next()
  }

  return (
    <div className="w-[393px] h-[852px] relative bg-app text-textPrimary overflow-hidden select-none">
      {/* Header */}
      <div className="absolute left-[27px] top-[66px] w-[340px] h-[43px] flex items-center justify-between">
        <button type="button" className="text-textPrimary p-1 -ml-1">
          <MenuIcon />
        </button>
        <StatusPill power={78} fuel={19} />
        <button type="button" className="text-textPrimary p-1 -mr-1">
          <BellIcon size={26} />
        </button>
      </div>

      {/* Modal sheet */}
      <div
        className="absolute left-0 right-0 top-[130px] bottom-0 bg-sheet text-sheetText rounded-t-[40px] shadow-[0_-4px_20px_rgba(0,0,0,0.18)] will-change-transform"
        style={{
          transform: entered ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 340ms cubic-bezier(.22,.61,.36,1)',
        }}
      >
        {/* Drag handle */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[10px] w-[51px] h-[4px] rounded-full bg-black/20 pointer-events-none" />

        {/* Title */}
        <div className="absolute left-0 right-0 top-[24px] text-center">
          <span className="text-[20px] font-semibold text-sheetText">
            Send Request
          </span>
        </div>

        {/* Inner card */}
        <div className="absolute left-[14px] right-[14px] top-[66px] h-[631px] bg-[#dcdcdc] rounded-[27px]" />

        {/* Keypad frame (only in quantity modes) */}
        {mode !== 'describe' && (
          <div className="absolute left-[23px] right-[23px] top-[370px] h-[258px] bg-[#f1f1f1] rounded-[20px]" />
        )}

        {/* Back button (any mode except "give") */}
        {showBack && (
          <button
            type="button"
            onClick={back}
            aria-label="Back"
            className="absolute left-[27px] top-[80px] w-[34px] h-[34px] flex items-center justify-center text-sheetText/70 hover:text-sheetText"
          >
            <ChevronLeftIcon size={16} />
          </button>
        )}

        {/* X close (top-right of form section, below title) */}
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-[18px] top-[80px] w-[38px] h-[38px] flex items-center justify-center text-sheetText/70 hover:text-sheetText"
        >
          <XIcon size={18} />
        </button>

        {/* Question */}
        <div className="absolute left-0 right-0 top-[129px] text-center">
          <span className="text-[18px] font-semibold text-sheetText">
            {question}
          </span>
        </div>

        {/* Body — quantity (chips + display) or description (textarea) */}
        {mode !== 'describe' ? (
          <>
            {/* Resource chips */}
            <div className="absolute left-1/2 -translate-x-1/2 top-[171px] flex items-center gap-[8px]">
              {RESOURCES.map((r) => {
                const isSel = selected === r
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelected(r)}
                    className={`px-[9px] py-[6px] rounded-[30px] flex items-center gap-[4px] font-inter text-[14px] font-medium transition-colors ${
                      isSel
                        ? 'bg-[#8e8e8e] text-white'
                        : 'bg-black/[0.07] text-sheetText/85'
                    }`}
                  >
                    <ResourceChipIcon r={r} />
                    <span>{r}</span>
                  </button>
                )
              })}
            </div>

            {/* Value display */}
            <div className="absolute left-[23px] right-[23px] top-[223px] h-[136px] rounded-card bg-black/[0.07] flex items-center justify-center">
              <div className="flex items-baseline gap-[10px]">
                <span className="text-[42px] font-bold text-sheetText/85 leading-none">
                  {value}
                </span>
                <span className="text-[15px] font-medium text-sheetText/55">
                  {unit}
                </span>
              </div>
            </div>
          </>
        ) : (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="absolute left-[23px] right-[23px] top-[171px] h-[458px] rounded-card bg-black/[0.12] p-[18px] text-[15px] text-sheetText placeholder:text-sheetText/40 resize-none outline-none border-0"
            placeholder=""
          />
        )}

        {/* Keypad (only in quantity modes) */}
        {mode !== 'describe' && (
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
        )}

        {/* Bottom action — Next button or swipe-to-send strip */}
        {mode === 'describe' ? (
          <div
            className="absolute left-[23px] right-[23px] top-[632px] h-[60px] flex items-center justify-center text-sheetText/65 text-[14px] font-medium select-none cursor-pointer hover:text-sheetText/90"
            onPointerDown={onSwipeDown}
            onPointerMove={onSwipeMove}
            onPointerUp={onSwipeUp}
            onPointerCancel={onSwipeUp}
            style={{ touchAction: 'pan-y' }}
          >
            Swipe right to send exchange offer →
          </div>
        ) : (
          <button
            type="button"
            onClick={next}
            className="absolute left-[23px] right-[23px] top-[640px] h-[48px] rounded-pill bg-accent text-white text-[16px] font-semibold"
          >
            Next
          </button>
        )}
      </div>
    </div>
  )
}
