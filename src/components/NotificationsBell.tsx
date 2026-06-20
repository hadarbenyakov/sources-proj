import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { BellIcon } from '../screens/Home/icons'
import NotificationsPanel from '../screens/Home/NotificationsPanel'
import {
  loadNotifications,
  markNotificationsRead,
  type AppNotification,
} from '../screens/Home/exchanges'

/**
 * Bell button + notifications side panel, usable in any page header. The panel
 * is portaled into the app frame so it spans the whole page regardless of where
 * the bell sits in the header. The unread dot reflects stored notifications, so
 * the indicator shows up consistently across every screen.
 */
export default function NotificationsBell() {
  const navigate = useNavigate()
  const [notifs, setNotifs] = useState(loadNotifications)
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const hasUnread = notifs.some((n) => !n.read)

  function openPanel() {
    setOpen(true)
    setClosing(false)
    markNotificationsRead()
    setNotifs(loadNotifications())
  }

  // Play the exit animation, then unmount.
  function closePanel() {
    setClosing(true)
    setTimeout(() => {
      setOpen(false)
      setClosing(false)
    }, 220)
  }

  function startNavigation(n: AppNotification) {
    // Hand the target to the map via one-shot router state (not persisted), so
    // only this action pre-selects the person — plain map visits stay neutral.
    navigate('/map', {
      state: {
        navTarget: {
          userName: n.userName,
          userSeed: n.userSeed,
          userPhoto: n.userPhoto,
          give: n.give,
          get: n.get,
        },
      },
    })
  }

  const frame = typeof document !== 'undefined'
    ? document.getElementById('app-frame')
    : null

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        aria-label="Notifications"
        className="relative text-textPrimary p-1 -mr-1"
      >
        <BellIcon size={26} />
        {hasUnread && (
          <span className="absolute top-[2px] right-[2px] w-[10px] h-[10px] rounded-full bg-accent border-2 border-app" />
        )}
      </button>
      {open &&
        frame &&
        createPortal(
          <NotificationsPanel
            notifications={notifs}
            closing={closing}
            onClose={closePanel}
            onNavigate={startNavigation}
          />,
          frame,
        )}
    </>
  )
}
