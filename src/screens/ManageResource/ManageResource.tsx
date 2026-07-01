import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import DotRing from '../Home/DotRing'
import { FireIcon, LightningIcon, MenuIcon, XIcon } from '../Home/icons'
import NotificationsBell from '../../components/NotificationsBell'

type Resource = 'Power' | 'Fuel'
type ManageState = { resource?: Resource; percent?: number; remaining?: string }

// Full capacity + unit per resource, so the gauge can show absolute amount too.
const CAPACITY: Record<Resource, number> = { Power: 40, Fuel: 50 }
const UNIT: Record<Resource, string> = { Power: 'kWh', Fuel: 'L' }

// Where each resource went — different categories per resource.
const POWER_BREAKDOWN = [
  { Icon: ApplianceGlyph, label: 'Appliances', pct: 38 },
  { Icon: LampGlyph, label: 'Lighting', pct: 27 },
  { Icon: PhoneGlyph, label: 'Electronics', pct: 21 },
  { Icon: MoreGlyph, label: 'Other', pct: 14 },
]
const FUEL_BREAKDOWN = [
  { Icon: FireFillGlyph, label: 'Generator', pct: 44 },
  { Icon: CarGlyph, label: 'Vehicle', pct: 26 },
  { Icon: CookGlyph, label: 'Cooking', pct: 18 },
  { Icon: MoreGlyph, label: 'Other', pct: 12 },
]

