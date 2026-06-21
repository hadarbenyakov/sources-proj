import { useEffect, useState } from 'react'
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
import { applyExchangeGain, loadActiveNavigation, loadResourceLevels } from '../Home/exchanges'

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

export default function Arrived() {
  const navigate = useNavigate()
  const [entered, setEntered] = useState(false)

  const nav = loadActiveNavigation()
  const targetName = nav ? nav.userName.split(' ')[0] : 'Liron'
  const give = nav?.give ?? { resource: 'Power', amount: '4.2' }
  const get = nav?.get ?? { resource: 'Fuel', amount: '10' }

  // Delay the sheet entrance so the map is visible first
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 320)
    return () => clearTimeout(t)
  }, [])

  function confirmExchange() {
    const prevLevels = loadResourceLevels()
    applyExchangeGain(get)
    navigate('/home', { state: { prevLevels } })
  }

  const sheetStyle: React.CSSProperties = {
    transform: entered ? 'translateY(0)' : 'translateY(110%)',
    transition: entered ? 'transform 680ms cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
  }

  return (
    <div className="w-[393px] h-[852px] relative bg-app text-textPrimary overflow-hidden select-none">
      {/* Map — fully visible while sheet is off-screen */}
      <img
        src="/map.png"
        alt=""
        aria-hidden
        className="absolute inset-x-0 top-0 h-[480px] w-full object-cover pointer-events-none"
      />

      {/* Header */}
      <div className="absolute left-[27px] top-[66px] w-[340px] h-[43px] flex items-center justify-between">
        <button type="button" className="text-textPrimary p-1 -ml-1">
          <MenuIcon />
        </button>
        <StatusPill />
        <button type="button" className="text-textPrimary p-1 -mr-1">
          <BellIcon size={26} />
        </button>
      </div>

      {/* Bottom sheet — springs up from below */}
      <div
        className="absolute left-[5px] right-[5px] top-[462px] bottom-0 bg-sheet rounded-t-[40px] shadow-[0_-4px_24px_rgba(0,0,0,0.20)]"
        style={sheetStyle}
      >
        {/* Drag handle */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[12px] w-[51px] h-[4px] rounded-full bg-black/15" />

        {/* Content */}
        <div className="flex flex-col gap-[18px] px-[16px] pt-[32px] pb-[110px]">

          {/* Arrival card */}
          <div className="bg-[#dfdfdf] rounded-[23px] px-[18px] py-[16px] flex flex-col gap-[16px]">
            <div className="flex flex-col gap-[4px]">
              <p className="text-[24px] font-medium text-black leading-tight">You've Arrived</p>
              <p className="text-[13px] text-[#595959]">Meet {targetName} at the building entrance</p>
            </div>

            {/* Give / Gets chips */}
            <div className="flex h-[62px] items-center justify-center gap-[6px]">
              <div className="flex-1 flex flex-col items-center gap-[2px] py-[6px] rounded-[15px] bg-[#ccc]">
                <span className="text-[12px] font-semibold text-[#575757]">You Give</span>
                <div className="flex items-end gap-[2px]">
                  {resIcon(give.resource, 22, 'text-black')}
                  <span className="text-[22px] font-bold text-black leading-none">
                    {give.amount}{UNIT_SUFFIX[give.resource] ?? ''}
                  </span>
                </div>
              </div>

              <SwapIcon size={24} className="text-black shrink-0" />

              <div
                className="flex-1 flex flex-col items-center gap-[2px] py-[6px] rounded-[15px]"
                style={{ backgroundColor: ORANGE }}
              >
                <span className="text-[12px] font-semibold text-white">You Gets</span>
                <div className="flex items-end gap-[2px]">
                  {resIcon(get.resource, 22, 'text-white')}
                  <span className="text-[22px] font-bold text-white leading-none">
                    {get.amount}{UNIT_SUFFIX[get.resource] ?? ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Confirm CTA */}
          <button
            type="button"
            onClick={confirmExchange}
            className="w-full h-[50px] rounded-[61px] flex items-center justify-center text-white text-[16px] font-medium"
            style={{ backgroundColor: ORANGE }}
          >
            Confirm Exchange Complete
          </button>

          {/* Report a Problem */}
          <button
            type="button"
            onClick={() => {}}
            className="text-center text-[13px] text-[#595959]"
          >
            Report a Problem
          </button>
        </div>
      </div>

      {/* Bottom tab bar */}
      <BottomTabBar active="map" />
    </div>
  )
}
