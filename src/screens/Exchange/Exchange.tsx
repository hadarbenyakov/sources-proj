import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Avatar from '../../components/Avatar'
import BottomTabBar from '../../components/BottomTabBar'
import GlassLayer from '../../components/GlassLayer'
import NotificationsBell from '../../components/NotificationsBell'
import StatusPill from '../../components/StatusPill'
import {
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

// The sheet is anchored to the bottom; these are its `top` values per state.
const SHEET_CLOSED_TOP = 749
const SHEET_OPEN_TOP = 520
// Expanded (negotiation form) — raised so the swipe row clears the tab bar.
const SHEET_FORM_TOP = 250
const SHEET_TRANSITION = 'top 380ms cubic-bezier(0.34, 1.56, 0.64, 1)'

function ResourceIcon({ r, size = 22, className }: { r: Resource; size?: number; className?: string }) {
  if (r === 'Fuel') return <FireIcon size={size} className={className} />
  if (r === 'Power') return <LightningIcon size={size} className={className} />
  if (r === 'Water') return <WaterDropIcon size={size} className={className} />
  return <MealIcon size={size} className={className} />
}

const UNIT_LABEL: Record<Resource, string> = {
  Fuel: 'L',
  Water: 'L',
  Power: 'KWh',
  Meals: 'pcs',
}

// Split a quantity into number + unit (uses the amount's own unit when present).
function splitAmount(resource: Resource, amount: string): { num: string; unit: string } {
  const m = amount.match(/^([\d.]+)\s*([a-zA-Z]*)$/)
  const num = m ? m[1] : amount
  const unit = m && m[2] ? m[2] : UNIT_LABEL[resource]
  return { num, unit }
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
      <div className="flex items-end gap-[4px] mt-[6px]">
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
          {splitAmount(user.resource, user.amount).num}
        </span>
        <span
          className={`text-[12px] font-normal leading-none mb-[1px] ${
            isAccent ? 'text-white/90' : 'text-black/70'
          }`}
        >
          {splitAmount(user.resource, user.amount).unit}
        </span>
      </div>
    </div>
  )
}

// Header (avatar + name + description) is laid out identically to the
// NegotiateForm header so the crossfade keeps the avatar exactly in place.
function DrawerHeader({ user }: { user: ExchangeUser }) {
  return (
    <div className="flex items-center gap-[9px] p-[16px]">
      <Avatar name={user.name} size={44} seed={user.id} photo={user.photo} />
      <div className="flex flex-col gap-[2px] font-inter">
        <span className="text-[16px] font-medium text-black leading-none">
          {user.fullName}
        </span>
        <span className="text-[12px] text-[#595959] leading-[1.4]">
          From my solar stepup. Transfer before {user.availableUntil}
        </span>
      </div>
    </div>
  )
}

function SelectedUserDrawer({ user }: { user: ExchangeUser }) {
  return (
    <div className="absolute left-[19px] top-[52px] w-[347px] bg-[#dfdfdf] rounded-[32px] flex flex-col">
      <DrawerHeader user={user} />

      {!user.gives || !user.wants ? (
        <div className="flex flex-col items-center gap-[4px] px-[20px] pb-[28px] pt-[8px]">
          <span className="text-[14px] font-semibold text-black/60">No active requests</span>
          <span className="text-[12px] text-black/40">Check back later</span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-[7px] px-[20px] pb-[24px] pt-[4px]">
          <OfferChip label="Get" user={user.wants} variant="plain" />
          <SwapIcon size={20} className="text-black shrink-0" />
          <OfferChip label="Gives" user={user.gives} variant="accent" />
        </div>
      )}
    </div>
  )
}

type SortMode = 'distance' | 'exchanges' | null

