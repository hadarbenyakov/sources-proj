import { useState } from 'react'
import AnimatedNumber from '../../components/AnimatedNumber'
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

// Split a quantity into its number and unit. Uses the amount's own unit when it
// already carries one (e.g. "5L"), otherwise the resource's default unit.
function splitAmount(resource: Resource, amount: string): { num: string; unit: string } {
  const m = amount.match(/^([\d.]+)\s*([a-zA-Z]*)$/)
  const num = m ? m[1] : amount
  const unit = m && m[2] ? m[2] : UNITS[resource]
  return { num, unit }
}

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
        accent ? 'bg-black' : 'bg-black/[0.12]'
      }`}
    >
      <span className={`text-[13px] font-medium leading-none ${accent ? 'text-white' : 'text-black/70'}`}>
        {label}
      </span>
      <div className="flex items-end gap-[4px] mt-[6px]">
        <ResIcon r={entry.resource} size={22} className={accent ? 'text-white' : 'text-black'} />
        <span className={`text-[22px] font-bold leading-none ${accent ? 'text-white' : 'text-black'}`}>
          {splitAmount(entry.resource, entry.amount).num}
        </span>
        <span className={`text-[12px] font-normal leading-none mb-[1px] ${accent ? 'text-white/90' : 'text-black/70'}`}>
          {splitAmount(entry.resource, entry.amount).unit}
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
    <div
      className={`bg-[#dfdfdf] rounded-[32px] overflow-hidden ${
        isExpanded ? 'flex flex-col flex-1 min-h-0' : ''
      }`}
    >
      {/* Header — laid out exactly like the neighbor offer card, plus the tag */}
      <button
        type="button"
        className="w-full flex items-center gap-[9px] px-[16px] pt-[12px] pb-[8px] text-left"
        onClick={onToggle}
      >
        <Avatar name="You" size={28} seed="me" photo={MY_PHOTO} />
        <div className="flex flex-col gap-[2px] font-inter flex-1 min-w-0">
          <span className="text-[16px] font-medium text-black leading-none">You</span>
          {exchange.description && (
            <span className="text-[12px] text-[#595959] leading-[1.4]">
              {exchange.description}
            </span>
          )}
        </div>
        <span className="self-start shrink-0 px-[12px] py-[5px] rounded-pill bg-[#f4e7b8] text-[13px] font-medium text-[#7a6321]">
          {exchange.status}
        </span>
      </button>

      {/* Collapsed: offer chips — centered like the neighbor offer card */}
      <div style={expandStyle(!isExpanded)}>
        <div className="overflow-hidden">
          <div className="flex items-center justify-center gap-[7px] px-[20px] pt-[4px] pb-[64px]">
            <Chip label="Give" entry={{ resource: giveRes, amount: giveAmount }} />
            <SwapIcon size={20} className="text-black shrink-0" />
            <Chip label="Gets" entry={{ resource: getRes, amount: getAmount }} accent />
          </div>
        </div>
      </div>

      {/* Expanded: edit UI — fills the drawer to the bottom when open */}
      <div
        className={isExpanded ? 'flex-1 min-h-0' : ''}
        style={expandStyle(isExpanded)}
      >
        <div className="overflow-hidden h-full">
          <div className="flex flex-col gap-[14px] px-[14px] pt-[8px] pb-[28px] h-full">

            {/* Exchange cards — bigger boxes; the spacer below absorbs slack so
                nothing ever overlaps the description. */}
            <div className="flex items-stretch gap-[10px]">
              {/* Give — gray */}
              <div className="flex-1 bg-white/50 rounded-[22px] px-[12px] py-[20px] flex flex-col items-center justify-center gap-[16px]">
                <span className="text-[14px] font-semibold text-black/40">You give</span>
                <div className="flex items-baseline gap-[3px]">
                  <span className="text-[46px] font-bold text-black/80 leading-none"><AnimatedNumber value={giveAmount} /></span>
                  <span className="text-[16px] font-medium text-black/35 mb-[3px]">{UNITS[giveRes]}</span>
                </div>
                <div className="flex gap-[12px]">
                  <button
                    type="button"
                    onClick={() => setGiveAmount(stepAmount(giveAmount, -1))}
                    className="w-[44px] h-[44px] rounded-full bg-white flex items-center justify-center text-black shadow-sm active:bg-black/5"
                  >
                    <MinusIcon size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setGiveAmount(stepAmount(giveAmount, 1))}
                    className="w-[44px] h-[44px] rounded-full bg-white flex items-center justify-center text-black shadow-sm active:bg-black/5"
                  >
                    <PlusIcon size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-[4px] text-[14px] text-black/40">
                  <ResIcon r={giveRes} size={16} />
                  <span>{giveRes}</span>
                </div>
              </div>

              <div className="text-black/25 shrink-0 self-center">
                <SwapIcon size={20} />
              </div>

              {/* Get — black */}
              <div className="flex-1 bg-black rounded-[22px] px-[12px] py-[20px] flex flex-col items-center justify-center gap-[16px]">
                <span className="text-[14px] font-semibold text-white/60">You get</span>
                <div className="flex items-baseline gap-[3px]">
                  <span className="text-[46px] font-bold text-white leading-none"><AnimatedNumber value={getAmount} /></span>
                  <span className="text-[16px] font-medium text-white/50 mb-[3px]">{UNITS[getRes]}</span>
                </div>
                <div className="flex gap-[12px]">
                  <button
                    type="button"
                    onClick={() => setGetAmount(stepAmount(getAmount, -1))}
                    className="w-[44px] h-[44px] rounded-full bg-white/90 flex items-center justify-center text-black shadow-sm active:bg-black/10"
                  >
                    <MinusIcon size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setGetAmount(stepAmount(getAmount, 1))}
                    className="w-[44px] h-[44px] rounded-full bg-white/90 flex items-center justify-center text-black shadow-sm active:bg-black/10"
                  >
                    <PlusIcon size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-[4px] text-[14px] text-white/60">
                  <ResIcon r={getRes} size={16} />
                  <span>{getRes}</span>
                </div>
              </div>
            </div>

            {/* Flexible spacer — soaks up the extra height of the stretched card */}
            <div className="flex-1 min-h-[8px]" />

            {/* Description */}
            <div className="flex flex-col gap-[6px] -mt-[20px]">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a note…"
                rows={2}
                className="w-full rounded-[12px] bg-white/50 px-[12px] py-[10px] text-[14px] text-black placeholder:text-black/25 resize-none outline-none"
              />
            </div>

            {/* Save CTA */}
            <button
              type="button"
              onClick={save}
              className="w-full h-[48px] rounded-pill bg-black text-white text-[15px] font-semibold"
            >
              Save
            </button>

            {/* Delete — red text, no pill */}
            <button
              type="button"
              onClick={remove}
              className="w-full text-center text-[14px] font-medium text-red-500"
            >
              Delete
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}
