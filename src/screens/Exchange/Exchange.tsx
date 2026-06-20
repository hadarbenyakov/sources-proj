import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Avatar from '../../components/Avatar'
import BottomTabBar from '../../components/BottomTabBar'
import StatusPill from '../../components/StatusPill'
import {
  BellIcon,
  FireIcon,
  LightningIcon,
  MealIcon,
  MenuIcon,
  SearchIcon,
  SwapIcon,
  WaterDropIcon,
} from '../Home/icons'
import { FRIENDS, NEIGHBORS, type ExchangeUser, type Resource } from './data'
import NegotiateForm, { type SendPayload } from './NegotiateForm'
import { addNegotiation, addNotification } from '../Home/exchanges'

type Tab = 'friends' | 'neighbors'

const SHEET_CLOSED_TOP = 749
const SHEET_OPEN_TOP = 564
const SHEET_CLOSED_HEIGHT = 103
const SHEET_OPEN_HEIGHT = 288
// Expanded (negotiation form) — raised so the swipe row clears the tab bar.
const SHEET_FORM_TOP = 250
const SHEET_FORM_HEIGHT = 595
const SHEET_TRANSITION = 'top 280ms cubic-bezier(.22,.61,.36,1), height 280ms cubic-bezier(.22,.61,.36,1)'

function ResourceIcon({ r, size = 22, className }: { r: Resource; size?: number; className?: string }) {
  if (r === 'Fuel') return <FireIcon size={size} className={className} />
  if (r === 'Power') return <LightningIcon size={size} className={className} />
  if (r === 'Water') return <WaterDropIcon size={size} className={className} />
  return <MealIcon size={size} className={className} />
}

function OfferChip({
  label,
  user,
  variant,
}: {
  label: string
  user: { resource: Resource; amount: string }
  variant: 'plain' | 'accent'
}) {
  const isAccent = variant === 'accent'
  return (
    <div
      className={`w-[130px] h-[59px] rounded-[14px] flex flex-col items-center justify-center ${
        isAccent ? 'bg-accent' : 'bg-black/[0.12]'
      }`}
    >
      <span
        className={`text-[13px] font-medium leading-none ${
          isAccent ? 'text-white' : 'text-black/70'
        }`}
      >
        {label}
      </span>
      <div className="flex items-center gap-[4px] mt-[6px]">
        <ResourceIcon
          r={user.resource}
          size={22}
          className={isAccent ? 'text-white' : 'text-black'}
        />
        <span
          className={`text-[22px] font-bold leading-none ${
            isAccent ? 'text-white' : 'text-black'
          }`}
        >
          {user.amount}
        </span>
      </div>
    </div>
  )
}

function SelectedUserDrawer({ user }: { user: ExchangeUser }) {
  if (!user.gives || !user.wants) {
    return (
      <>
        <div className="absolute left-[18px] right-[18px] top-[38px] h-[134px] bg-[#dcdcdc] rounded-[27px]" />
        <div className="absolute left-[34px] right-[20px] top-[46px] flex items-center gap-[9px]">
          <Avatar name={user.name} size={36} seed={user.id} photo={user.photo} />
          <span className="text-[16px] font-semibold text-black leading-tight">
            {user.fullName}
          </span>
        </div>
        <div className="absolute left-0 right-0 top-[100px] flex flex-col items-center gap-[4px]">
          <span className="text-[14px] font-semibold text-black/60">No active requests</span>
          <span className="text-[12px] text-black/40">Check back later</span>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Inner gray frame (wraps the header + chips) */}
      <div className="absolute left-[18px] right-[18px] top-[38px] h-[134px] bg-[#dcdcdc] rounded-[27px]" />

      {/* Header: avatar + name / description (tight pair, aligned to avatar) */}
      <div className="absolute left-[34px] right-[20px] top-[46px] flex items-center gap-[9px]">
        <Avatar name={user.name} size={36} seed={user.id} photo={user.photo} />
        <div className="flex flex-col gap-[1px]">
          <span className="text-[16px] font-semibold text-black leading-tight">
            {user.fullName}
          </span>
          <span className="text-[13px] text-black/55 leading-tight">
            From my solar stepup. Transfer before {user.availableUntil}
          </span>
        </div>
      </div>

      {/* Exchange chips row */}
      <div className="absolute left-[39px] right-[39px] top-[100px] h-[59px] flex items-center justify-between">
        <OfferChip label="Get" user={user.wants} variant="plain" />
        <SwapIcon size={20} className="text-black" />
        <OfferChip label="Gives" user={user.gives} variant="accent" />
      </div>
    </>
  )
}

