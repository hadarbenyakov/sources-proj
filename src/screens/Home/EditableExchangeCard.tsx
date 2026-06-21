import { useState } from 'react'
import Avatar from '../../components/Avatar'
import {
  FireIcon,
  LightningIcon,
  MealIcon,
  MinusIcon,
  PlusIcon,
  SwapIcon,
  WaterDropIcon,
} from './icons'
import { deleteExchange, updateExchange, type Entry, type MyExchange, type Resource } from './exchanges'

const MY_PHOTO = 'https://i.pravatar.cc/150?u=me'
const SNAP = '320ms cubic-bezier(.22,.61,.36,1)'
const UNITS: Record<Resource, string> = { Fuel: 'L', Power: 'KWh', Water: 'L', Meals: 'pcs' }
const UNIT_SUFFIX: Record<Resource, string> = { Fuel: 'L', Water: 'L', Power: '', Meals: '' }

function ResIcon({ r, size = 22, className }: { r: Resource; size?: number; className?: string }) {
  if (r === 'Fuel') return <FireIcon size={size} className={className} />
  if (r === 'Power') return <LightningIcon size={size} className={className} />
  if (r === 'Water') return <WaterDropIcon size={size} className={className} />
  return <MealIcon size={size} className={className} />
}

function Chip({ label, entry, accent }: { label: string; entry: Entry; accent?: boolean }) {
  return (
    <div
      className={`w-[130px] h-[59px] rounded-[14px] flex flex-col items-center justify-center ${
        accent ? 'bg-accent' : 'bg-black/[0.12]'
      }`}
    >
      <span className={`text-[13px] font-medium leading-none ${accent ? 'text-white' : 'text-black/70'}`}>
        {label}
      </span>
      <div className="flex items-center gap-[4px] mt-[6px]">
        <ResIcon r={entry.resource} size={22} className={accent ? 'text-white' : 'text-black'} />
        <span className={`text-[22px] font-bold leading-none ${accent ? 'text-white' : 'text-black'}`}>
          {entry.amount}{UNIT_SUFFIX[entry.resource]}
        </span>
      </div>
    </div>
  )
}

function stepAmount(amount: string, delta: number): string {
  const n = parseFloat(amount) || 0
  const next = Math.max(0, n + delta)
  return amount.includes('.') ? next.toFixed(1) : String(next)
}

