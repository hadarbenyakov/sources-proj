import Avatar from '../../components/Avatar'
import { FireIcon, LightningIcon, MealIcon, SwapIcon, WaterDropIcon } from './icons'
import type { Entry, Resource } from './exchanges'

const UNIT_LABEL: Record<Resource, string> = {
  Fuel: 'L',
  Water: 'L',
  Power: 'KWh',
  Meals: 'pcs',
}

// Split a quantity into its number and unit. Uses the amount's own unit when it
// already carries one (e.g. "5L"), otherwise the resource's default unit.
function splitAmount(resource: Resource, amount: string): { num: string; unit: string } {
  const m = amount.match(/^([\d.]+)\s*([a-zA-Z]*)$/)
  const num = m ? m[1] : amount
  const unit = m && m[2] ? m[2] : UNIT_LABEL[resource]
  return { num, unit }
}

function ResIcon({ r, className }: { r: Resource; className?: string }) {
  if (r === 'Fuel') return <FireIcon size={22} className={className} />
  if (r === 'Power') return <LightningIcon size={22} className={className} />
  if (r === 'Water') return <WaterDropIcon size={22} className={className} />
  return <MealIcon size={22} className={className} />
}

function Chip({ label, entry, accent }: { label: string; entry: Entry; accent?: boolean }) {
  return (
    <div
      className={`w-[130px] h-[59px] rounded-[14px] flex flex-col items-center justify-center ${
        accent ? 'bg-black' : 'bg-black/[0.12]'
      }`}
    >
      <span
        className={`text-[13px] font-medium leading-none ${
          accent ? 'text-white' : 'text-black/70'
        }`}
      >
        {label}
      </span>
      <div className="flex items-end gap-[4px] mt-[6px]">
        <ResIcon r={entry.resource} className={accent ? 'text-white' : 'text-black'} />
        <span
          className={`text-[22px] font-bold leading-none ${
            accent ? 'text-white' : 'text-black'
          }`}
        >
          {splitAmount(entry.resource, entry.amount).num}
        </span>
        <span
          className={`text-[12px] font-normal leading-none mb-[1px] ${
            accent ? 'text-white/90' : 'text-black/70'
          }`}
        >
          {splitAmount(entry.resource, entry.amount).unit}
        </span>
      </div>
    </div>
  )
}

/**
 * A submitted offer card in the Home "My Exchanges" list (Figma 948:1408).
 * Used for both own requests ("You") and negotiations sent to other users.
 */
export default function ExchangeCard({
  name,
  photo,
  seed,
  give,
  get,
  status,
}: {
  name: string
  photo: string
  seed: string
  give: Entry
  get: Entry
  status: string
}) {
  return (
    <div className="bg-[#dcdcdc] rounded-[24px] p-[14px]">
      <div className="flex items-center gap-[9px]">
        <Avatar name={name} size={36} seed={seed} photo={photo} />
        <span className="text-[15px] font-semibold text-black">{name}</span>
        <span className="ml-auto px-[12px] py-[5px] rounded-pill bg-[#f4e7b8] text-[13px] font-medium text-[#7a6321]">
          {status}
        </span>
      </div>
      <div className="flex items-center justify-between mt-[14px]">
        <Chip label="Give" entry={give} />
        <SwapIcon size={20} className="text-black" />
        <Chip label="Gets" entry={get} accent />
      </div>
    </div>
  )
}
