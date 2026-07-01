export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function saveJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota or disabled — no-op */
  }
}

// Every key the app persists. Cleared on a full page load (see resetAppData),
// so a browser refresh restarts the demo from scratch — no offers, default
// resource levels — while in-session SPA navigation keeps state intact.
const APP_KEYS = [
  'myExchanges',
  'myNegotiations',
  'myNotifications',
  'activeNavigation',
  'resourceLevels',
]

/** Wipe all persisted app data. Called once per hard page load. */
export function resetAppData(): void {
  try {
    for (const key of APP_KEYS) localStorage.removeItem(key)
  } catch {
    /* disabled — no-op */
  }
}