export default function EditableExchangeCard({
  exchange,
  isExpanded,
  onToggle,
  onSaved,
}: {
  exchange: MyExchange
  isExpanded: boolean
  onToggle: () => void
  onSaved: () => void
}) {
  const [giveAmount, setGiveAmount] = useState(exchange.give.amount)
  const [getAmount, setGetAmount] = useState(exchange.get.amount)
  const [description, setDescription] = useState(exchange.description ?? '')

  const giveRes = exchange.give.resource
  const getRes = exchange.get.resource

  function save() {
    const give: Entry = { resource: giveRes, amount: giveAmount }
    const get: Entry = { resource: getRes, amount: getAmount }
    updateExchange(exchange.id, give, get, description)
    onSaved()
  }

  function remove() {
    deleteExchange(exchange.id)
    onSaved()
  }

  const expandStyle = (show: boolean) => ({
    display: 'grid' as const,
    gridTemplateRows: show ? '1fr' : '0fr',
    transition: `grid-template-rows ${SNAP}`,
  })

  return (
    <div className="bg-[#dcdcdc] rounded-[24px] overflow-hidden">
      {/* Header — always visible, tap to toggle expand */}
      <button
        type="button"
        className="w-full flex items-center gap-[9px] px-[14px] pt-[14px] pb-[10px] text-left"
        onClick={onToggle}
      >
        <Avatar name="You" size={36} seed="me" photo={MY_PHOTO} />
        <span className="text-[15px] font-semibold text-black flex-1">You</span>
        {!isExpanded && (
          <span className="px-[12px] py-[5px] rounded-pill bg-[#f4e7b8] text-[13px] font-medium text-[#7a6321]">
            {exchange.status}
          </span>
        )}
      </button>

      {/* Collapsed: chips row */}
      <div style={expandStyle(!isExpanded)}>
        <div className="overflow-hidden">
          <div className="flex items-center justify-between px-[14px] pb-[14px]">
            <Chip label="Give" entry={{ resource: giveRes, amount: giveAmount }} />
            <SwapIcon size={20} className="text-black" />
            <Chip label="Gets" entry={{ resource: getRes, amount: getAmount }} accent />
          </div>
        </div>
      </div>

      {/* Expanded: edit UI */}
      <div style={expandStyle(isExpanded)}>
        <div className="overflow-hidden">
          <div className="flex flex-col gap-[12px] px-[14px] pb-[18px]">

            {/* Title */}
            <span className="text-[12px] font-semibold text-black/40 uppercase tracking-wide">
              Edit Exchange Request
            </span>

            {/* Mini exchange cards */}
            <div className="flex items-center gap-[8px]">
              {/* Give — gray */}
              <div className="flex-1 bg-white/50 rounded-[18px] px-[10px] py-[12px] flex flex-col items-center gap-[6px]">
                <span className="text-[10px] font-semibold text-black/40 uppercase tracking-wide">You give</span>
                <div className="flex items-baseline gap-[2px]">
                  <span className="text-[30px] font-bold text-black/80 leading-none">{giveAmount}</span>
                  <span className="text-[12px] font-medium text-black/35 mb-[2px]">{UNITS[giveRes]}</span>
                </div>
                <div className="flex gap-[6px]">
                  <button
                    type="button"
                    onClick={() => setGiveAmount(stepAmount(giveAmount, -1))}
                    className="w-[36px] h-[36px] rounded-full bg-white flex items-center justify-center text-black shadow-sm active:bg-black/5"
                  >
                    <MinusIcon size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setGiveAmount(stepAmount(giveAmount, 1))}
                    className="w-[36px] h-[36px] rounded-full bg-white flex items-center justify-center text-black shadow-sm active:bg-black/5"
                  >
                    <PlusIcon size={13} />
                  </button>
                </div>
                <div className="flex items-center gap-[3px] text-[10px] text-black/40">
                  <ResIcon r={giveRes} size={11} />
                  <span>{giveRes}</span>
                </div>
              </div>

              <div className="text-black/25 shrink-0">
                <SwapIcon size={16} />
              </div>

              {/* Get — accent */}
              <div className="flex-1 bg-accent rounded-[18px] px-[10px] py-[12px] flex flex-col items-center gap-[6px]">
                <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wide">You get</span>
                <div className="flex items-baseline gap-[2px]">
                  <span className="text-[30px] font-bold text-white leading-none">{getAmount}</span>
                  <span className="text-[12px] font-medium text-white/50 mb-[2px]">{UNITS[getRes]}</span>
                </div>
                <div className="flex gap-[6px]">
                  <button
                    type="button"
                    onClick={() => setGetAmount(stepAmount(getAmount, -1))}
                    className="w-[36px] h-[36px] rounded-full bg-white/90 flex items-center justify-center text-black shadow-sm active:bg-black/10"
                  >
                    <MinusIcon size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setGetAmount(stepAmount(getAmount, 1))}
                    className="w-[36px] h-[36px] rounded-full bg-white/90 flex items-center justify-center text-black shadow-sm active:bg-black/10"
                  >
                    <PlusIcon size={13} />
                  </button>
                </div>
                <div className="flex items-center gap-[3px] text-[10px] text-white/60">
                  <ResIcon r={getRes} size={11} />
                  <span>{getRes}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-[5px]">
              <label className="text-[11px] font-medium text-black/40">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a note…"
                rows={2}
                className="w-full rounded-[12px] bg-white/50 px-[12px] py-[9px] text-[13px] text-black placeholder:text-black/25 resize-none outline-none"
              />
            </div>

            {/* Save CTA */}
            <button
              type="button"
              onClick={save}
              className="w-full h-[44px] rounded-pill bg-accent text-white text-[14px] font-semibold"
            >
              Save
            </button>

            {/* Delete — red text, no pill */}
            <button
              type="button"
              onClick={remove}
              className="w-full text-center text-[13px] font-medium text-red-500"
            >
              Delete
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}
