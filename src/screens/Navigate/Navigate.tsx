import { useEffect, useRef, useState } from 'react'
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
  TurnLeftIcon,
  WaterDropIcon,
} from '../Home/icons'
import { loadActiveNavigation } from '../Home/exchanges'

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

type Mode = 'collapsed' | 'expanded' | 'walking'

const DRAWER_TOP: Record<Mode, number> = {
  collapsed: 678,
  expanded: 538,
  walking: 606,
}
const SHEET_TRANSITION = 'top 280ms cubic-bezier(.22,.61,.36,1)'

function NavChip({
  label,
  icon,
  value,
  variant,
}: {
  label: string
  icon: React.ReactNode
  value: string
  variant: 'plain' | 'accent'
}) {
  const isAccent = variant === 'accent'
  return (
    <div
      className={`w-[146px] h-[59px] rounded-[14px] flex flex-col items-center justify-center ${
        isAccent ? 'bg-accent' : 'bg-black/[0.10]'
      }`}
    >
      <span
        className={`text-[13px] font-medium leading-none ${
          isAccent ? 'text-white/85' : 'text-black/65'
        }`}
      >
        {label}
      </span>
      <div className="flex items-center gap-[4px] mt-[6px]">
        {icon}
        <span
          className={`text-[20px] font-bold leading-none ${
            isAccent ? 'text-white' : 'text-black'
          }`}
        >
          {value}
        </span>
      </div>
    </div>
  )
}

// Centerline of the route, extracted from public/route.svg's vertices (same
// viewBox 272.865×389.268) so the dots sit exactly where the solid line was.
// Ordered start (bottom = my position) → destination (top-right).
const ROUTE_CENTERLINE =
  'M 22.4 388.2 L 3.4 316.7 L 28.9 287.7 L 164.4 251.7 L 211.9 197.2 L 199.9 96.2 L 190.9 48.2 L 221.9 3.7 L 270.4 15.7'
// Same path reversed (destination → me). Used for the eat mask so the dots are
// consumed from MY side (behind the walker), not from the destination side.
const ROUTE_CENTERLINE_REVERSED =
  'M 270.4 15.7 L 221.9 3.7 L 190.9 48.2 L 199.9 96.2 L 211.9 197.2 L 164.4 251.7 L 28.9 287.7 L 3.4 316.7 L 22.4 388.2'
const WALK_DUR = '12s'

/**
 * Walking route: static dots sitting on the selected route, "eaten" Pac-Man
 * style as the walker (me) advances toward the destination. The mask reveals
 * only the segment ahead of the walker (white = [frontier, 1]); behind the
 * walker the dots are consumed.
 */
function DottedRoute() {
  return (
    <svg
      className="absolute pointer-events-none"
      style={{ left: 81, top: 214, width: 268, height: 386 }}
      viewBox="0 0 272.865 389.268"
    >
      <defs>
        <mask id="route-eat">
          <path
            d={ROUTE_CENTERLINE_REVERSED}
            stroke="white"
            strokeWidth="20"
            strokeLinecap="round"
            fill="none"
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={0}
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="1"
              dur={WALK_DUR}
              repeatCount="indefinite"
            />
          </path>
        </mask>
      </defs>

      {/* Dots on the route, masked so only the part ahead of the walker shows */}
      <path
        d={ROUTE_CENTERLINE}
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="0 18"
        fill="none"
        mask="url(#route-eat)"
      />

      {/* Walker (me) — the Pac-Man head at the eating frontier */}
      <circle r="9" fill="white" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5">
        <animateMotion
          dur={WALK_DUR}
          repeatCount="indefinite"
          path={ROUTE_CENTERLINE}
        />
      </circle>
    </svg>
  )
}

