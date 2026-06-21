import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './screens/Home/Home'
import SendRequest from './screens/SendRequest/SendRequest'
import RequestSent from './screens/RequestSent/RequestSent'
import Exchange from './screens/Exchange/Exchange'
import Navigate2 from './screens/Navigate/Navigate'
import Arrived from './screens/Arrived/Arrived'

export default function App() {
  return (
    <div className="min-h-screen w-full bg-white flex justify-center">
      <div id="app-frame" className="w-[393px] min-h-[852px] relative overflow-hidden">
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
