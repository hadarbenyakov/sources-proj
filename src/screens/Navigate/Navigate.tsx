import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Avatar from '../../components/Avatar'
import BottomTabBar from '../../components/BottomTabBar'
import NotificationsBell from '../../components/NotificationsBell'
import StatusPill from '../../components/StatusPill'
import {
  FireIcon,
  GoStraightIcon,
  LightningIcon,
  MealIcon,
  MenuIcon,
  SwapIcon,
  TurnLeftIcon,
  TurnRightIcon,
  WaterDropIcon,
} from '../Home/icons'
import {
  setActiveNavigation,
  type ActiveNavigation,
} from '../Home/exchanges'
import { FRIENDS, type ExchangeUser, type Offer } from '../Exchange/data'

const UNIT_LABEL: Record<string, string> = {
  Fuel: 'L',
  Water: 'L',
  Power: 'KWh',
  Meals: 'pcs',
}

// Split a quantity into number + unit (uses the amount's own unit when present).
function splitOffer(o: Offer): { num: string; unit: string } {
  const m = o.amount.match(/^([\d.]+)\s*([a-zA-Z]*)$/)
  const num = m ? m[1] : o.amount
  const unit = m && m[2] ? m[2] : UNIT_LABEL[o.resource] ?? ''
  return { num, unit }
}

function resIcon(resource: string, size: number, className: string) {
  if (resource === 'Fuel') return <FireIcon size={size} className={className} />
  if (resource === 'Power') return <LightningIcon size={size} className={className} />
  if (resource === 'Water') return <WaterDropIcon size={size} className={className} />
  return <MealIcon size={size} className={className} />
}

// A road network polyline traced over the map image (map-layer coords, 393×682):
// from my position at the bottom, up the left-side road, east along the
// "Trafalgar Sq" road, then down "Charing Cross". Markers sit on its vertices
// and routes are sub-paths of it, so every route stays on real streets.
type Pt = { x: number; y: number }
const ROUTE_POINTS: Pt[] = [
  { x: 196, y: 330 }, // 0  START — me, center
  { x: 95, y: 199 }, // 1  down to the Trafalgar Sq road
  { x: 147, y: 186 }, // 2  east along Trafalgar Sq
  { x: 199, y: 189 }, // 3
  { x: 266, y: 199 }, // 4  junction toward Charing Cross
  { x: 280, y: 284 }, // 5  down Charing Cross
  { x: 289, y: 378 }, // 6
  { x: 285, y: 445 }, // 7
]

// People with offers at their original map positions. `routeIndex` is how far
// along the road polyline to travel before turning off toward the marker, so
// each route still follows real streets up to a short final connector.
const MARKERS: Array<{
  user: ExchangeUser
  left: number
  top: number
  routeIndex: number
}> = (() => {
  const withOffers = FRIENDS.filter((u) => u.gives && u.wants)
  const placed = [
    { left: 250, top: 222, routeIndex: 3 },
    { left: 120, top: 300, routeIndex: 1 },
    { left: 305, top: 360, routeIndex: 5 },
    { left: 90, top: 430, routeIndex: 1 },
    { left: 200, top: 500, routeIndex: 5 },
  ]
  return placed.map((p, i) => ({ user: withOffers[i], ...p }))
})()

function pointsToPath(pts: Pt[]): string {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
}

type Mode = 'browsing' | 'walking'

const DRAWER_TOP_BROWSING = 636
const DRAWER_TOP_SELECTED = 520
const DRAWER_TOP_WALKING = 606
const SHEET_TRANSITION = 'top 380ms cubic-bezier(0.34, 1.56, 0.64, 1)'

function NavChip({
  label,
  icon,
  num,
  unit,
  variant,
}: {
  label: string
  icon: React.ReactNode
  num: string
  unit: string
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
      <div className="flex items-end gap-[4px] mt-[6px]">
        {icon}
        <span
          className={`text-[20px] font-bold leading-none ${
            isAccent ? 'text-white' : 'text-black'
          }`}
        >
          {num}
        </span>
        <span
          className={`text-[12px] font-normal leading-none mb-[1px] ${
            isAccent ? 'text-white/90' : 'text-black/70'
          }`}
        >
          {unit}
        </span>
      </div>
    </div>
  )
}

const WALK_DUR = '12s'
const WALK_MS = 12000

