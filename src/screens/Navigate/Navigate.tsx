import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Avatar from '../../components/Avatar'
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
  loadResourceLevels,
  saveResourceLevels,
  setActiveNavigation,
  type ActiveNavigation,
} from '../Home/exchanges'
import { FRIENDS, NEIGHBORS, type ExchangeUser, type Offer } from '../Exchange/data'
import MapView from './MapView'
import {
  MAPBOX_TOKEN,
  ME_COORD,
  PEOPLE_COORDS,
  PEOPLE_PLACES,
  approxDistanceM,
  distanceLabel,
} from '../../lib/mapbox'

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

// Tel Aviv bounding box + street names for scattering the extra people.
const TLV = { minLat: 32.045, maxLat: 32.115, minLng: 34.755, maxLng: 34.805 }
const TLV_STREETS = [
  'Dizengoff St', 'Rothschild Blvd', 'Allenby St', 'Ibn Gabirol St',
  'King George St', 'Ben Yehuda St', 'HaYarkon St', 'Bograshov St',
  'Sheinkin St', 'Frishman St', 'Arlozorov St', 'Nahalat Binyamin St',
  'Yehuda HaLevi St', 'Salame St', 'Yefet St', 'Kibbutz Galuyot',
  'Eilat St', 'HaMasger St', 'La Guardia St', 'Namir Rd',
]

// Tiny deterministic [0,1) hash so each person keeps a stable random spot.
function seededRand(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  h ^= h << 13
  h ^= h >>> 17
  h ^= h << 5
  return ((h >>> 0) % 100000) / 100000
}

type MarkerInfo = {
  user: ExchangeUser
  lng: number
  lat: number
  place: string
  // Pixel-map fallback placement (only the first few, when there's no token).
  left?: number
  top?: number
  routeIndex?: number
}

// People with offers. The first handful sit in Florentin (near me, nicely laid
// out); the rest are scattered randomly across Tel Aviv.
const MARKERS: MarkerInfo[] = (() => {
  const withOffers = [...FRIENDS, ...NEIGHBORS].filter((u) => u.gives && u.wants)
  const placed = [
    { left: 250, top: 222, routeIndex: 3 },
    { left: 120, top: 300, routeIndex: 1 },
    { left: 305, top: 360, routeIndex: 5 },
    { left: 90, top: 430, routeIndex: 1 },
    { left: 200, top: 470, routeIndex: 5 },
    { left: 60, top: 150, routeIndex: 1 },
    { left: 345, top: 150, routeIndex: 4 },
    { left: 175, top: 105, routeIndex: 3 },
    { left: 350, top: 460, routeIndex: 6 },
    { left: 32, top: 320, routeIndex: 1 },
  ]
  return withOffers.map((user, i): MarkerInfo => {
    if (i < PEOPLE_COORDS.length) {
      const [lng, lat] = PEOPLE_COORDS[i]
      return { user, lng, lat, place: PEOPLE_PLACES[i], ...placed[i] }
    }
    const lat = TLV.minLat + seededRand(user.id + 'lat') * (TLV.maxLat - TLV.minLat)
    const lng = TLV.minLng + seededRand(user.id + 'lng') * (TLV.maxLng - TLV.minLng)
    const street = TLV_STREETS[Math.floor(seededRand(user.id + 'st') * TLV_STREETS.length)]
    const num = 1 + Math.floor(seededRand(user.id + 'no') * 120)
    return { user, lng, lat, place: `${street} ${num}, Tel Aviv` }
  })
})()

function pointsToPath(pts: Pt[]): string {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
}

type Mode = 'browsing' | 'walking' | 'arrived'

const DRAWER_TOP_BROWSING = 636
const DRAWER_TOP_SELECTED = 520
const DRAWER_TOP_WALKING = 606
const DRAWER_TOP_CLOSED = 790 // collapsed — only the grab handle peeks above the tab bar
const SHEET_TRANSITION = 'top 380ms cubic-bezier(0.34, 1.56, 0.64, 1)'

// Map pan/zoom. The map content is the 393×852 viewport at scale 1; zooming in
// lets you pan around, and the default is slightly zoomed in (matching the old
// framing). MIN_SCALE = 1 shows the whole map (revealing edge markers).
const VW = 393
const VH = 852
const MIN_SCALE = 1
const MAX_SCALE = 2.5
type View = { scale: number; x: number; y: number }
function clampView(v: View): View {
  const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, v.scale))
  const x = Math.max(VW * (1 - scale), Math.min(0, v.x))
  const y = Math.max(VH * (1 - scale), Math.min(0, v.y))
  return { scale, x, y }
}
const DEFAULT_VIEW: View = clampView({ scale: 1.1, x: (VW * (1 - 1.1)) / 2, y: 0 })

