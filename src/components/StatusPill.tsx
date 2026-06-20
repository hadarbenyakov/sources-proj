import DotRing from '../screens/Home/DotRing'
import { loadResourceLevels } from '../screens/Home/exchanges'
import GlassPill from './GlassPill'

type Props = {
  power?: number
  fuel?: number
}

/**
 * Header status pill — Power + Fuel %, each with a dotted ring, on the shared
 * liquid-glass surface. Figma node 925:2345: p-10, rounded-30, 23px gap between
 * groups. Labels are bold white — "P" 18px + "78%" 14px.
 *
 * Defaults to the persisted resource levels so completed exchanges are
 * reflected everywhere the pill appears.
 */
export default function StatusPill(props: Props) {
  const levels = loadResourceLevels()
  const power = props.power ?? levels.power
  const fuel = props.fuel ?? levels.fuel
  return (
    <GlassPill className="h-[43px] w-[204px] justify-center gap-[23px]">
      <div className="flex items-center gap-[4px]">
        <DotRing percent={power} size={23} dots={12} dotSize={2.8} />
        <div className="flex items-center gap-[6px] font-bold leading-none text-white">
          <span className="text-[18px]">P</span>
          <span className="text-[14px]">{power}%</span>
        </div>
      </div>
      <div className="flex items-center gap-[4px]">
        <DotRing
          percent={fuel}
          size={23}
          dots={12}
          dotSize={2.8}
          activeColor="#ff5f1f"
        />
        <div className="flex items-center gap-[6px] font-bold leading-none text-white">
          <span className="text-[18px]">F</span>
          <span className="text-[14px]">{fuel}%</span>
        </div>
      </div>
    </GlassPill>
  )
}
