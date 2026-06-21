import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import BottomTabBar from '../../components/BottomTabBar'
import GlassLayer from '../../components/GlassLayer'
import NotificationsBell from '../../components/NotificationsBell'
import DotRing from './DotRing'
import ExchangeCard from './ExchangeCard'
import EditableExchangeCard from './EditableExchangeCard'
import RequestSheet from './RequestSheet'
import { loadExchanges, loadNegotiations, loadResourceLevels, type ResourceLevels } from './exchanges'

import {
  ArrowRightIcon,
  FireIcon,
  LightningIcon,
  MenuIcon,
  PlusIcon,
} from './icons'

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

// Drawer y-positions taken from Figma: node 925-1733 (closed) and 925-1641 (open).
const DRAWER_CLOSED_TOP = 636
const DRAWER_OPEN_TOP = 479
const DRAWER_RANGE = DRAWER_CLOSED_TOP - DRAWER_OPEN_TOP // 177
// A second drag from the open state lifts the drawer above the cards, stopping
// just at the top of the (already pushed-up) cards — their height only.
const DRAWER_EXPANDED_TOP = 150
// Gentle, delightful overshoot — drawers settle with a soft little bounce.
const SNAP = '380ms cubic-bezier(0.34, 1.56, 0.64, 1)'

type CardKind = 'power' | 'fuel'

function ResourceCard({
  kind,
  label,
  percent,
  fromPercent = 0,
  remaining,
  progress,
  dragging,
  onRequest,
  onManage,
}: {
  kind: CardKind
  label: string
  percent: number
  fromPercent?: number
  remaining: string
  progress: number
  dragging: boolean
  onRequest?: () => void
  onManage?: () => void
}) {
  // Animate the ring once on mount: from `fromPercent` (the previous level, or 0
  // on a normal arrival) up to `percent`. Dots light at a constant cadence, so
  // only the newly-gained dots are animated after an exchange. Running once with
  // stable endpoints avoids the restart-every-frame jump.
  const [ringPercent, setRingPercent] = useState(fromPercent)
  useEffect(() => {
    const RING_DOTS = 14
    const PER_DOT_MS = 85
    const toCount = Math.round((percent / 100) * RING_DOTS)
    const fromCount = Math.round((fromPercent / 100) * RING_DOTS)
    const dur = Math.max(1, Math.abs(toCount - fromCount) * PER_DOT_MS)
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur)
      setRingPercent(fromPercent + (percent - fromPercent) * t) // linear cadence
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [percent, fromPercent])

  // A resource turns white once it climbs above 50%; below that it's orange.
  const ringColor = percent > 50 ? '#ffffff' : '#ff5f1f'

  const isPower = kind === 'power'
  const top = isPower ? lerp(150, 132, progress) : lerp(392, 309, progress)
  const height = isPower ? lerp(215, 150, progress) : lerp(215, 148, progress)
  const innerTop = lerp(55, 20, progress)
  const ringTop = isPower ? lerp(71.5, 33.5, progress) : lerp(71.5, 32.5, progress)
  const gapHeaderToNumber = lerp(10, 12, progress)
  const gapNumberToButtons = lerp(20, 12, progress)

  const cardT = dragging ? 'none' : `top ${SNAP}, height ${SNAP}`
  const innerT = dragging ? 'none' : `top ${SNAP}, margin-top ${SNAP}`

  return (
    <div
      className="absolute left-[9px] w-[376px] rounded-card overflow-hidden"
      style={{ top, height, transition: cardT }}
    >
      <GlassLayer radius={24} />
      <div
        className="absolute left-5"
        style={{ top: innerTop, transition: innerT }}
      >
        <div className="flex items-center gap-[4px] text-white/[0.76]">
          {isPower ? <LightningIcon /> : <FireIcon />}
          <span className="text-[16px] leading-[20px] font-medium">{label}</span>
        </div>
        <div
          className="flex items-end gap-[7px]"
          style={{ marginTop: gapHeaderToNumber, transition: innerT }}
        >
          <span className="font-numeric text-[28px] leading-[31px] font-semibold text-textPrimary">
            {percent}%
          </span>
          <span className="text-[13px] leading-[18px] text-textSecondary pb-[2px]">
            {remaining}
          </span>
        </div>
        <div
          className="flex items-center gap-[10px]"
          style={{ marginTop: gapNumberToButtons, transition: innerT }}
        >
          <button
            type="button"
            onClick={onRequest}
            className="px-[10px] py-[8px] rounded-pill text-[12px] font-semibold bg-white text-[#454545]"
          >
            Request
          </button>
          <button
            type="button"
            onClick={onManage}
            className="pl-[12px] pr-[10px] py-[8px] rounded-pill bg-[rgba(78,78,78,0.5)] text-white text-[12px] font-semibold flex items-center gap-[6px]"
          >
            Manage
            <ArrowRightIcon size={13} />
          </button>
        </div>
      </div>
      <div
        className="absolute right-[20px]"
        style={{ top: ringTop, transition: cardT }}
      >
        <DotRing
          percent={ringPercent}
          size={100}
          dots={14}
          dotSize={17}
          activeColor={ringColor}
          trackColor="#2C2C2C"
        />
      </div>
    </div>
  )
}

