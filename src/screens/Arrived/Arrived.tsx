import { useNavigate } from 'react-router-dom'
import BottomTabBar from '../../components/BottomTabBar'
import StatusPill from '../../components/StatusPill'
import {
  BellIcon,
  FireIcon,
  LightningIcon,
  MealIcon,
  MenuIcon,
  SwapIcon,
  WaterDropIcon,
} from '../Home/icons'
import { loadActiveNavigation } from '../Home/exchanges'

// Exact orange from this frame's Figma ground truth (node 961:3026). Other
// screens use an approximated accent (#ff5f1f); this screen uses the real value.
const ORANGE = '#f46a2b'

const UNIT_SUFFIX: Record<string, string> = {
  Fuel: 'L',
  Water: 'L',
  Power: '',
  Meals: '',
}

function resIcon(resource: string, size: number, className: string) {
  if (resource === 'Fuel') return <FireIcon size={size} className={className} />
  if (resource === 'Power') return <LightningIcon size={size} className={className} />
  if (resource === 'Water') return <WaterDropIcon size={size} className={className} />
  return <MealIcon size={size} className={className} />
}

/**
 * "You've Arrived" — the state the map (Navigate) screen transitions to once the
 * user reaches the destination. A tall light sheet covers most of the map with
 * an arrival card (give/gets summary) and a confirm-exchange CTA.
 * Figma node 961:3026.
 */
export default function Arrived() {
  const navigate = useNavigate()
  const nav = loadActiveNavigation()
  const targetName = nav ? nav.userName.split(' ')[0] : 'Liron'
  const give = nav?.give ?? { resource: 'Power', amount: '4.2' }
  const get = nav?.get ?? { resource: 'Fuel', amount: '10' }

  return (
    <div className="w-[393px] h-[852px] relative bg-app text-textPrimary overflow-hidden select-none">
      {/* Map peeking above the sheet */}
      <img
        src="/map.png"
        alt=""
        aria-hidden
        className="absolute inset-x-0 top-0 h-[300px] w-full object-cover pointer-events-none"
      />

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

      {/* Bottom sheet */}
      <div className="absolute left-[5px] top-[247px] w-[384px] h-[599px] bg-sheet rounded-[40px] shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
        {/* Drag handle */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[14px] w-[51px] h-[4px] rounded-full bg-black/15" />

        {/* Arrival card */}
        <div className="absolute left-[19px] top-[32px] w-[346px] bg-[#dfdfdf] rounded-[23px] px-[20px] py-[10px] flex flex-col gap-[32px]">
          {/* Title + subtitle */}
          <div className="flex flex-col gap-[5px]">
            <p className="text-[26px] font-medium text-black leading-tight">
              You’ve Arrived
            </p>
            <p className="font-inter text-[13px] text-[#595959] leading-none">
              Meet {targetName} at the building entrance
            </p>
          </div>

          {/* Give / Gets chips */}
          <div className="flex h-[59px] items-center justify-center gap-[4px]">
            <div className="flex-1 flex flex-col items-center gap-[2px] px-[27px] py-[6px] rounded-[15px] bg-[#ccc]">
              <span className="text-[12px] font-semibold text-[#575757]">
                You Give
              </span>
              <div className="flex items-end gap-[2px]">
                {resIcon(give.resource, 25, 'text-black')}
                <span className="text-[24px] font-bold text-black leading-none">
                  {give.amount}
                  {UNIT_SUFFIX[give.resource] ?? ''}
                </span>
              </div>
            </div>

            <SwapIcon size={27} className="text-black" />

            <div
              className="flex-1 flex flex-col items-center gap-[2px] px-[28px] py-[6px] rounded-[15px]"
              style={{ backgroundColor: ORANGE }}
            >
              <span className="text-[12px] font-semibold text-white">
                You Gets
              </span>
              <div className="flex items-end gap-[2px]">
                {resIcon(get.resource, 28, 'text-white')}
                <span className="text-[24px] font-bold text-white leading-none">
                  {get.amount}
                  {UNIT_SUFFIX[get.resource] ?? ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Confirm CTA */}
        <button
          type="button"
          // TODO: route to a dedicated exchange-complete screen once it exists
          onClick={() => navigate('/home')}
          className="absolute left-1/2 -translate-x-1/2 top-[430px] w-[347px] h-[48px] rounded-[61px] flex items-center justify-center text-white text-[16px] font-medium"
          style={{ backgroundColor: ORANGE }}
        >
          Confirm Exchange Complete
        </button>

        {/* Report a Problem */}
        <button
          type="button"
          // TODO: route to a report-a-problem screen once it exists
          onClick={() => {}}
          className="absolute left-1/2 -translate-x-1/2 top-[495px] font-inter text-[13px] text-[#595959]"
        >
          Report a Problem
        </button>
      </div>

      {/* Bottom tab bar */}
      <BottomTabBar active="map" />
    </div>
  )
}
