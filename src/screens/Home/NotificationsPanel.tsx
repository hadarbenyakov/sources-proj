import Avatar from '../../components/Avatar'
import { MapIcon, XIcon } from './icons'
import type { AppNotification } from './exchanges'

export default function NotificationsPanel({
  notifications,
  onClose,
  onNavigate,
}: {
  notifications: AppNotification[]
  onClose: () => void
  onNavigate: (n: AppNotification) => void
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden
      />

      {/* Side drawer (top-right, sized to content, rounded bottom corners) */}
      <div className="absolute right-0 top-0 z-50 w-[322px] bg-app rounded-b-[32px] overflow-hidden shadow-[-8px_8px_28px_rgba(0,0,0,0.45)] flex flex-col">
        <div className="flex items-center justify-between px-[20px] pt-[64px] pb-[14px]">
          <span className="text-[20px] font-semibold text-white">
            Notifications
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-[34px] h-[34px] flex items-center justify-center rounded-full bg-white/10 text-white/80"
          >
            <XIcon size={16} />
          </button>
        </div>

        <div
          className="max-h-[340px] overflow-y-auto px-[16px] pb-[20px] flex flex-col gap-[12px]"
          style={{ scrollbarWidth: 'none' }}
        >
          {notifications.length === 0 ? (
            <p className="mt-[40px] text-center text-[14px] text-white/45">
              No notifications yet
            </p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="bg-card rounded-[20px] p-[16px]">
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