type DragState = {
  startY: number
  startProgress: number
  lastY: number
  lastTime: number
  velocity: number // px/ms; positive = moving up
  movedEnough: boolean
}

export default function Home() {
  const navigate = useNavigate()
  const location = useLocation()
  // Levels to display now; if we just completed an exchange the gauges animate
  // up from the previous levels (handed in via router state) to these.
  const prevLevels = (location.state as { prevLevels?: ResourceLevels } | null)?.prevLevels
  const currentLevels = loadResourceLevels()

  const [exchanges, setExchanges] = useState(loadExchanges)
  const [negotiations] = useState(loadNegotiations)

  // Open the drawer on load when there are offers to show.
  const hasOffers = exchanges.length > 0 || negotiations.length > 0
  const [progress, setProgress] = useState(hasOffers ? 1 : 0) // 0 = closed, 1 = open
  // Third level: lifted above the cards. Only reachable by a second drag.
  const [expanded, setExpanded] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [requestSheet, setRequestSheet] = useState<'Power' | 'Fuel' | null>(null)
  const [expandedExchangeId, setExpandedExchangeId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'requests' | 'negotiations'>(
    exchanges.length === 0 && negotiations.length > 0
      ? 'negotiations'
      : 'requests',
  )
  const drag = useRef<DragState | null>(null)

  // Expanding a sent request opens its inline editor and lifts the drawer.
  function toggleExchangeExpand(id: string) {
    setExpandedExchangeId((prev) => {
      const next = prev === id ? null : id
      if (next !== null) {
        setExpanded(true)
        setProgress(1)
      } else {
        setExpanded(false)
      }
      return next
    })
  }

  function onPointerDown(e: React.PointerEvent) {
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    drag.current = {
      startY: e.clientY,
      startProgress: progress,
      lastY: e.clientY,
      lastTime: performance.now(),
      velocity: 0,
      movedEnough: false,
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const s = drag.current
    if (!s) return
    const deltaY = s.startY - e.clientY
    if (!s.movedEnough && Math.abs(deltaY) > 4) {
      s.movedEnough = true
      setDragging(true)
    }
    if (s.movedEnough) {
      // Live drag only drives the closed↔open range; the lift to the expanded
      // level snaps on release so it cleanly overlays the cards.
      if (!expanded) {
        const next = s.startProgress + deltaY / DRAWER_RANGE
        setProgress(Math.max(0, Math.min(1, next)))
      }
      const now = performance.now()
      const dt = now - s.lastTime
      if (dt > 0) s.velocity = (s.lastY - e.clientY) / dt
      s.lastY = e.clientY
      s.lastTime = now
    }
  }

  function onPointerUp() {
    const s = drag.current
    drag.current = null
    if (!s) {
      setDragging(false)
      return
    }
    if (s.movedEnough) {
      const dy = s.startY - s.lastY // up = positive
      if (expanded) {
        // From the expanded level, a downward drag drops back to open.
        if (dy < -50 || s.velocity < -0.4) setExpanded(false)
      } else if (s.startProgress > 0.95 && (dy > 50 || s.velocity > 0.4)) {
        // Already open and dragged up again → lift above the cards.
        setExpanded(true)
        setProgress(1)
      } else {
        let target = progress > 0.5 ? 1 : 0
        if (s.velocity > 0.4) target = 1
        else if (s.velocity < -0.4) target = 0
        setProgress(target)
      }
    }
    setDragging(false)
  }

  const drawerTop = expanded
    ? DRAWER_EXPANDED_TOP
    : lerp(DRAWER_CLOSED_TOP, DRAWER_OPEN_TOP, progress)
  const drawerT = dragging ? 'none' : `top ${SNAP}`
  const emptyOpacity = Math.max(0, (progress - 0.55) / 0.45)
  const stopPointer = (e: React.PointerEvent) => e.stopPropagation()

  return (
    <div className="w-[393px] h-[852px] relative bg-app text-textPrimary overflow-hidden select-none">
      {/* Header */}
      <div className="absolute left-[27px] top-[66px] w-[340px] h-[43px] flex items-center justify-between">
        <button type="button" className="text-textPrimary p-1 -ml-1">
          <MenuIcon />
        </button>
        <NotificationsBell />
      </div>

      {/* Cards */}
      <ResourceCard
        kind="power"
        label="Power"
        percent={currentLevels.power}
        fromPercent={prevLevels?.power ?? 0}
        remaining="12H Left"
        progress={progress}
        dragging={dragging}
        onRequest={() => setRequestSheet('Power')}
        onManage={() =>
          navigate('/manage', {
            state: { resource: 'Power', percent: currentLevels.power, remaining: '12H Left' },
          })
        }
      />
      <ResourceCard
        kind="fuel"
        label="Fuel"
        percent={currentLevels.fuel}
        fromPercent={prevLevels?.fuel ?? 0}
        remaining="4H Left"
        progress={progress}
        dragging={dragging}
        onRequest={() => setRequestSheet('Fuel')}
        onManage={() =>
          navigate('/manage', {
            state: { resource: 'Fuel', percent: currentLevels.fuel, remaining: '4H Left' },
          })
        }
      />

      {/* Drawer */}
      <div
        className="absolute left-[5px] right-[5px] bottom-0 bg-sheet text-sheetText rounded-t-sheet shadow-[0_-4px_20px_rgba(0,0,0,0.18)]"
        style={{ top: drawerTop, transition: drawerT }}
      >
        {/* Drag-handle area: covers the header strip; tap-targets inside stop propagation */}
        <div
          className="absolute left-0 right-0 top-0 h-[120px] touch-none cursor-grab"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="absolute left-1/2 -translate-x-1/2 top-[10px] w-[51px] h-[4px] rounded-full bg-black/20" />
          <div className="absolute left-[24px] right-[24px] top-[46px] flex items-center justify-between">
            <span className="text-[18px] font-semibold">My Exchanges</span>
            <button
              type="button"
              onPointerDown={stopPointer}
              onClick={() => navigate('/send-request')}
              className="w-9 h-9 rounded-full bg-[#dedede] text-[#757575] flex items-center justify-center"
            >
              <PlusIcon strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Tabs — sit on a #dedede track (Figma node 928:2439) */}
        <div className="absolute left-[24px] top-[92px] flex items-center gap-[4px] p-[2px] rounded-[30px] bg-[#dedede]">
          {(['requests', 'negotiations'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTab(t)}
              className={`px-[6px] py-[4px] rounded-[30px] text-[12px] font-semibold text-black ${
                activeTab === t ? 'bg-white' : ''
              }`}
            >
              {t === 'requests' ? 'Requests' : 'Negotiations'}
            </button>
          ))}
        </div>

        {/* Requests = own offers, Negotiations = offers sent to other users */}
        {(activeTab === 'requests' ? exchanges.length : negotiations.length) > 0 ? (
          <div
            className="absolute left-[16px] right-[16px] top-[132px] bottom-0 overflow-y-auto pb-[120px] flex flex-col gap-[12px]"
            style={{ opacity: emptyOpacity, scrollbarWidth: 'none' }}
          >
            {activeTab === 'requests'
              ? exchanges.map((ex) => (
                  <EditableExchangeCard
                    key={ex.id}
                    exchange={ex}
                    isExpanded={expandedExchangeId === ex.id}
                    onToggle={() => toggleExchangeExpand(ex.id)}
                    onSaved={() => {
                      setExchanges(loadExchanges())
                      setExpandedExchangeId(null)
                      setExpanded(false)
                    }}
                  />
                ))
              : negotiations.map((ng) => (
                  <ExchangeCard
                    key={ng.id}
                    name={ng.userName}
                    photo={ng.userPhoto}
                    seed={ng.userSeed}
                    give={ng.give}
                    get={ng.get}
                    status={ng.status}
                  />
                ))}
          </div>
        ) : (
          <div
            className="absolute left-0 right-0 top-[191px] flex flex-col items-center text-center px-[24px] pointer-events-none"
            style={{ opacity: emptyOpacity }}
          >
            <span className="text-[16px] font-semibold text-sheetText">
              {activeTab === 'requests'
                ? 'No exchange requests'
                : 'No negotiations yet'}
            </span>
            <span className="text-[13px] text-sheetText/60 mt-[11px] max-w-[227px] leading-[18px]">
              {activeTab === 'requests'
                ? 'Tap the plus to ask the community for a resource swap'
                : 'Open a neighbor on the Exchange page and send an offer'}
            </span>
          </div>
        )}
      </div>

      {/* Bottom tab bar (always on top of drawer) */}
      <BottomTabBar active="home" />

      {/* Request sheet — slides up from bottom over Home */}
      {requestSheet !== null && (
        <RequestSheet
          key={requestSheet}
          defaultResource={requestSheet}
          onClose={() => setRequestSheet(null)}
        />
      )}


    </div>
  )
}
