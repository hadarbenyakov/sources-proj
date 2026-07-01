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

// Fixed per-tab width so the white indicator pill can slide cleanly between them.
const TAB_W = 62

export default function BottomTabBar({ active }: { active: Active }) {
  const navigate = useNavigate()
  const activeIndex = Math.max(0, TABS.findIndex((t) => t.key === active))

  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-[18px] z-10">
      {/* Figma 935:3046 — #2b2b2b pill, p-4, rounded-50. A single white pill
          slides to the active tab with a soft, bouncy overshoot. */}
      <div className="relative inline-flex items-center p-[4px] rounded-[50px] bg-[#2b2b2b]">
        {/* Sliding active indicator */}
        <div
          className="absolute top-[4px] bottom-[4px] rounded-[40px] bg-white"
          style={{
            width: TAB_W,
            left: 4,
            transform: `translateX(${activeIndex * TAB_W}px)`,
            transition: 'transform 340ms cubic-bezier(0.22, 0.61, 0.36, 1)',
          }}
        />
        {TABS.map(({ key, Icon, size }) => {
          const isActive = key === active
          return (
            <button
              key={key}
              type="button"
              onClick={() => navigate(ROUTES[key])}
              style={{ width: TAB_W }}
              className={`relative z-10 flex items-center justify-center py-[12px] rounded-[40px] transition-colors duration-200 ${
                isActive ? 'text-black' : 'text-[#9F9F9F]'
              }`}
            >
              <span
                className="transition-transform duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)]"
                style={{ transform: isActive ? 'scale(1.08)' : 'scale(1)' }}
              >
                <Icon size={size} />
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