export default function Exchange() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('friends')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>(null)
  const [activeOnly, setActiveOnly] = useState(false)
  // Drawer states: peek (user info + chips) → expanded (the negotiation form).
  // The form is the same page — just the drawer grown to full height.
  const [expanded, setExpanded] = useState(false)

  const pool = tab === 'friends' ? FRIENDS : NEIGHBORS

  const users = (() => {
    let list = query
      ? pool.filter((u) => u.name.toLowerCase().includes(query.toLowerCase()))
      : [...pool]
    if (activeOnly) list = list.filter((u) => u.online)
    if (sortMode === 'distance') list = [...list].sort((a, b) => a.distanceMeters - b.distanceMeters)
    if (sortMode === 'exchanges') list = [...list].sort((a, b) => b.exchangeCount - a.exchangeCount)
    return list
  })()

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

  // Drag on the selected drawer: it follows the finger live, then snaps —
  // peek → up expands to the form / down closes; form → down collapses to peek.
  const dragRef = useRef<{ startY: number; id: string } | null>(null)
  const [dragY, setDragY] = useState(0) // live offset, up = negative
  const [dragging, setDragging] = useState(false)
  function onDrawerPointerDown(e: React.PointerEvent) {
    if (!selectedId) return
    dragRef.current = { startY: e.clientY, id: selectedId }
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    setDragging(true)
  }
  function onDrawerPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return
    setDragY(e.clientY - dragRef.current.startY)
  }
  function onDrawerPointerUp(e: React.PointerEvent) {
    const s = dragRef.current
    dragRef.current = null
    setDragging(false)
    setDragY(0)
    if (!s) return
    const dy = s.startY - e.clientY // up = positive
    const isTap = Math.abs(dy) < 10
    const canExpand = selected?.gives != null
    if (!expanded) {
      // Tap or swipe-up both expand the drawer to full (form) size.
      if ((dy > 50 || isTap) && canExpand) setExpanded(true)
      else if (dy < -50) setSelectedId(null)
    } else if (dy < -50 || isTap) {
      // Tap on the handle or swipe-down collapses back to the peek drawer.
      setExpanded(false)
    }
  }

  // Live sheet position + a 0→1 progress between peek (open) and full form,
  // used to crossfade the peek content out and the form content in.
  const baseTop = expanded
    ? SHEET_FORM_TOP
    : selected
      ? SHEET_OPEN_TOP
      : SHEET_CLOSED_TOP
  const sheetTop = Math.min(
    SHEET_CLOSED_TOP,
    Math.max(SHEET_FORM_TOP, baseTop + (dragging && selected ? dragY : 0)),
  )
  const formProgress = Math.min(
    1,
    Math.max(0, (SHEET_OPEN_TOP - sheetTop) / (SHEET_OPEN_TOP - SHEET_FORM_TOP)),
  )
  const opacityT = dragging ? 'none' : 'opacity 240ms ease'

  return (
    <div className="w-[393px] h-[852px] relative bg-app text-textPrimary overflow-hidden select-none">
      {/* Header */}
      <div className="absolute left-[27px] top-[66px] w-[340px] h-[43px] flex items-center justify-between">
        <button type="button" className="text-textPrimary p-1 -ml-1">
          <MenuIcon />
        </button>
        <StatusPill />
        <NotificationsBell />
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
      <div className="absolute left-[19px] right-[19px] top-[195px] rounded-[30px] overflow-hidden flex items-center p-[10px] gap-[10px]">
        <GlassLayer radius={30} />
        <SearchIcon size={24} className="text-[#8a8a8a] relative" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className="relative flex-1 bg-transparent outline-none font-inter text-[13px] text-white placeholder:text-[#8a8a8a]"
        />
      </div>

      {/* Sort / filter chips */}
      <div className="absolute left-[19px] right-[19px] top-[251px] flex items-center gap-[8px]">
        {(
          [
            { id: 'distance', label: 'Distance' },
            { id: 'exchanges', label: 'Most Exchanged' },
          ] as { id: SortMode & string; label: string }[]
        ).map(({ id, label }) => {
          const active = sortMode === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSortMode(active ? null : id)}
              className={`px-[12px] py-[6px] rounded-[30px] text-[12px] font-semibold transition-colors ${
                active ? 'bg-accent text-white' : 'bg-[#323232] text-white/70'
              }`}
            >
              {label}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setActiveOnly((v) => !v)}
          className={`px-[12px] py-[6px] rounded-[30px] text-[12px] font-semibold transition-colors ${
            activeOnly ? 'bg-accent text-white' : 'bg-[#323232] text-white/70'
          }`}
        >
          Active Only
        </button>
      </div>

      {/* Avatar grid */}
      <div
        className="absolute left-[32px] right-[39px] top-[302px] bottom-0 overflow-y-auto px-[4px] pt-[4px] pb-[280px]"
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
        className="absolute left-[5px] right-[5px] bottom-0 bg-sheet rounded-t-[40px] shadow-[0_-4px_20px_rgba(0,0,0,0.18)]"
        style={{
          // Anchored to the bottom; only `top` changes, so the sheet stretches
          // smoothly between peek and form without ever detaching from the base.
          top: sheetTop,
          transition: dragging ? 'none' : SHEET_TRANSITION,
        }}
      >
        {/* Drag handle / capture area for swipe-up gesture (only active when selected) */}
        <div
          className="absolute left-0 right-0 top-0 h-[40px] cursor-grab z-20"
          style={{ touchAction: 'pan-y' }}
          onPointerDown={onDrawerPointerDown}
          onPointerMove={onDrawerPointerMove}
          onPointerUp={onDrawerPointerUp}
          onPointerCancel={onDrawerPointerUp}
        >
          <div className="absolute left-1/2 -translate-x-1/2 top-[20px] w-[51px] h-[4px] rounded-full bg-black/20" />
        </div>

        {selected && (
          <>
            {/* Peek content — fades out as the sheet grows toward the form */}
            <div
              className="absolute inset-0 cursor-pointer"
              style={{
                touchAction: 'pan-y',
                opacity: 1 - formProgress,
                transition: opacityT,
                pointerEvents: formProgress > 0.5 ? 'none' : 'auto',
              }}
              onPointerDown={onDrawerPointerDown}
              onPointerMove={onDrawerPointerMove}
              onPointerUp={onDrawerPointerUp}
              onPointerCancel={onDrawerPointerUp}
            >
              <SelectedUserDrawer user={selected} />
            </div>

            {/* Form content — fades in as the sheet grows */}
            <div
              className="absolute inset-0"
              style={{
                opacity: formProgress,
                transition: opacityT,
                pointerEvents: formProgress > 0.5 ? 'auto' : 'none',
              }}
            >
              <NegotiateForm
                key={selected.id}
                user={selected}
                onClose={() => setExpanded(false)}
                onSend={sendNegotiation}
              />
            </div>
          </>
        )}
      </div>

      {/* Bottom tab bar */}
      <BottomTabBar active="swap" />
    </div>
  )
}