// Append the unit unless the amount already carries one (e.g. "5L").
function withUnit(resource: string, amount: string): string {
  if (/[a-zA-Z]$/.test(amount)) return amount
  const u = UNIT_LABEL[resource]
  return u ? `${amount} ${u}` : amount
}

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
        isAccent ? 'bg-black' : 'bg-black/[0.10]'
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

const WALK_DUR = '18s'
const WALK_MS = 18000

// Turn-by-turn instructions shown during walking, advancing on a fixed schedule.
const NAV_STEPS = [
  { Icon: TurnRightIcon, line1: 'Turn right on', line2: 'Trafalgar Square', dist: '250 M' },
  { Icon: GoStraightIcon, line1: 'Continue on', line2: 'Trafalgar Square', dist: '150 M' },
  { Icon: TurnLeftIcon, line1: 'Turn left on', line2: 'Wolfson Street', dist: '80 M' },
  { Icon: GoStraightIcon, line1: 'Arriving at', line2: 'destination', dist: '20 M' },
] as const
const STEP_TIMES = [4500, 9000, 13500] // ms after drive starts to advance to next step

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

  // Geo positions + real street address & distance for each marker.
  const people = useMemo(
    () =>
      markers.map((m) => {
        const meters = approxDistanceM(ME_COORD, [m.lng, m.lat])
        return {
          id: m.user.id,
          name: m.user.name,
          photo: m.user.photo,
          lng: m.lng,
          lat: m.lat,
          place: m.place,
          distance: distanceLabel(meters),
          meters,
        }
      }),
    [markers],
  )

  const initialSelected = nav
    ? markers.find((m) => m.user.fullName === nav.userName)?.user.id ?? null
    : null

  const [mode, setMode] = useState<Mode>('browsing')
  const [selectedId, setSelectedId] = useState<string | null>(initialSelected)
  const selected = markers.find((m) => m.user.id === selectedId) ?? null
  const selectedPerson = people.find((p) => p.id === selectedId) ?? null
  const isWalking = mode === 'walking'
  const isArrived = mode === 'arrived'
  const isActive = isWalking || isArrived
  // From my point of view: I give what they want, I get what they give.
  const give = selected?.user.wants ?? null
  const get = selected?.user.gives ?? null

  // After the walk animation completes, show the arrived state in the drawer.
  // With Mapbox, MapView drives arrival via its onArrived callback instead.
  useEffect(() => {
    if (mode !== 'walking' || MAPBOX_TOKEN) return
    const t = setTimeout(() => setMode('arrived'), WALK_MS)
    return () => clearTimeout(t)
  }, [mode])

  // Spring the "You've Arrived" sheet up from below once we arrive.
  const [arrivedUp, setArrivedUp] = useState(false)
  useEffect(() => {
    if (!isArrived) { setArrivedUp(false); return }
    const r = requestAnimationFrame(() => setArrivedUp(true))
    return () => cancelAnimationFrame(r)
  }, [isArrived])

  function confirmExchange() {
    // Receiving the fuel refills the tank — the Home gauge animates up from the
    // low level (handed in via prevLevels) to the new level.
    const prevLevels = loadResourceLevels()
    saveResourceLevels({ ...prevLevels, fuel: 89 })
    navigate('/home', { state: { prevLevels } })
  }

  // Advance turn-by-turn instructions as the walk progresses.
  const [navStep, setNavStep] = useState(0)
  useEffect(() => {
    if (!isWalking) { setNavStep(0); return }
    const timers = STEP_TIMES.map((ms, i) => setTimeout(() => setNavStep(i + 1), ms))
    return () => timers.forEach(clearTimeout)
  }, [isWalking])

  // ETA in minutes, derived from the route distance (~350 m/min city driving),
  // then counted down over the drive until I reach the destination.
  const totalMin = selectedPerson ? Math.max(2, Math.round(selectedPerson.meters / 350)) : 0
  const [remainingMin, setRemainingMin] = useState(0)
  useEffect(() => {
    if (!isWalking || totalMin <= 0) return
    setRemainingMin(totalMin)
    const stepMs = WALK_MS / totalMin
    const id = setInterval(() => setRemainingMin((m) => Math.max(0, m - 1)), stepMs)
    return () => clearInterval(id)
  }, [isWalking, totalMin])

  // Fuel drains 1% per second while driving, bottoming out at LOW_FUEL — then a
  // top alert pops. The live value also feeds the header status pill.
  const LOW_FUEL = 5
  const [fuel, setFuel] = useState(() => loadResourceLevels().fuel)
  const [lowFuelAlert, setLowFuelAlert] = useState(false)
  useEffect(() => {
    if (!isWalking) return
    let current = loadResourceLevels().fuel
    setFuel(current)
    if (current <= LOW_FUEL) {
      setLowFuelAlert(true)
      return
    }
    // Spread the drop so it hits 5% ~2s before arrival (alert a touch earlier).
    const stepMs = (WALK_MS - 2000) / (current - LOW_FUEL)
    const id = setInterval(() => {
      current -= 1
      setFuel(current)
      if (current <= LOW_FUEL) {
        clearInterval(id)
        setLowFuelAlert(true)
        saveResourceLevels({ ...loadResourceLevels(), fuel: LOW_FUEL })
      }
    }, stepMs)
    return () => clearInterval(id)
  }, [isWalking])

  // Auto-dismiss the low-fuel banner a few seconds after it appears.
  useEffect(() => {
    if (!lowFuelAlert) return
    const t = setTimeout(() => setLowFuelAlert(false), 4500)
    return () => clearTimeout(t)
  }, [lowFuelAlert])

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
    setCollapsed(false)
    setView(DEFAULT_VIEW)
    setLowFuelAlert(false)
    setFuel(loadResourceLevels().fuel)
    setMode('walking')
  }

  // Recenter button → bumps a nonce that MapView reacts to with a flyTo.
  const [recenterNonce, setRecenterNonce] = useState(0)

  // Map pan/zoom (browsing only). Drag to pan, +/- buttons or wheel to zoom.
  const [view, setView] = useState<View>(DEFAULT_VIEW)
  const [panning, setPanning] = useState(false)
  const panRef = useRef<{ sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null)

  function onMapDown(e: React.PointerEvent) {
    if (isActive) return
    panRef.current = { sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y, moved: false }
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    setPanning(true)
  }
  function onMapMove(e: React.PointerEvent) {
    const p = panRef.current
    if (!p) return
    const dx = e.clientX - p.sx
    const dy = e.clientY - p.sy
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) p.moved = true
    if (p.moved) setView((v) => clampView({ scale: v.scale, x: p.ox + dx, y: p.oy + dy }))
  }
  function onMapUp() {
    const p = panRef.current
    panRef.current = null
    setPanning(false)
    // A tap (no drag) on empty map dismisses the selected offer card.
    if (p && !p.moved && !isActive) setSelectedId(null)
  }

  // Zoom toward the viewport centre, keeping that point fixed.
  function zoomTo(nextScale: number) {
    setView((v) => {
      const s = Math.max(MIN_SCALE, Math.min(MAX_SCALE, nextScale))
      const wx = (VW / 2 - v.x) / v.scale
      const wy = (VH / 2 - v.y) / v.scale
      return clampView({ scale: s, x: VW / 2 - wx * s, y: VH / 2 - wy * s })
    })
  }
  function onWheel(e: React.WheelEvent) {
    if (isActive) return
    zoomTo(view.scale * (e.deltaY < 0 ? 1.12 : 0.89))
  }

  // Draggable drawer: the open position depends on the current mode; a downward
  // drag collapses it to just the handle, an upward drag re-opens it.
  const openTop = isActive
    ? DRAWER_TOP_WALKING
    : selected
      ? DRAWER_TOP_SELECTED
      : DRAWER_TOP_BROWSING
  const [collapsed, setCollapsed] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{ startY: number; lastY: number } | null>(null)
  const baseTop = collapsed ? DRAWER_TOP_CLOSED : openTop
  const drawerTop = Math.max(openTop, Math.min(DRAWER_TOP_CLOSED, baseTop + dragY))

  function onDrawerDown(e: React.PointerEvent) {
    dragRef.current = { startY: e.clientY, lastY: e.clientY }
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    setDragging(true)
  }
  function onDrawerMove(e: React.PointerEvent) {
    const d = dragRef.current
    if (!d) return
    d.lastY = e.clientY
    setDragY(e.clientY - d.startY)
  }
  function onDrawerUp() {
    const d = dragRef.current
    dragRef.current = null
    setDragging(false)
    const moved = d ? d.lastY - d.startY : 0
    setDragY(0)
    if (moved > 60) setCollapsed(true)
    else if (moved < -60) setCollapsed(false)
  }

  return (
    <div className="w-[393px] h-[852px] relative bg-app text-textPrimary overflow-hidden select-none">
      {/* Interactive Mapbox map (used when a token is configured) */}
      {MAPBOX_TOKEN && (
        <MapView
          people={people}
          selectedId={selectedId}
          phase={mode}
          onSelect={(id) => {
            setCollapsed(false)
            setSelectedId(id)
          }}
          onArrived={() => setMode('arrived')}
          walkMs={WALK_MS}
          recenterNonce={recenterNonce}
        />
      )}

      {/* Static fallback map + manual zoom/pan (no Mapbox token) */}
      {!MAPBOX_TOKEN && (
      <div
        className="absolute left-0 top-0 w-[393px] h-[852px] origin-top-left touch-none"
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          transition: panning ? 'none' : 'transform 220ms ease-out',
          cursor: isActive ? 'default' : panning ? 'grabbing' : 'grab',
        }}
        onPointerDown={onMapDown}
        onPointerMove={onMapMove}
        onPointerUp={onMapUp}
        onPointerCancel={onMapUp}
        onWheel={onWheel}
      >
        <img
          src="/map.png"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Route — static preview when browsing+selected, animated while walking,
            frozen at destination once arrived (preview=false keeps the SVG alive). */}
        {selected && (
          <DottedRoute
            preview={mode === 'browsing'}
            pts={[
              ...ROUTE_POINTS.slice(0, (selected.routeIndex ?? 0) + 1),
              { x: selected.left ?? ROUTE_POINTS[0].x, y: selected.top ?? ROUTE_POINTS[0].y },
            ]}
          />
        )}

        {/* Destination marker — stays visible while walking and after arriving */}
        {isActive && selected && (
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

        {/* Me — static avatar at start (hidden once walking/arrived; the SVG walker takes over) */}
        {!isActive && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: ROUTE_POINTS[0].x, top: ROUTE_POINTS[0].y }}
          >
            <div className="p-[3px] rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
              <Avatar name="Me" size={42} seed="me" photo={MY_PHOTO} />
            </div>
          </div>
        )}

        {/* People offer markers — hidden during navigation */}
        {!isActive &&
          markers.filter((m) => m.left != null).map((m, i) => {
            const isSel = m.user.id === selectedId
            return (
              <button
                key={m.user.id}
                type="button"
                aria-label={`Offer from ${m.user.fullName}`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  setCollapsed(false)
                  setSelectedId((prev) => (prev === m.user.id ? null : m.user.id))
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: m.left, top: m.top }}
              >
                <div
                  className={`anim-pop-in rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.35)] ${
                    isSel ? 'p-[3px] bg-accent' : ''
                  }`}
                  style={{ animationDelay: `${180 + i * 130}ms` }}
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
      )}

      {/* Header */}
      <div className="absolute left-[27px] top-[66px] w-[340px] h-[43px] flex items-center justify-between">
        <button type="button" className="text-textPrimary p-1 -ml-1">
          <MenuIcon />
        </button>
        <StatusPill fuel={fuel} />
        <NotificationsBell />
      </div>

      {/* Zoom controls (static fallback only — Mapbox has its own) */}
      {!MAPBOX_TOKEN && !isActive && (
        <div className="absolute right-[16px] top-[124px] flex flex-col rounded-[16px] overflow-hidden bg-white shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => zoomTo(view.scale * 1.25)}
            disabled={view.scale >= MAX_SCALE - 0.001}
            className="w-[40px] h-[40px] flex items-center justify-center text-[24px] font-light text-black/80 active:bg-black/5 disabled:text-black/25"
          >
            +
          </button>
          <div className="h-px bg-black/10" />
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => zoomTo(view.scale * 0.8)}
            disabled={view.scale <= MIN_SCALE + 0.001}
            className="w-[40px] h-[40px] flex items-center justify-center text-[24px] font-light text-black/80 active:bg-black/5 disabled:text-black/25"
          >
            −
          </button>
        </div>
      )}

      {/* Recenter button — bottom-right, just above the drawer (Mapbox only) */}
      {MAPBOX_TOKEN && !isActive && (
        <button
          type="button"
          aria-label="Recenter map"
          onClick={() => setRecenterNonce((n) => n + 1)}
          className="absolute right-[16px] z-40 w-[44px] h-[44px] rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.28)] flex items-center justify-center active:scale-95 transition-transform"
          style={{ top: drawerTop - 56 }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-black">
            <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
            <path
              d="M12 2v3M12 19v3M2 12h3M19 12h3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}

      {/* Bottom drawer */}
      <div
        className="absolute left-[5px] right-[4px] bottom-0 bg-sheet rounded-t-[40px] shadow-[0_-4px_20px_rgba(0,0,0,0.18)]"
        style={{ top: drawerTop, transition: dragging ? 'none' : SHEET_TRANSITION }}
      >
        {/* Grab handle — drag to open / close the drawer */}
        <div
          className="absolute left-0 right-0 top-0 h-[34px] touch-none cursor-grab"
          onPointerDown={onDrawerDown}
          onPointerMove={onDrawerMove}
          onPointerUp={onDrawerUp}
          onPointerCancel={onDrawerUp}
        >
          <div className="absolute left-1/2 -translate-x-1/2 top-[20px] w-[51px] h-[4px] rounded-full bg-black/20" />
        </div>

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

        {/* Selected offer card (browsing only) */}
        {mode === 'browsing' && selected && give && get && (
          <>
            {/* Light-grey card behind the person's details (matches the arrival sheet) */}
            <div className="absolute left-[16px] right-[16px] top-[26px] h-[156px] bg-[#dfdfdf] rounded-[23px]" />

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
                  {selectedPerson?.place ?? 'Tel Aviv'} · {selectedPerson?.distance ?? selected.user.distance}
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
                  {selectedPerson?.distance ?? '650 M'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMode('browsing')
                  setSelectedId(null)
                }}
                className="h-[36px] px-[20px] rounded-pill bg-black text-white text-[14px] font-bold"
              >
                Exit
              </button>
            </div>
          </>
        )}
      </div>

      {/* Arrived sheet — springs up from below once the walk completes */}
      {isArrived && selected && give && get && (
        <div
          className="absolute left-[5px] right-[5px] top-[462px] bottom-0 bg-sheet rounded-t-[40px] shadow-[0_-4px_24px_rgba(0,0,0,0.20)]"
          style={{
            transform: arrivedUp ? 'translateY(0)' : 'translateY(110%)',
            transition: 'transform 680ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {/* Drag handle */}
          <div className="absolute left-1/2 -translate-x-1/2 top-[12px] w-[51px] h-[4px] rounded-full bg-black/15" />

          <div className="flex flex-col gap-[18px] px-[16px] pt-[32px] pb-[110px]">
            {/* Arrival card */}
            <div className="bg-[#dfdfdf] rounded-[23px] px-[18px] py-[16px] flex flex-col gap-[16px]">
              <div className="flex flex-col gap-[4px]">
                <p className="text-[24px] font-medium text-black leading-tight">You've Arrived</p>
                <p className="text-[13px] text-[#595959]">
                  Meet {selected.user.name.split(' ')[0]} at the building entrance
                </p>
              </div>

              {/* Give / Gets chips */}
              <div className="flex h-[62px] items-center justify-center gap-[6px]">
                <div className="flex-1 flex flex-col items-center gap-[2px] py-[6px] rounded-[15px] bg-[#ccc]">
                  <span className="text-[12px] font-semibold text-[#575757]">You Give</span>
                  <div className="flex items-end gap-[2px]">
                    {resIcon(give.resource, 22, 'text-black')}
                    <span className="text-[22px] font-bold text-black leading-none">
                      {withUnit(give.resource, give.amount)}
                    </span>
                  </div>
                </div>

                <SwapIcon size={24} className="text-black shrink-0" />

                <div className="flex-1 flex flex-col items-center gap-[2px] py-[6px] rounded-[15px] bg-black">
                  <span className="text-[12px] font-semibold text-white">You Gets</span>
                  <div className="flex items-end gap-[2px]">
                    {resIcon(get.resource, 22, 'text-white')}
                    <span className="text-[22px] font-bold text-white leading-none">
                      {withUnit(get.resource, get.amount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirm CTA */}
            <button
              type="button"
              onClick={confirmExchange}
              className="w-full h-[50px] rounded-[61px] flex items-center justify-center text-white text-[16px] font-medium bg-accent"
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
      )}

      {/* Low-fuel alert — slides down from the top during navigation */}
      <div
        className="absolute left-[12px] right-[12px] top-[14px] z-[60] pointer-events-none"
        style={{
          transform: lowFuelAlert ? 'translateY(0)' : 'translateY(-160%)',
          opacity: lowFuelAlert ? 1 : 0,
          transition: 'transform 380ms cubic-bezier(.22,.61,.36,1), opacity 380ms',
        }}
      >
        <div className="flex items-center gap-[12px] rounded-[18px] bg-accent text-white px-[16px] py-[12px] shadow-[0_4px_16px_rgba(0,0,0,0.35)]">
          <FireIcon size={22} className="text-white shrink-0" />
          <div className="leading-tight">
            <div className="text-[14px] font-bold">Low fuel — {LOW_FUEL}% left</div>
            <div className="text-[12px] text-white/85">Keep an eye on your fuel level</div>
          </div>
        </div>
      </div>
    </div>
  )
}
