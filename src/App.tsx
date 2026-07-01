import { useEffect, useRef, useState } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Home from './screens/Home/Home'
import SendRequest from './screens/SendRequest/SendRequest'
import RequestSent from './screens/RequestSent/RequestSent'
import Exchange from './screens/Exchange/Exchange'
import Navigate2 from './screens/Navigate/Navigate'
import Arrived from './screens/Arrived/Arrived'
import ManageResource from './screens/ManageResource/ManageResource'
import BottomTabBar from './components/BottomTabBar'
import IPhoneFrame, { FRAME_W, FRAME_H } from './components/IPhoneFrame'

// The whole UI is designed at a fixed 393×852 canvas. On a real device the
// visible viewport differs (browser chrome, safe areas), which would otherwise
// cause a top gap and in-screen scrolling. Scaling the canvas to fit the actual
// viewport makes it sit exactly on screen with no scroll.
const BASE_W = 393
const BASE_H = 852
// The design reserves an empty band at the very top for the phone status bar.
// On iPhone the dynamic-island safe area already covers that, so without this
// the gap is effectively doubled. Pull the canvas up to absorb the empty band.
const TOP_SHIFT = 60

// Below this viewport width we treat it as a real phone and fill the screen;
// above it (desktop) we render a centered iPhone-sized frame for presenting.
const MOBILE_MAX_W = 500

// Left-to-right order of the main pages (matches the bottom tab bar). Swiping
// horizontally moves between neighbours.
const SWIPE_ORDER = ['/map', '/home', '/exchange']

// Which tab is highlighted for each route that shows the (persistent) tab bar.
const TAB_FOR_PATH: Record<string, 'map' | 'home' | 'swap'> = {
  '/map': 'map',
  '/arrived': 'map',
  '/home': 'home',
  '/manage': 'home',
  '/exchange': 'swap',
}

export default function App() {
  const [scale, setScale] = useState(1)
  const [mobile, setMobile] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  // Horizontal swipe → navigate to the neighbouring main page. A swipe is only
  // recognised when it's clearly horizontal, so vertical drawer drags are safe.
  const swipeStart = useRef<{ x: number; y: number } | null>(null)
  function onSwipeDown(e: React.PointerEvent) {
    swipeStart.current = { x: e.clientX, y: e.clientY }
  }
  function onSwipeUp(e: React.PointerEvent) {
    const s = swipeStart.current
    swipeStart.current = null
    if (!s) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.4) return
    const idx = SWIPE_ORDER.indexOf(location.pathname)
    if (idx === -1) return
    if (dx < 0 && idx < SWIPE_ORDER.length - 1) navigate(SWIPE_ORDER[idx + 1])
    else if (dx > 0 && idx > 0) navigate(SWIPE_ORDER[idx - 1])
  }

  // Page transition: while moving between two main pages we keep both mounted —
  // the incoming one slides in from the side, the outgoing slides off the other
  // way. Keys are the pathnames so React reuses the outgoing page's instance
  // (no flash / lost state).
  type Loc = typeof location
  const [trans, setTrans] = useState<{ cur: Loc; prev: Loc | null; dir: 'next' | 'prev' | null }>({
    cur: location,
    prev: null,
    dir: null,
  })

  function endTransition() {
    setTrans((t) => (t.prev ? { ...t, prev: null, dir: null } : t))
  }

  useEffect(() => {
    if (location.pathname === trans.cur.pathname) return
    const a = SWIPE_ORDER.indexOf(trans.cur.pathname)
    const b = SWIPE_ORDER.indexOf(location.pathname)
    const dir = a !== -1 && b !== -1 ? (b > a ? 'next' : 'prev') : null
    setTrans({ cur: location, prev: dir ? trans.cur : null, dir })
    if (dir) {
      // Fallback cleanup in case animationend doesn't fire (e.g. reduced motion).
      const t = setTimeout(endTransition, 460)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location])

  const renderRoutes = (loc: Loc) => (
    <Routes location={loc}>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<Home />} />
      <Route path="/send-request" element={<SendRequest key="get" mode="get" />} />
      <Route path="/receive-request" element={<SendRequest key="give" mode="give" />} />
      <Route path="/describe-request" element={<SendRequest key="describe" mode="describe" />} />
      <Route path="/request-sent" element={<RequestSent />} />
      <Route path="/exchange" element={<Exchange />} />
      <Route path="/map" element={<Navigate2 />} />
      <Route path="/arrived" element={<Arrived />} />
      <Route path="/manage" element={<ManageResource />} />
    </Routes>
  )

  useEffect(() => {
    function fit() {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const isMobile = vw <= MOBILE_MAX_W
      setMobile(isMobile)
      if (isMobile) {
        // Phone: fill the screen width, edge-to-edge.
        setScale(vw / BASE_W)
      } else {
        // Desktop: fit the full iPhone frame (including bezel + buttons) into
        // the viewport with a little breathing room.
        setScale(Math.min(1, (vh * 0.93) / FRAME_H, (vw * 0.9) / FRAME_W))
      }
    }
    fit()
    window.addEventListener('resize', fit)
    window.addEventListener('orientationchange', fit)
    return () => {
      window.removeEventListener('resize', fit)
      window.removeEventListener('orientationchange', fit)
    }
  }, [])

  return (
    <div
      className={`fixed inset-0 flex justify-center overflow-hidden ${
        mobile ? 'items-start bg-app' : 'items-center bg-[#0d0d0d]'
      }`}
    >
      <div
        id="app-frame"
        style={{
          position: 'relative',
          width: mobile ? BASE_W : FRAME_W,
          height: mobile ? BASE_H : FRAME_H,
          marginTop: mobile ? -TOP_SHIFT * scale : 0,
          transform: `scale(${scale})`,
          transformOrigin: mobile ? 'top center' : 'center center',
          // Buttons overflow the frame on desktop — don't clip them.
          overflow: mobile ? 'hidden' : 'visible',
        }}
      >
        {/* Screen content — lives inside a 393×852 box regardless of whether
            the iPhone frame is shown. On mobile it fills the whole outer div;
            on desktop it sits at the bezel offset inside IPhoneFrame. */}
        {(() => {
          const screenContent = (
            <div
              style={{ position: 'relative', width: BASE_W, height: BASE_H }}
              onPointerDown={onSwipeDown}
              onPointerUp={onSwipeUp}
              onPointerCancel={() => (swipeStart.current = null)}
            >
              {trans.prev && (
                <div
                  key={trans.prev.pathname}
                  className={`absolute inset-0 ${
                    trans.dir === 'next' ? 'anim-slide-out-left' : 'anim-slide-out-right'
                  }`}
                >
                  {renderRoutes(trans.prev)}
                </div>
              )}
              <div
                key={trans.cur.pathname}
                className={`absolute inset-0 ${
                  trans.prev
                    ? trans.dir === 'next'
                      ? 'anim-slide-in-right'
                      : 'anim-slide-in-left'
                    : ''
                }`}
                onAnimationEnd={(e) => {
                  if (e.target === e.currentTarget) endTransition()
                }}
              >
                {renderRoutes(trans.cur)}
              </div>
              {/* Persistent tab bar */}
              {TAB_FOR_PATH[location.pathname] && (
                <BottomTabBar active={TAB_FOR_PATH[location.pathname]} />
              )}
            </div>
          )

          if (mobile) return screenContent

          return (
            <IPhoneFrame>
              {screenContent}
            </IPhoneFrame>
          )
        })()}
      </div>
    </div>
  )
}
