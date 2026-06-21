import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './screens/Home/Home'
import SendRequest from './screens/SendRequest/SendRequest'
import RequestSent from './screens/RequestSent/RequestSent'
import Exchange from './screens/Exchange/Exchange'
import Navigate2 from './screens/Navigate/Navigate'
import Arrived from './screens/Arrived/Arrived'
import ManageResource from './screens/ManageResource/ManageResource'

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

export default function App() {
  const [scale, setScale] = useState(1)
  const [mobile, setMobile] = useState(true)

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
        // Desktop: show the device at natural size, only shrinking if the
        // window is shorter than the phone so it always fits.
        setScale(Math.min(1, vh / BASE_H))
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
        className={`relative overflow-hidden ${mobile ? '' : 'rounded-[44px] shadow-[0_20px_60px_rgba(0,0,0,0.6)]'}`}
        style={{
          width: BASE_W,
          height: BASE_H,
          marginTop: mobile ? -TOP_SHIFT * scale : 0,
          transform: `scale(${scale})`,
          transformOrigin: mobile ? 'top center' : 'center center',
        }}
      >
        <Routes>
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
      </div>
    </div>
  )
}
