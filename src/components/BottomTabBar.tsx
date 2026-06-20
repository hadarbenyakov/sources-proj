import { useNavigate } from 'react-router-dom'
import { HomeIcon, MapIcon, SwapIcon } from '../screens/Home/icons'

type Active = 'map' | 'home' | 'swap'

const ROUTES: Record<Active, string> = {
  map: '/map',
  home: '/home',
  swap: '/exchange',
}

// Per-icon intrinsic sizes from Figma node 935:3046.
const TABS: Array<{ key: Active; Icon: typeof MapIcon; size: number }> = [
  { key: 'map', Icon: MapIcon, size: 23 },
  { key: 'home', Icon: HomeIcon, size: 22 },
  { key: 'swap', Icon: SwapIcon, size: 19 },
]

export default function BottomTabBar({ active }: { active: Active }) {
  const navigate = useNavigate()

  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-[18px] z-10">
      {/* Figma 935:3046 — content-sized #2b2b2b pill, p-4, gap-px, rounded-50.
          Active tab is a full-height white rounded pill. */}
      <div className="inline-flex items-center gap-px p-[4px] rounded-[50px] bg-[#2b2b2b]">
        {TABS.map(({ key, Icon, size }) => {
          const isActive = key === active
          return (
            <button
              key={key}
              type="button"
              onClick={() => navigate(ROUTES[key])}
              className={`flex items-center justify-center px-[20px] py-[12px] rounded-[40px] ${
                isActive ? 'bg-white text-black' : 'text-[#9F9F9F]'
              }`}
            >
              <Icon size={size} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
