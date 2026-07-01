import { useEffect, useState } from 'react'
import AnimatedNumber from '../../components/AnimatedNumber'
import {
  FireIcon,
  LightningIcon,
  MealIcon,
  MinusIcon,
  PlusIcon,
  SwapIcon,
  WaterDropIcon,
  XIcon,
} from './icons'
import { deleteExchange, updateExchange, type Entry, type MyExchange, type Resource } from './exchanges'

const UNITS: Record<Resource, string> = { Fuel: 'L', Power: 'KWh', Water: 'L', Meals: 'pcs' }
const SNAP = '260ms cubic-bezier(.22,.61,.36,1)'

function ResIcon({ r, size = 15 }: { r: Resource; size?: number }) {
  if (r === 'Fuel') return <FireIcon size={size} />
  if (r === 'Power') return <LightningIcon size={size} />
  if (r === 'Water') return <WaterDropIcon size={size} />
  return <MealIcon size={size} />
}

function stepAmount(amount: string, delta: number): string {
  const n = parseFloat(amount) || 0
  const next = Math.max(0, n + delta)
  return amount.includes('.') ? next.toFixed(1) : String(next)
}

type Props = {
  exchange: MyExchange
  onClose: () => void
  onSaved: () => void
}

export default function EditExchangeSheet({ exchange, onClose, onSaved }: Props) {
  const [giveAmount, setGiveAmount] = useState(exchange.give.amount)
  const [getAmount, setGetAmount] = useState(exchange.get.amount)
  const [description, setDescription] = useState(exchange.description ?? '')
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const r = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(r)
  }, [])

  function close() {
    setExiting(true)
    setTimeout(onClose, 240)
  }

  function save() {
    const give: Entry = { resource: exchange.give.resource, amount: giveAmount }
    const get: Entry = { resource: exchange.get.resource, amount: getAmount }
    updateExchange(exchange.id, give, get, description)
    setExiting(true)
    setTimeout(onSaved, 240)
  }

  function remove() {
    deleteExchange(exchange.id)
    setExiting(true)
    setTimeout(onSaved, 240)
  }

  const giveRes = exchange.give.resource
  const getRes = exchange.get.resource

  const shown = visible && !exiting
  const backdropStyle = { opacity: shown ? 1 : 0, transition: `opacity ${SNAP}` }
  const modalStyle = {
    opacity: shown ? 1 : 0,
    transform: shown ? 'scale(1)' : 'scale(0.92)',
    transition: `opacity ${SNAP}, transform ${SNAP}`,
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center px-[20px]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        style={backdropStyle}
        onClick={close}
      />

      {/* Modal card */}
      <div
        className="relative w-full bg-sheet text-sheetText rounded-[28px] shadow-[0_8px_40px_rgba(0,0,0,0.28)] will-change-transform overflow-hidden"
        style={modalStyle}
      >
        {/* Title + close */}
        <div className="flex items-center justify-between px-[20px] pt-[20px] pb-[16px]">
          <span className="text-[20px] font-semibold text-sheetText">Edit</span>
          <button type="button" onClick={close} className="text-sheetText/50 hover:text-sheetText">
            <XIcon size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-[14px] px-[16px] pb-[20px]">
          {/* Exchange cards */}
          <div className="flex items-center gap-[8px]">
            {/* Give — gray */}
            <div className="flex-1 bg-[#dcdcdc] rounded-[22px] px-[12px] py-[16px] flex flex-col items-center gap-[8px]">
              <span className="text-[11px] font-semibold text-black/45">You give</span>
              <div className="flex items-baseline gap-[3px]">
                <span className="text-[36px] font-bold text-black/80 leading-none"><AnimatedNumber value={giveAmount} /></span>
                <span className="text-[13px] font-medium text-black/40 mb-[3px]">{UNITS[giveRes]}</span>
              </div>
              <div className="flex gap-[8px]">
                <button
                  type="button"
                  onClick={() => setGiveAmount(stepAmount(giveAmount, -1))}
                  className="w-[42px] h-[42px] rounded-full bg-white flex items-center justify-center text-black shadow-sm active:bg-black/5"
                >
                  <MinusIcon size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setGiveAmount(stepAmount(giveAmount, 1))}
                  className="w-[42px] h-[42px] rounded-full bg-white flex items-center justify-center text-black shadow-sm active:bg-black/5"
                >
                  <PlusIcon size={16} />
                </button>
              </div>
              <div className="flex items-center gap-[4px] text-[11px] text-black/45">
                <ResIcon r={giveRes} size={13} />
                <span>{giveRes}</span>
              </div>
            </div>

            {/* Swap icon */}
            <div className="text-sheetText/25 shrink-0">
              <SwapIcon size={20} />
            </div>

            {/* Get — accent */}
            <div className="flex-1 bg-black rounded-[22px] px-[12px] py-[16px] flex flex-col items-center gap-[8px]">
              <span className="text-[11px] font-semibold text-white/65">You get</span>
              <div className="flex items-baseline gap-[3px]">
                <span className="text-[36px] font-bold text-white leading-none"><AnimatedNumber value={getAmount} /></span>
                <span className="text-[13px] font-medium text-white/55 mb-[3px]">{UNITS[getRes]}</span>
              </div>
              <div className="flex gap-[8px]">
                <button
                  type="button"
                  onClick={() => setGetAmount(stepAmount(getAmount, -1))}
                  className="w-[42px] h-[42px] rounded-full bg-white/90 flex items-center justify-center text-black shadow-sm active:bg-black/10"
                >
                  <MinusIcon size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setGetAmount(stepAmount(getAmount, 1))}
                  className="w-[42px] h-[42px] rounded-full bg-white/90 flex items-center justify-center text-black shadow-sm active:bg-black/10"
                >
                  <PlusIcon size={16} />
                </button>
              </div>
              <div className="flex items-center gap-[4px] text-[11px] text-white/65">
                <ResIcon r={getRes} size={13} />
                <span>{getRes}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[12px] font-medium text-sheetText/45">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a note about your request…"
              rows={3}
              className="w-full rounded-[14px] bg-[#dcdcdc] px-[13px] py-[10px] text-[14px] text-sheetText placeholder:text-sheetText/30 resize-none outline-none"
            />
          </div>

          {/* Delete + Save */}
          <div className="flex gap-[10px]">
            <button
              type="button"
              onClick={remove}
              className="h-[46px] px-[20px] rounded-pill bg-black/[0.08] text-sheetText text-[14px] font-semibold"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={save}
              className="flex-1 h-[46px] rounded-pill bg-black text-white text-[14px] font-semibold"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
