import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import BottomTabBar from '../../components/BottomTabBar'
import DotRing from '../Home/DotRing'
import { FireIcon, LightningIcon, MenuIcon, XIcon } from '../Home/icons'
import NotificationsBell from '../../components/NotificationsBell'

type Resource = 'Power' | 'Fuel'
type ManageState = { resource?: Resource; percent?: number; remaining?: string }

// Usage breakdown shown in the "Where your resources went?" panel.
const BREAKDOWN = [
  { Icon: GeneratorGlyph, pct: 41 },
  { Icon: ApplianceGlyph, pct: 18 },
  { Icon: BulbGlyph, pct: 32 },
  { Icon: MoreGlyph, pct: 11 },
]

function GeneratorGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 12c0-3 .5-5 2.5-5S16 10 12 12c3 0 5 .5 5 2.5S14 16 12 12c0 3-.5 5-2.5 5S8 14 12 12c-3 0-5-.5-5-2.5S10 8 12 12Z" />
    </svg>
  )
}
function ApplianceGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="11" rx="1.5" />
      <path d="M2 20h20" />
    </svg>
  )
}
function BulbGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.3 1 2.5h6c0-1.2.3-1.8 1-2.5A6 6 0 0 0 12 3Z" />
    </svg>
  )
}
function MoreGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="8.5" cy="12" r="0.6" fill="currentColor" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
      <circle cx="15.5" cy="12" r="0.6" fill="currentColor" />
    </svg>
  )
}
function ChevronUpGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 15 6-6 6 6" />
    </svg>
  )
}

export default function ManageResource() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as ManageState | null) ?? {}
  const resource: Resource = state.resource ?? 'Power'
  const percent = state.percent ?? 78
  const remaining = state.remaining ?? '12H Left'
  const isPower = resource === 'Power'
  const ringColor = percent > 50 ? '#ffffff' : '#ff5f1f'

  // Fill the gauge from 0 → percent on entry with a gentle ease-out, plus a
  // short settle so it eases softly into place. The centre number counts along.
  const [ringPercent, setRingPercent] = useState(0)
  useEffect(() => {
    const DUR = 1300
    // ease-out-quint: lights quickly, then eases softly into its final value.
    const ease = (t: number) => 1 - Math.pow(1 - t, 5)
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DUR)
      setRingPercent(percent * ease(t))
      if (t < 1) raf = requestAnimationFrame(tick)
      else setRingPercent(percent)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [percent])

  return (
    <div className="w-[393px] h-[852px] relative bg-app text-textPrimary overflow-hidden select-none">
      {/* Header — same chrome / position as the other pages */}
      <div className="absolute left-[27px] top-[66px] w-[340px] h-[43px] flex items-center justify-between">
        <button type="button" className="text-textPrimary p-1 -ml-1">
          <MenuIcon />
        </button>
        <NotificationsBell />
      </div>

      {/* Main card */}
      <div className="absolute left-[19px] right-[19px] top-[128px] rounded-card bg-black/20 px-[22px] pt-[22px] pb-[22px]">
        {/* Card header: resource + remaining + close */}
        <div className="flex items-center">
          <div className="flex items-center gap-[6px] text-white/[0.85]">
            {isPower ? <LightningIcon size={26} /> : <FireIcon size={26} />}
            <span className="text-[26px] font-semibold leading-none">{resource}</span>
          </div>
          <span className="ml-[10px] text-[14px] text-textSecondary">{remaining}</span>
          <button
            type="button"
            onClick={() => navigate('/home')}
            aria-label="Close"
            className="ml-auto w-[34px] h-[34px] rounded-full bg-white/10 text-white/80 flex items-center justify-center"
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Big gauge */}
        <div className="mt-[26px] mb-[24px] flex items-center justify-center">
          <div className="anim-gauge-pop relative">
            <DotRing
              percent={ringPercent}
              size={300}
              dots={14}
              dotSize={46}
              activeColor={ringColor}
              trackColor="#2C2C2C"
            />
            <span className="absolute inset-0 flex items-center justify-center font-numeric text-[60px] font-bold text-white">
              {Math.round(ringPercent)}%
            </span>
          </div>
        </div>

        {/* Breakdown panel */}
        <div className="rounded-[20px] bg-white/[0.06] px-[18px] py-[16px]">
          <div className="flex items-center justify-between">
            <span className="text-[15px] text-white/70">Where your resources went?</span>
            <ChevronUpGlyph size={18} />
          </div>
          <div className="mt-[14px] flex items-center justify-between">
            {BREAKDOWN.map(({ Icon, pct }, i) => (
              <div key={i} className="flex items-center gap-[6px] text-white/80">
                <Icon size={20} />
                <span className="text-[15px] font-medium text-white">{pct} %</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="absolute left-[19px] right-[19px] top-[712px] flex items-center gap-[12px]">
        <button
          type="button"
          className="flex-1 h-[52px] rounded-pill bg-[rgba(78,78,78,0.5)] text-white text-[15px] font-semibold"
        >
          Check Generator
        </button>
        <button
          type="button"
          onClick={() => navigate('/send-request')}
          className="flex-1 h-[52px] rounded-pill bg-accent text-white text-[15px] font-semibold"
        >
          Request Exchange
        </button>
      </div>

      {/* Bottom tab bar */}
      <BottomTabBar active="home" />
    </div>
  )
}