// Filled icons matching the app's icon language (solid shapes, currentColor).
function FireFillGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.3027 9.32205C13.7762 9.32223 14.9707 10.5175 14.9707 11.991C14.9706 13.117 14.2717 14.0769 13.2852 14.4685V24.0008H11.2852V14.4568C10.3165 14.0568 9.63392 13.1041 9.63379 11.991C9.63379 10.5174 10.8291 9.32205 12.3027 9.32205ZM12.2383 0.0163898C12.2801 -0.00539927 12.3175 -0.00552716 12.3594 0.0163898C13.1603 0.436133 21.5976 5.03879 21.5977 12.6697C21.5975 16.4829 18.9612 19.7188 15.2979 20.8836V16.406C16.6935 15.4436 17.6103 13.8295 17.6104 11.9998C17.6102 9.05042 15.2311 6.6592 12.2969 6.65897C9.36243 6.65897 6.98358 9.05028 6.9834 11.9998C6.98347 13.831 7.90035 15.4468 9.29785 16.409V20.8836C5.63542 19.7183 3.00019 16.4824 3 12.6697C3.00006 5.03879 11.4373 0.436131 12.2383 0.0163898Z" />
    </svg>
  )
}
function LampGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 25" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M20.4248 8.71289C20.4248 3.90119 16.5246 0.00017884 11.7129 0C6.90108 0 3 3.90108 3 8.71289C3.00011 11.6617 4.46513 14.2683 6.70702 15.8447L6.70704 15.8447C6.9845 16.0398 7.12324 16.1373 7.21048 16.2445C7.29772 16.3516 7.35041 16.4733 7.45581 16.7166C7.61988 17.0954 7.76949 17.4798 7.90437 17.869C10.3851 18.6241 13.039 18.6242 15.5197 17.8692C15.6545 17.48 15.804 17.0956 15.968 16.7168L15.968 16.7167C16.0734 16.4734 16.1261 16.3517 16.2133 16.2445C16.3006 16.1373 16.4394 16.0398 16.717 15.8447C18.9593 14.2684 20.4247 11.662 20.4248 8.71289ZM14.9214 20.0905C12.8077 20.5508 10.6174 20.5508 8.50368 20.0906C8.62686 20.7198 8.71323 21.3568 8.76186 21.9985C8.8102 22.6364 8.83438 22.9554 8.98142 23.1744C9.12847 23.3933 9.39359 23.5259 9.92383 23.791C11.0498 24.354 12.3749 24.3539 13.501 23.791L13.501 23.791C14.0318 23.5258 14.2972 23.3933 14.4443 23.1742C14.5915 22.9551 14.6156 22.6361 14.6638 21.998C14.7123 21.3565 14.7985 20.7196 14.9214 20.0905Z" />
    </svg>
  )
}
function ApplianceGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="4.5" width="18" height="12.5" rx="2.5" />
      <rect x="8" y="19" width="8" height="1.8" rx="0.9" />
    </svg>
  )
}
function MoreGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="3" width="7.5" height="7.5" rx="2.2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2.2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2.2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2.2" />
    </svg>
  )
}
function PhoneGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <rect x="6.5" y="2" width="11" height="20" rx="2.8" />
    </svg>
  )
}
function CarGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 14 L6.2 9.4 A1.9 1.9 0 0 1 8 8 H16 A1.9 1.9 0 0 1 17.8 9.4 L19 14 H20 A1 1 0 0 1 21 15 V17 H3 V15 A1 1 0 0 1 4 14 Z" />
      <circle cx="7.5" cy="17.5" r="1.7" />
      <circle cx="16.5" cy="17.5" r="1.7" />
    </svg>
  )
}
function CookGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <rect x="9" y="5" width="6" height="2" rx="1" />
      <path d="M4 10 H20 V14.5 A3.5 3.5 0 0 1 16.5 18 H7.5 A3.5 3.5 0 0 1 4 14.5 Z" />
      <rect x="1.5" y="10.5" width="3" height="2" rx="1" />
      <rect x="19.5" y="10.5" width="3" height="2" rx="1" />
    </svg>
  )
}
function ChevronGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
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
  const breakdown = isPower ? POWER_BREAKDOWN : FUEL_BREAKDOWN
  const maxPct = Math.max(...breakdown.map((b) => b.pct))
  const capacity = CAPACITY[resource]
  const unit = UNIT[resource]

  // "Where your resources went?" breakdown starts collapsed.
  const [breakdownOpen, setBreakdownOpen] = useState(false)

  const [ringPercent, setRingPercent] = useState(0)
  useEffect(() => {
    const DUR = 1300
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
      {/* Header */}
      <div className="absolute left-[27px] top-[66px] w-[340px] h-[43px] flex items-center justify-between">
        <button type="button" className="text-textPrimary p-1 -ml-1">
          <MenuIcon />
        </button>
        <NotificationsBell />
      </div>

      {/* Main card */}
      <div className="absolute left-[19px] right-[19px] top-[128px] rounded-card bg-black/20 px-[22px] pt-[22px] pb-[22px]">
        {/* Card header */}
        <div className="flex items-center">
          <div className="flex items-baseline gap-[6px] text-white/[0.85]">
            <span className="self-center flex">
              {isPower ? <LightningIcon size={26} /> : <FireIcon size={26} />}
            </span>
            <span className="text-[26px] font-semibold leading-none">{resource}</span>
            <span className="ml-[6px] text-[18px] font-medium text-textSecondary">{remaining}</span>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Close"
            className="ml-auto w-[34px] h-[34px] rounded-full bg-white/10 text-white/80 flex items-center justify-center"
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Gauge — smaller, all circles (filled + dark-gray idle, like Home) */}
        <div className="mt-[22px] mb-[22px] flex items-center justify-center">
          <div className="relative">
            <DotRing
              percent={ringPercent}
              size={220}
              dots={14}
              dotSize={32}
              activeColor={ringColor}
              idleColor="#333333"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-numeric text-[46px] font-bold text-white leading-none">
                {Math.round(ringPercent)}%
              </span>
              <span className="text-[13px] font-medium text-white/45 mt-[8px]">
                {Math.round((ringPercent / 100) * capacity)} / {capacity} {unit}
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown panel — collapsible accordion. When open the list scrolls
            flush to this panel's rounded bottom (no bottom padding + clip). */}
        <div
          className={`rounded-[20px] bg-white/[0.06] px-[18px] pt-[16px] overflow-hidden ${
            breakdownOpen ? 'pb-0' : 'pb-[16px]'
          }`}
        >
          <button
            type="button"
            onClick={() => setBreakdownOpen((v) => !v)}
            className="w-full flex items-center justify-between text-left"
          >
            <span className="text-[18px] font-semibold text-white/70">
              Where your {resource.toLowerCase()} went?
            </span>
            <span
              className="text-white/70"
              style={{
                transform: breakdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 300ms cubic-bezier(0.22, 0.61, 0.36, 1)',
              }}
            >
              <ChevronGlyph size={18} />
            </span>
          </button>

          {/* Expanding list — icon tile · name + usage bar · chevron.
              Capped height with scroll so it never overlaps the buttons. */}
          <div
            style={{
              display: 'grid',
              gridTemplateRows: breakdownOpen ? '1fr' : '0fr',
              transition: 'grid-template-rows 320ms cubic-bezier(0.22, 0.61, 0.36, 1)',
            }}
          >
            <div className="overflow-hidden">
              <div
                className="mt-[6px] max-h-[172px] overflow-y-auto pb-[14px]"
                style={{ scrollbarWidth: 'none' }}
              >
                {breakdown.map(({ Icon, label, pct }, i) => (
                  <div key={label}>
                    <div className="flex items-center gap-[12px] py-[11px]">
                      <div className="w-[40px] h-[40px] rounded-[10px] bg-white/[0.08] flex items-center justify-center text-white/85 shrink-0">
                        <Icon size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[16px] font-medium text-white leading-tight">
                          {label}
                        </div>
                        <div className="flex items-center gap-[8px] mt-[6px]">
                          <div
                            className="h-[5px] rounded-full bg-white/40"
                            style={{ width: `${(pct / maxPct) * 70}%` }}
                          />
                          <span className="text-[12px] text-white/45">{pct}%</span>
                        </div>
                      </div>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="text-white/30 shrink-0"
                      >
                        <path
                          d="m9 6 6 6-6 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    {i < breakdown.length - 1 && (
                      <div className="ml-[52px] h-px bg-white/[0.08]" />
                    )}
                  </div>
                ))}
              </div>
            </div>
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
          className="flex-1 h-[52px] rounded-pill bg-white text-black text-[15px] font-semibold"
        >
          Request Exchange
        </button>
      </div>
    </div>
  )
}
