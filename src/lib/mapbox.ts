// Mapbox configuration. Drop your public token into a `.env` file at the repo
// root as `VITE_MAPBOX_TOKEN=pk....` — Vite exposes it via import.meta.env.
export const MAPBOX_TOKEN: string =
  (import.meta.env.VITE_MAPBOX_TOKEN as string | undefined) ?? ''

// Map style — swap this for a custom Mapbox Studio style to match the desired
// colour scheme. Dark, low-saturation default that suits the app's dark UI.
export const MAPBOX_STYLE = 'mapbox://styles/mapbox/dark-v11'

// Florentin, Tel Aviv.
export const FLORENTIN_CENTER: [number, number] = [34.7693, 32.0556]
export const FLORENTIN_ZOOM = 15.4

// "My" location — the navigation start point, near the heart of Florentin.
export const ME_COORD: [number, number] = [34.7693, 32.0556]

// Geo positions for the people offers, scattered over the neighbourhood. Index
// aligns with the marker list in Navigate.
export const PEOPLE_COORDS: Array<[number, number]> = [
  [34.7705, 32.0562],
  [34.7680, 32.0568],
  [34.7715, 32.0549],
  [34.7672, 32.0551],
  [34.7700, 32.0540],
  [34.7725, 32.0560],
  [34.7665, 32.0563],
  [34.7710, 32.0571],
  [34.7688, 32.0538],
  [34.7730, 32.0545],
]

// Florentin street addresses, index-aligned with PEOPLE_COORDS.
export const PEOPLE_PLACES: string[] = [
  'Florentin St 12, Tel Aviv',
  'Vital St 8, Tel Aviv',
  'Abarbanel St 24, Tel Aviv',
  'Herzl St 90, Tel Aviv',
  'Levinsky St 41, Tel Aviv',
  'Matalon St 17, Tel Aviv',
  'Ben Atar St 5, Tel Aviv',
  'Stern St 9, Tel Aviv',
  'HaAliya St 33, Tel Aviv',
  'Wolfson St 21, Tel Aviv',
]

// Great-circle distance in metres between two [lng, lat] points.
export function approxDistanceM(a: [number, number], b: [number, number]): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b[1] - a[1])
  const dLng = toRad(b[0] - a[0])
  const lat1 = toRad(a[1])
  const lat2 = toRad(b[1])
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// Human-friendly distance label (rounded to a tidy value).
export function distanceLabel(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)} KM`
  return `${Math.round(m / 10) * 10} M`
}
