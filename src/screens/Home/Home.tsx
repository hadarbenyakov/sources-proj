import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomTabBar from '../../components/BottomTabBar'
import GlassPill from '../../components/GlassPill'
import DotRing from './DotRing'
import ExchangeCard from './ExchangeCard'
import NotificationsPanel from './NotificationsPanel'
import RequestSheet from './RequestSheet'
import {
  loadExchanges,
  loadNegotiations,
  loadNotifications,
  markNotificationsRead,
  setActiveNavigation,
  type AppNotification,
} from './exchanges'

const MY_PHOTO = 'https://i.pravatar.cc/150?u=me'
import {
  ArrowRightIcon,
  BellIcon,
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
const SNAP = '280ms cubic-bezier(.22,.61,.36,1)'

type CardKind = 'power' | 'fuel'

function ResourceCard({
  kind,
  label,
  percent,
  remaining,
  requestActive,
  progress,
  dragging,
  onRequest,
}: {
  kind: CardKind
  label: string
  percent: number
  remaining: string
  requestActive?: boolean
  progress: number
  dragging: boolean
  onRequest?: () => void
}) {
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
      className="absolute left-[9px] w-[376px] rounded-card bg-black/20 overflow-hidden"
      style={{ top, height, transition: cardT }}
    >
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
          percent={percent}
          size={100}
          dots={14}
          dotSize={17}
          activeColor={requestActive ? '#ff5f1f' : '#ffffff'}
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
  const [progress, setProgress] = useState(0) // 0 = closed, 1 = open
  const [dragging, setDragging] = useState(false)
  const [requestSheet, setRequestSheet] = useState<'Power' | 'Fuel' | null>(null)
  const [activeTab, setActiveTab] = useState<'requests' | 'negotiations'>(
    'requests',
  )
  const [exchanges] = useState(loadExchanges)
  const [negotiations] = useState(loadNegotiations)
  const [notifs, setNotifs] = useState(loadNotifications)
  const [notifOpen, setNotifOpen] = useState(false)
  const hasUnread = notifs.some((n) => !n.read)

  function openNotifications() {
    setNotifOpen(true)
    markNotificationsRead()
    setNotifs(loadNotifications())
  }

  function startNavigation(n: AppNotification) {
    setActiveNavigation({
      userName: n.userName,
      userSeed: n.userSeed,
      userPhoto: n.userPhoto,
      give: n.give,
      get: n.get,
    })
    navigate('/map')
  }
  const drag = useRef<DragState | null>(null)

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
      const next = s.startProgress + deltaY / DRAWER_RANGE
      setProgress(Math.max(0, Math.min(1, next)))
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
      let target = progress > 0.5 ? 1 : 0
      if (s.velocity > 0.4) target = 1
      else if (s.velocity < -0.4) target = 0
      setProgress(target)
    }
    setDragging(false)
  }

  const drawerTop = lerp(DRAWER_CLOSED_TOP, DRAWER_OPEN_TOP, progress)
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
        <GlassPill className="h-[43px] w-[204px] justify-center">
          <span className="text-[14px] font-bold text-white whitespace-nowrap">
            12:30 PM
          </span>
        </GlassPill>
        <button
          type="button"
          onClick={openNotifications}
          aria-label="Notifications"
          className="relative text-textPrimary p-1 -mr-1"
        >
          <BellIcon size={26} />
          {hasUnread && (
            <span className="absolute top-[2px] right-[2px] w-[10px] h-[10px] rounded-full bg-accent border-2 border-app" />
          )}
        </button>
      </div>

      {/* Cards */}
      <ResourceCard
        kind="power"
        label="Power"
        percent={78}
        remaining="12H Left"
        progress={progress}
        dragging={dragging}
        onRequest={() => setRequestSheet('Power')}
      />
      <ResourceCard
        kind="fuel"
        label="Fuel"
        percent={19}
        remaining="4H Left"
        requestActive
        progress={progress}
        dragging={dragging}
        onRequest={() => setRequestSheet('Fuel')}
      />

      {/* Drawer */}
      <div
        className="absolute left-0 right-0 bottom-0 bg-sheet text-sheetText rounded-t-sheet shadow-[0_-4px_20px_rgba(0,0,0,0.18)]"
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
                  <ExchangeCard
                    key={ex.id}
                    name="You"
                    photo={MY_PHOTO}
                    seed="me"
                    give={ex.give}
                    get={ex.get}
                    status={ex.status}
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

      {/* Notifications side drawer */}
      {notifOpen && (
        <NotificationsPanel
          notifications={notifs}
          onClose={() => setNotifOpen(false)}
          onNavigate={startNavigation}
        />
      )}

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