export default function Navigate() {
  const navigate = useNavigate()
  // Navigation target comes from the notification CTA (falls back to a default).
  const nav = loadActiveNavigation()
  const targetName = nav ? nav.userName.split(' ')[0] : 'Liron'
  const give = nav?.give ?? { resource: 'Power', amount: '4.2' }
  const get = nav?.get ?? { resource: 'Fuel', amount: '10' }
  const [mode, setMode] = useState<Mode>('collapsed')
  const dragRef = useRef<{ startY: number } | null>(null)

  // Once walking, the walker reaches the destination after one trip along the
  // route → transition to the "You've Arrived" screen.
  useEffect(() => {
    if (mode !== 'walking') return
    const t = setTimeout(() => navigate('/arrived'), 12000)
    return () => clearTimeout(t)
  }, [mode, navigate])

  function onDrawerPointerDown(e: React.PointerEvent) {
    if (mode === 'walking') return
    dragRef.current = { startY: e.clientY }
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  }
  function onDrawerPointerUp(e: React.PointerEvent) {
    const s = dragRef.current
    dragRef.current = null
    if (!s) return
    const dy = s.startY - e.clientY
    if (dy > 50) setMode('expanded')
    else if (dy < -50) setMode('collapsed')
  }

  const drawerTop = DRAWER_TOP[mode]
  const isWalking = mode === 'walking'

  return (
    <div className="w-[393px] h-[852px] relative bg-app text-textPrimary overflow-hidden select-none">
      {/* Map layer — map + route + markers scaled together so the route stays
          aligned to the road. Zoomed in and overflowing further down the page. */}
      <div
        className="absolute left-0 top-0 w-[393px] h-[682px] origin-top"
        style={{ transform: 'scale(1.1)' }}
      >
        <img
          src="/map.png"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Route — solid when planning, dotted (Pac-Man) when walking */}
        {isWalking ? (
          <DottedRoute />
        ) : (
          <img
            src="/route.svg"
            alt=""
            aria-hidden
            className="absolute pointer-events-none"
            style={{ left: 81, top: 214, width: 268, height: 386 }}
          />
        )}

        {/* Destination marker — tap to jump straight to the arrival screen */}
        <button
          type="button"
          aria-label="Arrived at destination"
          onClick={() => navigate('/arrived')}
          className="absolute w-[17px] h-[17px] rounded-full bg-accent"
          style={{ left: 345, top: 222 }}
        />
        {/* Start marker — hidden while walking (the moving walker is "me") */}
        {!isWalking && (
          <div
            className="absolute w-[17px] h-[17px] rounded-full bg-white/80 pointer-events-none"
            style={{ left: 93, top: 592 }}
          />
        )}
      </div>

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

      {/* Bottom drawer */}
      <div
        className="absolute left-[5px] right-[4px] bottom-0 bg-sheet rounded-t-[40px] shadow-[0_-4px_20px_rgba(0,0,0,0.18)]"
        style={{ top: drawerTop, transition: SHEET_TRANSITION }}
      >
        {/* Drag area (hidden in walking mode) */}
        {!isWalking && (
          <div
            className="absolute left-0 right-0 top-0 h-[36px] cursor-grab"
            style={{ touchAction: 'pan-y' }}
            onPointerDown={onDrawerPointerDown}
            onPointerUp={onDrawerPointerUp}
            onPointerCancel={onDrawerPointerUp}
          >
            <div className="absolute left-1/2 -translate-x-1/2 top-[20px] w-[51px] h-[4px] rounded-full bg-black/20" />
          </div>
        )}

        {/* Planning content (collapsed + expanded) */}
        {!isWalking && (
          <>
            <div className="absolute left-[33px] right-[33px] top-[36px]">
              <div className="flex items-baseline justify-between">
                <span className="text-[20px] font-semibold text-black">
                  Navigate to {targetName}
                </span>
                <span className="text-[18px] font-medium text-black">
                  9 Min walk
                </span>
              </div>
              <div className="flex items-center justify-between mt-[8px]">
                <span className="text-[13px] text-black/55">
                  Herzel 112, Tel aviv
                </span>
                <span className="text-[13px] text-black/55">650 M</span>
              </div>
            </div>

            {mode === 'expanded' && (
              <>
                <div className="absolute left-[33px] right-[33px] top-[104px] flex items-center justify-between">
                  <NavChip
                    label="You Give"
                    icon={resIcon(give.resource, 20, 'text-black')}
                    value={`${give.amount}${UNIT_SUFFIX[give.resource] ?? ''}`}
                    variant="plain"
                  />
                  <SwapIcon size={24} className="text-black" />
                  <NavChip
                    label="You Gets"
                    icon={resIcon(get.resource, 20, 'text-white')}
                    value={`${get.amount}${UNIT_SUFFIX[get.resource] ?? ''}`}
                    variant="accent"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setMode('walking')}
                  className="absolute left-[23px] right-[23px] top-[182px] h-[48px] rounded-pill bg-accent text-white text-[16px] font-bold"
                >
                  Start Walking
                </button>
              </>
            )}
          </>
        )}

        {/* Walking content */}
        {isWalking && (
          <>
            {/* Turn instructions card */}
            <div className="absolute left-[18px] right-[18px] top-[18px] h-[91px] bg-black/[0.06] rounded-[20px] flex items-center px-[20px] gap-[14px]">
              <div className="w-[49px] h-[49px] flex items-center justify-center text-black">
                <TurnLeftIcon size={36} />
              </div>
              <div className="flex-1">
                <div className="text-[18px] font-semibold text-black leading-tight">
                  Turn Left to
                </div>
                <div className="text-[18px] font-semibold text-black leading-tight">
                  Wolfson street
                </div>
                <div className="text-[13px] text-black/55 mt-[3px]">In 80 M</div>
              </div>
            </div>

            {/* Time + Exit row */}
            <div className="absolute left-[18px] right-[18px] top-[118px] h-[53px] flex items-center justify-between px-[14px]">
              <div className="flex items-baseline gap-[14px]">
                <span className="text-[28px] font-bold text-black leading-none">
                  6 Min
                </span>
                <span className="text-[13px] text-black/55">650 M</span>
                <span className="text-[13px] text-black/55">12:40</span>
              </div>
              <button
                type="button"
                onClick={() => setMode('collapsed')}
                className="h-[36px] px-[20px] rounded-pill bg-accent text-white text-[14px] font-bold"
              >
                Exit
              </button>
            </div>
          </>
        )}
      </div>

      {/* Bottom tab bar */}
      <BottomTabBar active="map" />
    </div>
  )
}