// Turn-by-turn instructions shown during walking, advancing on a fixed schedule.
const NAV_STEPS = [
  { Icon: TurnRightIcon, line1: 'Turn right on', line2: 'Trafalgar Square', dist: '250 M' },
  { Icon: GoStraightIcon, line1: 'Continue on', line2: 'Trafalgar Square', dist: '150 M' },
  { Icon: TurnLeftIcon, line1: 'Turn left on', line2: 'Wolfson Street', dist: '80 M' },
  { Icon: GoStraightIcon, line1: 'Arriving at', line2: 'destination', dist: '20 M' },
] as const
const STEP_TIMES = [3000, 6500, 9500] // ms after walk starts to advance to next step

/**
 * Walking route, drawn in the map layer's own coordinate space (393×682),
 * following the road polyline from my start to the selected person's marker.
 * Dots are "eaten" Pac-Man style as the walker (me — my photo) advances; the
 * mask reveals only the segment ahead of the walker.
 */
const MY_PHOTO = 'https://i.pravatar.cc/150?u=me'

// `preview` draws the full planned route (static, no walker); otherwise the
// dots are eaten Pac-Man style behind the moving walker.
function DottedRoute({ pts, preview = false }: { pts: Pt[]; preview?: boolean }) {
  const forward = pointsToPath(pts)
  const reversed = pointsToPath([...pts].reverse())
  return (
    <svg
      className="absolute pointer-events-none"
      style={{ left: 0, top: 0, width: 393, height: 682 }}
      viewBox="0 0 393 682"
    >
      {!preview && (
        <defs>
          <mask id="route-eat">
            <path
              d={reversed}
              stroke="white"
              strokeWidth="24"
              strokeLinecap="round"
              strokeLinejoin="round"
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
                repeatCount="1"
                fill="freeze"
              />
            </path>
          </mask>
          <clipPath id="walker-clip">
            <circle r="18" />
          </clipPath>
        </defs>
      )}

      {/* Dots on the route — full when previewing, masked while walking */}
      <path
        d={forward}
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="0 18"
        fill="none"
        opacity={preview ? 0.6 : 1}
        mask={preview ? undefined : 'url(#route-eat)'}
      />

      {/* Walker — my avatar circle, moves along the route (not in preview) */}
      {!preview && (
        <g>
          <animateMotion dur={WALK_DUR} repeatCount="1" fill="freeze" path={forward} />
          <circle r="21" fill="#3b82f6" stroke="white" strokeWidth="3" />
          <image href={MY_PHOTO} x="-18" y="-18" width="36" height="36" clipPath="url(#walker-clip)" />
        </g>
      )}
    </svg>
  )
}

