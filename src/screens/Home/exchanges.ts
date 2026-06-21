import { loadJSON, saveJSON } from '../../lib/storage'

export type Resource = 'Fuel' | 'Power' | 'Water' | 'Meals'
export type Entry = { resource: Resource; amount: string }
export type MyExchange = {
  id: string
  give: Entry
  get: Entry
  description?: string
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

export function updateExchange(id: string, give: Entry, get: Entry, description?: string): void {
  saveJSON(KEY, loadExchanges().map((ex) => ex.id === id ? { ...ex, give, get, description } : ex))
}

export function deleteExchange(id: string): void {
  saveJSON(KEY, loadExchanges().filter((ex) => ex.id !== id))
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

// ── Core resource levels (Power / Fuel %) ──────────────────────────────────
// Persisted so completing an exchange raises the gauges shown on Home and in
// the header status pill across the app.

export type ResourceLevels = { power: number; fuel: number }

const LEVELS_KEY = 'resourceLevels'
const DEFAULT_LEVELS: ResourceLevels = { power: 78, fuel: 19 }

export function loadResourceLevels(): ResourceLevels {
  return loadJSON<ResourceLevels>(LEVELS_KEY, DEFAULT_LEVELS)
}

// How much each received unit raises the matching gauge (percentage points).
const GAIN_PER_UNIT: Record<string, number> = { Power: 5, Fuel: 7 }

/** Apply the resource I received from a completed exchange to my levels. */
export function applyExchangeGain(get: Entry): void {
  const per = GAIN_PER_UNIT[get.resource]
  if (!per) return // only Power and Fuel are core gauges
  const value = parseFloat(get.amount) || 0
  const levels = loadResourceLevels()
  const key = get.resource === 'Power' ? 'power' : 'fuel'
  const next = Math.min(100, Math.round(levels[key] + value * per))
  saveJSON(LEVELS_KEY, { ...levels, [key]: next })
}
