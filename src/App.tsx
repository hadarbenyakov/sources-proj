import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './screens/Home/Home'
import SendRequest from './screens/SendRequest/SendRequest'
import RequestSent from './screens/RequestSent/RequestSent'
import Exchange from './screens/Exchange/Exchange'
import Navigate2 from './screens/Navigate/Navigate'
import Arrived from './screens/Arrived/Arrived'

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

export default function App() {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    function fit() {
      const vw = window.innerWidth
      const vh = window.innerHeight
      // Fill the screen width for a zoomed, edge-to-edge fit (no side bars).
      // vh is kept available for future tuning if bottom cropping matters.
      void vh
      setScale(vw / BASE_W)
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
    <div className="fixed inset-0 bg-app flex items-start justify-center overflow-hidden">
      <div
        id="app-frame"
        className="relative overflow-hidden"
        style={{
          width: BASE_W,
          height: BASE_H,
          marginTop: -TOP_SHIFT * scale,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
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
        </Routes>
      </div>
    </div>
  )
}
