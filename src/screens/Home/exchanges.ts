import { loadJSON, saveJSON } from '../../lib/storage'

export type Resource = 'Fuel' | 'Power' | 'Water' | 'Meals'
export type Entry = { resource: Resource; amount: string }
export type MyExchange = {
  id: string
  give: Entry
  get: Entry
  status: 'Pending'
}

export type Negotiation = {
  id: string
  userName: string
  userPhoto: string
  userSeed: string
  give: Entry
  get: Entry
  status: 'Pending'
}

const KEY = 'myExchanges'
const NKEY = 'myNegotiations'

export function loadExchanges(): MyExchange[] {
  return loadJSON<MyExchange[]>(KEY, [])
}

/** Append a newly-submitted exchange offer (newest first). */
export function addExchange(give: Entry, get: Entry): void {
  const item: MyExchange = { id: `ex-${Date.now()}`, give, get, status: 'Pending' }
  saveJSON(KEY, [item, ...loadExchanges()])
}

export function loadNegotiations(): Negotiation[] {
  return loadJSON<Negotiation[]>(NKEY, [])
}

/** Append a negotiation sent to another user from the Exchange page. */
export function addNegotiation(n: Omit<Negotiation, 'id' | 'status'>): void {
  const item: Negotiation = { ...n, id: `ng-${Date.now()}`, status: 'Pending' }
  saveJSON(NKEY, [item, ...loadNegotiations()])
}

// ── Notifications + active navigation target ───────────────────────────────

export type AppNotification = {
  id: string
  userName: string
  userSeed: string
  userPhoto: string
  give: Entry
  get: Entry
  read: boolean
}

export type ActiveNavigation = {
  userName: string
  userSeed: string
  userPhoto: string
  give: Entry
  get: Entry
}

const NOTIF_KEY = 'myNotifications'
const NAV_KEY = 'activeNavigation'

export function loadNotifications(): AppNotification[] {
  return loadJSON<AppNotification[]>(NOTIF_KEY, [])
}

export function addNotification(n: Omit<AppNotification, 'id' | 'read'>): void {
  const item: AppNotification = { ...n, id: `nt-${Date.now()}`, read: false }
  saveJSON(NOTIF_KEY, [item, ...loadNotifications()])
}

export function markNotificationsRead(): void {
  saveJSON(
    NOTIF_KEY,
    loadNotifications().map((n) => ({ ...n, read: true })),
  )
}

export function setActiveNavigation(nav: ActiveNavigation): void {
  saveJSON(NAV_KEY, nav)
}

export function loadActiveNavigation(): ActiveNavigation | null {
  return loadJSON<ActiveNavigation | null>(NAV_KEY, null)
}
