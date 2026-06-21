import { useRef, useState } from 'react'
import Avatar from '../../components/Avatar'
import {
  FireIcon,
  LightningIcon,
  MealIcon,
  MinusIcon,
  PlusIcon,
  SwapIcon,
  WaterDropIcon,
  XIcon,
} from '../Home/icons'
import type { ExchangeUser, Resource } from './data'

const UNIT_LABEL: Record<Resource, string> = {
  Power: 'KWh',
  Fuel: 'Liter',
  Water: 'L',
  Meals: 'pcs',
}

export type SendPayload = {
  give: { resource: Resource; amount: string }
  get: { resource: Resource; amount: string }
}

function ResourceIcon({ r, size = 25, className }: { r: Resource; size?: number; className?: string }) {
  if (r === 'Fuel') return <FireIcon size={size} className={className} />
  if (r === 'Power') return <LightningIcon size={size} className={className} />
  if (r === 'Water') return <WaterDropIcon size={size} className={className} />
  return <MealIcon size={size} className={className} />
}

function parseAmount(amount: string): { value: number; isFloat: boolean } {
  const v = parseFloat(amount)
  return { value: isNaN(v) ? 0 : v, isFloat: amount.includes('.') }
}

function format(value: number, isFloat: boolean): string {
  return isFloat ? value.toFixed(1) : Math.floor(value).toString()
}

function StepperCard({
  label,
  resource,
  value,
  setValue,
  isFloat,
  variant,
}: {
  label: string
  resource: Resource
  value: number
  setValue: (v: number) => void
  isFloat: boolean
  variant: 'plain' | 'accent'
}) {
  const isAccent = variant === 'accent'
  const step = isFloat ? 0.1 : 1

  return (
    <div className="flex-1 flex flex-col items-center gap-[4px] min-w-0">
      <div
        className={`w-full flex flex-col items-center gap-[22px] pt-[24px] pb-[36px] px-[7px] rounded-[15px] ${
          isAccent ? 'bg-[#f75f19]' : 'bg-black/[0.10]'
        }`}
      >
        <span className={`text-[16px] ${isAccent ? 'text-[#ececec]' : 'text-[#575757]'}`}>
          {label}
        </span>

        <div className="flex flex-col items-center gap-[18px] w-full">
          <div className="flex items-end gap-[4px]">
            <span
              className={`text-[43px] font-bold leading-[41px] ${
                isAccent ? 'text-[#ececec]' : 'text-black'
              }`}
            >
              {format(value, isFloat)}
            </span>
            <span
              className={`text-[16px] font-medium ${
                isAccent ? 'text-[#ececec]' : 'text-[#5a5a5a]'
              }`}
            >
              {UNIT_LABEL[resource]}
            </span>
          </div>

          <div className="flex items-start gap-[18px]">
            <button
              type="button"
              onClick={() => setValue(Math.max(0, Number((value - step).toFixed(1))))}
              className="bg-[#f0f0f0] p-[4px] rounded-full flex items-center justify-center text-[#9a9a9a] active:bg-black/5"
            >
              <MinusIcon size={31} />
            </button>
            <button
              type="button"
              onClick={() => setValue(Number((value + step).toFixed(1)))}
              className="bg-[#f0f0f0] p-[4px] rounded-full flex items-center justify-center text-[#9a9a9a] active:bg-black/5"
            >
              <PlusIcon size={31} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-[4px] text-[#6e6e6e]">
        <ResourceIcon r={resource} size={25} className="text-[#6e6e6e]" />
        <span className="text-[16px]">{resource}</span>
      </div>
    </div>
  )
}

/**
 * The "Can you help?" negotiation form — content of the Exchange drawer's
 * expanded state. Absolutely positioned inside the drawer sheet (Figma 935:3182).
 */
export default function NegotiateForm({
  user,
  onClose,
  onSend,
}: {
  user: ExchangeUser
  onClose: () => void
  onSend: (payload: SendPayload) => void
}) {
  const initialGive = parseAmount(user.wants!.amount)
  const initialGet = parseAmount(user.gives!.amount)
  const [giveValue, setGiveValue] = useState(initialGive.value)
  const [getValue, setGetValue] = useState(initialGet.value)

  function send() {
    onSend({
      give: { resource: user.wants!.resource, amount: format(giveValue, initialGive.isFloat) },
      get: { resource: user.gives!.resource, amount: format(getValue, initialGet.isFloat) },
    })
  }

  // Swipe-right gesture (tap also works as a desktop fallback)
  const swipeRef = useRef<{ startX: number; startY: number; moved: boolean } | null>(null)
  function onSwipeDown(e: React.PointerEvent) {
    swipeRef.current = { startX: e.clientX, startY: e.clientY, moved: false }
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  }
  function onSwipeMove(e: React.PointerEvent) {
    const s = swipeRef.current
    if (!s) return
    if (Math.abs(e.clientX - s.startX) > 4 || Math.abs(e.clientY - s.startY) > 4) s.moved = true
  }
  function onSwipeUp(e: React.PointerEvent) {
    const s = swipeRef.current
    swipeRef.current = null
    if (!s) return
    const dx = e.clientX - s.startX
    const dy = Math.abs(e.clientY - s.startY)
    if ((dx > 50 && dy < 80) || !s.moved) send()
  }

  return (
    <>
      {/* X close (collapses back to the peek) */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-[12px] top-[19px] w-[38px] h-[38px] flex items-center justify-center rounded-full bg-black/[0.08] text-black/70 hover:text-black z-10"
      >
        <XIcon size={18} />
      </button>

      {/* Content card */}
      <div className="absolute left-[19px] top-[52px] w-[347px] bg-[#dfdfdf] rounded-[32px] flex flex-col">
        {/* Header: avatar + name + description */}
        <div className="flex items-center gap-[9px] p-[16px]">
          <Avatar name={user.name} size={44} seed={user.id} photo={user.photo} />
          <div className="flex flex-col gap-[2px] font-inter">
            <span className="text-[16px] font-medium text-black leading-none">
              {user.fullName}
            </span>
            <span className="text-[12px] text-[#595959] leading-[1.4]">
              From my solar stepup. Transfer before {user.availableUntil}
            </span>
          </div>
        </div>

        {/* Form: "Can you help?" + stepper cards */}
        <div className="flex flex-col gap-[28px] p-[20px]">
          <span className="font-inter text-[20px] font-semibold text-black">
            Can you help?
          </span>
          <div className="flex items-center justify-center gap-[7px]">
            <StepperCard
              label="You give"
              resource={user.wants!.resource}
              value={giveValue}
              setValue={setGiveValue}
              isFloat={initialGive.isFloat}
              variant="plain"
            />
            <SwapIcon size={20} className="text-black shrink-0" />
            <StepperCard
              label="You get"
              resource={user.gives!.resource}
              value={getValue}
              setValue={setGetValue}
              isFloat={initialGet.isFloat}
              variant="accent"
            />
          </div>
        </div>
      </div>

      {/* Swipe to send (click also works) */}
      <div
        className="absolute left-[18px] right-[18px] top-[475px] h-[42px] flex items-center justify-center text-black/65 text-[14px] font-medium select-none cursor-pointer hover:text-black/90"
        onPointerDown={onSwipeDown}
        onPointerMove={onSwipeMove}
        onPointerUp={onSwipeUp}
        onPointerCancel={onSwipeUp}
        style={{ touchAction: 'pan-y' }}
      >
        Swipe right to send exchange negotiation →
      </div>
    </>
  )
}
