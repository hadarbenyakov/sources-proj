import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  CheckIcon,
  FireIcon,
  LightningIcon,
  MealIcon,
  SwapIcon,
  WaterDropIcon,
} from '../Home/icons'

// Colors estimated from the design screenshot; tighten later via pixel-parity QA.
const BG = '#82d896'
const CHIP_BG = '#6cc585'

type Resource = 'Fuel' | 'Power' | 'Water' | 'Meals'
type Entry = { resource: Resource; amount: string }

const UNITS: Record<Resource, string> = {
  Fuel: 'L',
  Power: 'KWh',
  Water: 'L',
  Meals: 'pcs',
}

function ResIcon({ r }: { r: Resource }) {
  if (r === 'Fuel') return <FireIcon size={18} className="text-black" />
  if (r === 'Power') return <LightningIcon size={18} className="text-black" />
  if (r === 'Water') return <WaterDropIcon size={18} className="text-black" />
  return <MealIcon size={18} className="text-black" />
}

function SuccessChip({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <div
      className="h-[48px] px-[16px] rounded-[14px] flex items-center gap-[8px]"
      style={{ backgroundColor: CHIP_BG }}
    >
      {icon}
      <span className="text-[18px] font-semibold text-black">{value}</span>
    </div>
  )
}

export default function RequestSent() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as { give?: Entry; get?: Entry } | null) ?? {}
  const give = state.give ?? { resource: 'Power' as Resource, amount: '4.2' }
  const get = state.get ?? { resource: 'Fuel' as Resource, amount: '10' }

  function close() {
    navigate('/home')
  }

  function edit(e: React.MouseEvent) {
    e.stopPropagation()
    navigate('/send-request')
  }

  return (
    <div
      className="anim-screen-in w-[393px] h-[852px] relative overflow-hidden select-none cursor-pointer"
      style={{ backgroundColor: BG }}
      onClick={close}
    >
      {/* Centered content */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex flex-col items-center px-[40px]">
        {/* Check circle — pops in with a soft overshoot */}
        <div className="anim-pop-in w-[88px] h-[88px] rounded-full bg-black flex items-center justify-center">
          <CheckIcon size={36} className="text-white" />
        </div>

        {/* Title */}
        <p
          className="anim-rise-in text-[17px] font-medium text-black text-center leading-[1.4] mt-[28px] max-w-[260px]"
          style={{ animationDelay: '160ms' }}
        >
          Your Request has been sent to the community
        </p>

        {/* Chips + swap — staggered in */}
        <div className="flex items-center gap-[14px] mt-[40px]">
          <div className="anim-chip-in" style={{ animationDelay: '300ms' }}>
            <SuccessChip
              icon={<ResIcon r={give.resource} />}
              value={`${give.amount} ${UNITS[give.resource]}`}
            />
          </div>
          <div className="anim-chip-in" style={{ animationDelay: '400ms' }}>
            <SwapIcon size={22} className="text-black" />
          </div>
          <div className="anim-chip-in" style={{ animationDelay: '500ms' }}>
            <SuccessChip
              icon={<ResIcon r={get.resource} />}
              value={`${get.amount} ${UNITS[get.resource]}`}
            />
          </div>
        </div>

        {/* edit link */}
        <button
          type="button"
          onClick={edit}
          className="anim-rise-in text-[14px] text-black underline underline-offset-2 mt-[28px]"
          style={{ animationDelay: '620ms' }}
        >
          edit
        </button>
      </div>

      {/* Tap-to-close hint */}
      <p
        className="anim-rise-in absolute left-0 right-0 bottom-[36px] text-center text-[12px] text-black/55"
        style={{ animationDelay: '720ms' }}
      >
        Tap anywhere to close
      </p>
    </div>
  )
}
