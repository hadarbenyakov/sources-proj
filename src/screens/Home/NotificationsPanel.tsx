import Avatar from '../../components/Avatar'
import {
  FireIcon,
  LightningIcon,
  MapIcon,
  MealIcon,
  SwapIcon,
  WaterDropIcon,
  XIcon,
} from './icons'
import type { AppNotification, Entry } from './exchanges'

const UNIT_SUFFIX: Record<string, string> = {
  Fuel: 'L',
  Water: 'L',
  Power: '',
  Meals: '',
}

function fmt(e: Entry): string {
  // Some amounts already carry a unit (e.g. "5L"); only append for bare numbers.
  if (/[a-zA-Z]$/.test(e.amount)) return e.amount
  return `${e.amount}${UNIT_SUFFIX[e.resource] ?? ''}`
}

function resIcon(resource: string, size: number, className: string) {
  if (resource === 'Fuel') return <FireIcon size={size} className={className} />
  if (resource === 'Power') return <LightningIcon size={size} className={className} />
  if (resource === 'Water') return <WaterDropIcon size={size} className={className} />
  return <MealIcon size={size} className={className} />
}

function ExchangeSummary({ give, get }: { give: Entry; get: Entry }) {
  return (
    <div className="mt-[12px] rounded-[14px] bg-white/[0.06] px-[14px] py-[12px] flex items-center justify-center gap-[18px]">
      <div className="flex items-center gap-[7px]">
        <span className="text-[12px] text-white/50">Give</span>
        {resIcon(give.resource, 18, 'text-white')}
        <span className="text-[22px] font-bold text-white leading-none">
          {fmt(give)}
        </span>
      </div>
      <SwapIcon size={18} className="text-white/55" />
      <div className="flex items-center gap-[7px]">
        {resIcon(get.resource, 18, 'text-accent')}
        <span className="text-[22px] font-bold text-accent leading-none">
          {fmt(get)}
        </span>
        <span className="text-[12px] text-accent/80">Get</span>
      </div>
    </div>
  )
}

export default function NotificationsPanel({
  notifications,
  closing = false,
  onClose,
  onNavigate,
}: {
  notifications: AppNotification[]
  closing?: boolean
  onClose: () => void
  onNavigate: (n: AppNotification) => void
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 z-40 bg-black/40 ${
          closing ? 'anim-screen-out' : 'anim-screen-in'
        }`}
        onClick={onClose}
        aria-hidden
      />

      {/* Side drawer — inset from the edges, rounded all around, starting at the
          notification bell's height */}
      <div
        className={`absolute right-[10px] top-[62px] bottom-[78px] z-50 w-[320px] bg-app rounded-[28px] overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.5)] flex flex-col ${
          closing ? 'anim-panel-out' : 'anim-panel-in'
        }`}
      >
        <div className="relative flex items-center justify-center px-[8px] pt-[20px] pb-[14px]">
          <span className="text-[20px] font-semibold text-white">
            Notifications
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-[8px] top-[20px] w-[34px] h-[34px] flex items-center justify-center rounded-full bg-white/10 text-white/80"
          >
            <XIcon size={16} />
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto px-[4px] pb-[20px] flex flex-col gap-[12px]"
          style={{ scrollbarWidth: 'none' }}
        >
          {notifications.length === 0 ? (
            <p className="mt-[40px] text-center text-[14px] text-white/45">
              No notifications yet
            </p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="bg-card rounded-[20px] px-[10px] py-[14px]">
                <div className="flex items-center gap-[10px]">
                  <Avatar
                    name={n.userName}
                    size={40}
                    seed={n.userSeed}
                    photo={n.userPhoto}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-white leading-tight">
                      {n.userName}
                    </p>
                    <p className="text-[13px] text-white/60 leading-tight mt-[2px]">
                      approved your exchange negotiation
                    </p>
                  </div>
                </div>

                {/* Offered exchange quantities */}
                <ExchangeSummary give={n.give} get={n.get} />

                <button
                  type="button"
                  onClick={() => onNavigate(n)}
                  className="mt-[12px] w-full h-[40px] rounded-pill bg-accent text-white text-[14px] font-semibold flex items-center justify-center gap-[7px]"
                >
                  <MapIcon size={17} />
                  Navigate
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