export default function Navigate() {
  const navigate = useNavigate()
  const location = useLocation()
  // A navigation target handed in from a notification's "Navigate" CTA via
  // one-shot router state. When present we pre-select that person so the screen
  // opens just like tapping them on the map — their offer card up, ready to go.
  // Plain map visits (e.g. the tab bar) carry no state, so nothing is selected.
  const nav = useRef(
    (location.state as { navTarget?: ActiveNavigation } | null)?.navTarget ??
      null,
  ).current

  // Markers shown on the map. If the notification's person isn't one of the demo
  // markers, drop them onto the first marker's spot so they're selectable.
  const markers = useMemo(() => {
    if (!nav || MARKERS.some((m) => m.user.fullName === nav.userName)) {
      return MARKERS
    }
    const synthetic: ExchangeUser = {
      id: nav.userSeed,
      name: nav.userName,
      fullName: nav.userName,
      photo: nav.userPhoto,
      distance: '650 M',
      online: true,
      availableUntil: '19 PM',
      // They give me nav.get; they want from me nav.give.
      gives: { resource: nav.get.resource, amount: nav.get.amount },
      wants: { resource: nav.give.resource, amount: nav.give.amount },
      distanceMeters: 650,
      exchangeCount: 0,
    }
    return [{ ...MARKERS[0], user: synthetic }, ...MARKERS.slice(1)]
  }, [nav])

  const initialSelected = nav
    ? markers.find((m) => m.user.fullName === nav.userName)?.user.id ?? null
    : null

  const [mode, setMode] = useState<Mode>('browsing')
  const [selectedId, setSelectedId] = useState<string | null>(initialSelected)
  const selected = markers.find((m) => m.user.id === selectedId) ?? null
  const isWalking = mode === 'walking'
  // From my point of view: I give what they want, I get what they give.
  const give = selected?.user.wants ?? null
  const get = selected?.user.gives ?? null

  // Once walking, the walker reaches the destination after one trip along the
  // route → transition to the "You've Arrived" screen.
  useEffect(() => {
    if (mode !== 'walking') return
    const t = setTimeout(() => navigate('/arrived'), WALK_MS)
    return () => clearTimeout(t)
  }, [mode, navigate])

  // Advance turn-by-turn instructions as the walk progresses.
  const [navStep, setNavStep] = useState(0)
  useEffect(() => {
    if (!isWalking) { setNavStep(0); return }
    const timers = STEP_TIMES.map((ms, i) => setTimeout(() => setNavStep(i + 1), ms))
    return () => timers.forEach(clearTimeout)
  }, [isWalking])

  // ETA in minutes, derived from the route distance (~80 m/min walking), then
  // counted down over the walk until I reach the destination.
  const totalMin = selected ? Math.max(2, Math.round(selected.user.distanceMeters / 80)) : 0
  const [remainingMin, setRemainingMin] = useState(0)
  useEffect(() => {
    if (!isWalking || totalMin <= 0) return
    setRemainingMin(totalMin)
    const stepMs = WALK_MS / totalMin
    const id = setInterval(() => setRemainingMin((m) => Math.max(0, m - 1)), stepMs)
    return () => clearInterval(id)
  }, [isWalking, totalMin])

  function startWalking() {
    if (!selected || !give || !get) return
    setActiveNavigation({
      userName: selected.user.fullName,
      userSeed: selected.user.id,
      userPhoto: selected.user.photo,
      give: { resource: give.resource, amount: give.amount },
      get: { resource: get.resource, amount: get.amount },
    })
    // Seed the ETA before the first walking render so it doesn't flash 0 → total.
    setRemainingMin(totalMin)
    setNavStep(0)
    setMode('walking')
  }

  const drawerTop = isWalking
    ? DRAWER_TOP_WALKING
    : selected
      ? DRAWER_TOP_SELECTED
      : DRAWER_TOP_BROWSING

  return (
    <div className="w-[393px] h-[852px] relative bg-app text-textPrimary overflow-hidden select-none">
      {/* Map layer — map + route + markers scaled together so the route stays
          aligned to the road. Zoomed in and overflowing further down the page. */}
      <div
        className="absolute left-0 top-0 w-[393px] h-[682px] origin-top"
        style={{ transform: 'scale(1.1)' }}
        onClick={() => {
          // Tapping the map (outside any marker) dismisses the offer card.
          if (!isWalking) setSelectedId(null)
        }}
      >
        <img
          src="/map.png"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Route to the selected person — a static preview before walking,
            then the animated (eaten) route once walking begins. */}
        {selected && (
          <DottedRoute
            preview={!isWalking}
            pts={[
              ...ROUTE_POINTS.slice(0, selected.routeIndex + 1),
              { x: selected.left, y: selected.top },
            ]}
          />
        )}

        {/* Walking: destination marker (the person I'm heading to) stays put */}
        {isWalking && selected && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 p-[3px] rounded-full bg-accent shadow-[0_2px_8px_rgba(0,0,0,0.35)] pointer-events-none"
            style={{ left: selected.left, top: selected.top }}
          >
            <Avatar
              name={selected.user.name}
              size={42}
              seed={selected.user.id}
              photo={selected.user.photo}
            />
          </div>
        )}

        {/* Me — circular avatar at my position (hidden while walking, the moving walker takes over) */}
        {!isWalking && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: ROUTE_POINTS[0].x, top: ROUTE_POINTS[0].y }}
          >
            <div className="p-[3px] rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
              <Avatar name="Me" size={42} seed="me" photo={MY_PHOTO} />
            </div>
          </div>
        )}

        {/* People offer markers (hidden while walking) */}
        {!isWalking &&
          markers.map((m) => {
            const isSel = m.user.id === selectedId
            return (
              <button
                key={m.user.id}
                type="button"
                aria-label={`Offer from ${m.user.fullName}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedId((prev) => (prev === m.user.id ? null : m.user.id))
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: m.left, top: m.top }}
              >
                <div
                  className={`rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.35)] ${
                    isSel ? 'p-[3px] bg-accent' : ''
                  }`}
                >
                  <Avatar
                    name={m.user.name}
                    size={isSel ? 42 : 30}
                    seed={m.user.id}
                    photo={m.user.photo}
                  />
                </div>
              </button>
            )
          })}
      </div>

      {/* Header */}
      <div className="absolute left-[27px] top-[66px] w-[340px] h-[43px] flex items-center justify-between">
        <button type="button" className="text-textPrimary p-1 -ml-1">
          <MenuIcon />
        </button>
        <StatusPill />
        <NotificationsBell />
      </div>

      {/* Bottom drawer */}
      <div
        className="absolute left-[5px] right-[4px] bottom-0 bg-sheet rounded-t-[40px] shadow-[0_-4px_20px_rgba(0,0,0,0.18)]"
        style={{ top: drawerTop, transition: SHEET_TRANSITION }}
      >
        <div className="absolute left-1/2 -translate-x-1/2 top-[20px] w-[51px] h-[4px] rounded-full bg-black/20" />

        {/* Browsing, nothing selected → hint */}
        {!isWalking && !selected && (
          <div className="absolute left-0 right-0 top-[40px] flex flex-col items-center text-center px-[24px]">
            <span className="text-[18px] font-semibold text-black">
              Offers near you
            </span>
            <span className="text-[13px] text-black/55 mt-[8px] max-w-[250px] leading-[18px]">
              Tap a person on the map to see their exchange offer
            </span>
          </div>
        )}

        {/* Selected offer card */}
        {!isWalking && selected && give && get && (
          <>
            <div className="absolute left-[33px] right-[33px] top-[40px] flex items-center gap-[10px]">
              <Avatar
                name={selected.user.name}
                size={42}
                seed={selected.user.id}
                photo={selected.user.photo}
              />
              <div className="flex flex-col">
                <span className="text-[18px] font-semibold text-black leading-tight">
                  {selected.user.fullName}
                </span>
                <span className="text-[13px] text-black/55 leading-tight">
                  Herzel 112, Tel aviv · {selected.user.distance}
                </span>
              </div>
            </div>

            <div className="absolute left-[33px] right-[33px] top-[110px] flex items-center justify-between">
              <NavChip
                label="You Give"
                icon={resIcon(give.resource, 20, 'text-black')}
                num={splitOffer(give).num}
                unit={splitOffer(give).unit}
                variant="plain"
              />
              <SwapIcon size={24} className="text-black" />
              <NavChip
                label="You Get"
                icon={resIcon(get.resource, 20, 'text-white')}
                num={splitOffer(get).num}
                unit={splitOffer(get).unit}
                variant="accent"
              />
            </div>

            <button
              type="button"
              onClick={startWalking}
              className="absolute left-[23px] right-[23px] top-[188px] h-[48px] rounded-pill bg-accent text-white text-[16px] font-bold"
            >
              Navigate to {selected.user.name.split(' ')[0]}
            </button>
          </>
        )}

        {/* Walking content */}
        {isWalking && (
          <>
            {/* Turn instructions card — updates as walker advances along route */}
            {(() => {
              const step = NAV_STEPS[navStep]
              return (
                <div className="absolute left-[18px] right-[18px] top-[18px] h-[91px] bg-black/[0.06] rounded-[20px] flex items-center px-[20px] gap-[14px]">
                  <div className="w-[49px] h-[49px] flex items-center justify-center text-black">
                    <step.Icon size={36} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[18px] font-semibold text-black leading-tight">
                      {step.line1}
                    </div>
                    <div className="text-[18px] font-semibold text-black leading-tight">
                      {step.line2}
                    </div>
                    <div className="text-[13px] text-black/55 mt-[3px]">In {step.dist}</div>
                  </div>
                </div>
              )
            })()}

            {/* Time + Exit row */}
            <div className="absolute left-[18px] right-[18px] top-[118px] h-[53px] flex items-center justify-between px-[14px]">
              <div className="flex items-baseline gap-[14px]">
                <span className="text-[28px] font-bold text-black leading-none">
                  {remainingMin} Min
                </span>
                <span className="text-[13px] text-black/55">
                  {selected?.user.distance ?? '650 M'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMode('browsing')
                  setSelectedId(null)
                }}
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