export default function Exchange() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('friends')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // Drawer states: peek (user info + chips) → expanded (the negotiation form).
  // The form is the same page — just the drawer grown to full height.
  const [expanded, setExpanded] = useState(false)

  const pool = tab === 'friends' ? FRIENDS : NEIGHBORS
  const users = query
    ? pool.filter((u) => u.name.toLowerCase().includes(query.toLowerCase()))
    : pool
  const selected = selectedId ? pool.find((u) => u.id === selectedId) ?? null : null

  function onAvatarClick(u: ExchangeUser) {
    setExpanded(false)
    setSelectedId((prev) => (prev === u.id ? null : u.id))
  }

  function sendNegotiation(payload: SendPayload) {
    if (selected) {
      const meta = {
        userName: selected.fullName,
        userPhoto: selected.photo,
        userSeed: selected.id,
        give: payload.give,
        get: payload.get,
      }
      addNegotiation(meta)
      // Simulate the offer being approved → notification with a Navigate CTA.
      addNotification(meta)
    }
    navigate('/request-sent', { state: payload })
  }

  // Drag on the selected drawer: peek → up expands to the form / down closes;
  // form → down collapses back to peek.
  const dragRef = useRef<{ startY: number; id: string } | null>(null)
  function onDrawerPointerDown(e: React.PointerEvent) {
    if (!selectedId) return
    dragRef.current = { startY: e.clientY, id: selectedId }
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  }
  function onDrawerPointerUp(e: React.PointerEvent) {
    const s = dragRef.current
    dragRef.current = null
    if (!s) return
    const dy = s.startY - e.clientY // up = positive
    const canExpand = selected?.gives != null
    if (!expanded) {
      if (dy > 50 && canExpand) setExpanded(true)
      else if (dy < -50) setSelectedId(null)
    } else if (dy < -50) {
      setExpanded(false)
    }
  }

  return (
    <div className="w-[393px] h-[852px] relative bg-app text-textPrimary overflow-hidden select-none">
      {/* Header */}
      <div className="absolute left-[27px] top-[66px] w-[340px] h-[43px] flex items-center justify-between">
        <button type="button" className="text-textPrimary p-1 -ml-1">
          <MenuIcon />
        </button>
        <StatusPill power={78} fuel={19} />
        <button type="button" className="text-textPrimary p-1 -mr-1">
          <BellIcon size={26} />
        </button>
      </div>

      {/* Title + Friends/Neighbors toggle, vertically centered on one row */}
      <div className="absolute left-[26px] right-[24px] top-[139px] flex items-center justify-between">
        <h1 className="text-[27px] font-semibold text-white leading-none">
          Exchange
        </h1>

        <div className="flex items-center gap-[4px] p-[2px] rounded-[30px] bg-[#323232]">
        {(['friends', 'neighbors'] as const).map((t) => {
          const isSel = tab === t
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-[6px] py-[4px] rounded-[30px] text-[12px] font-semibold text-white ${
                isSel ? 'bg-[#5b5b5b]' : ''
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          )
        })}
        </div>
      </div>

      {/* Search */}
      <div className="absolute left-[19px] right-[19px] top-[195px] rounded-[30px] bg-[#323232] flex items-center p-[10px] gap-[10px]">
        <SearchIcon size={24} className="text-[#595959]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className="flex-1 bg-transparent outline-none font-inter text-[13px] text-white placeholder:text-[#595959]"
        />
      </div>

      {/* Avatar grid */}
      <div
        className="absolute left-[32px] right-[39px] top-[266px] bottom-0 overflow-y-auto px-[4px] pt-[4px] pb-[280px]"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="grid grid-cols-3 gap-x-[61px] gap-y-[46px]">
          {users.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => onAvatarClick(u)}
              className="w-[64px] flex flex-col items-center"
            >
              <Avatar
                name={u.name}
                online={u.online}
                seed={u.id}
                selected={selectedId === u.id}
                photo={u.photo}
              />
              <div className="mt-[12px] text-center">
                <div className="text-[14px] font-medium text-white leading-tight">
                  {u.name}
                </div>
                <div className="text-[12px] text-textSecondary leading-tight mt-[2px]">
                  {u.distance}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom sheet — list peek → selected peek → expanded negotiation form,
          all on this same page (the form just grows the drawer to full height). */}
      <div
        className="absolute left-[5px] right-[5px] bg-sheet rounded-t-[40px] shadow-[0_-4px_20px_rgba(0,0,0,0.18)]"
        style={{
          top: expanded
            ? SHEET_FORM_TOP
            : selected
              ? SHEET_OPEN_TOP
              : SHEET_CLOSED_TOP,
          height: expanded
            ? SHEET_FORM_HEIGHT
            : selected
              ? SHEET_OPEN_HEIGHT
              : SHEET_CLOSED_HEIGHT,
          transition: SHEET_TRANSITION,
        }}
      >
        {/* Drag handle / capture area for swipe-up gesture (only active when selected) */}
        <div
          className="absolute left-0 right-0 top-0 h-[40px] cursor-grab"
          style={{ touchAction: 'pan-y' }}
          onPointerDown={onDrawerPointerDown}
          onPointerUp={onDrawerPointerUp}
          onPointerCancel={onDrawerPointerUp}
        >
          <div className="absolute left-1/2 -translate-x-1/2 top-[20px] w-[51px] h-[4px] rounded-full bg-black/20" />
        </div>
        {selected && !expanded && <SelectedUserDrawer user={selected} />}
        {selected && expanded && (
          <NegotiateForm
            key={selected.id}
            user={selected}
            onClose={() => setExpanded(false)}
            onSend={sendNegotiation}
          />
        )}
      </div>

      {/* Bottom tab bar */}
      <BottomTabBar active="swap" />
    </div>
  )
}
