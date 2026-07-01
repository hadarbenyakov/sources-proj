import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import {
  FLORENTIN_CENTER,
  FLORENTIN_ZOOM,
  MAPBOX_STYLE,
  MAPBOX_TOKEN,
  ME_COORD,
} from '../../lib/mapbox'

export type MapPerson = {
  id: string
  name: string
  photo: string
  lng: number
  lat: number
}

type Phase = 'browsing' | 'walking' | 'arrived'

type Props = {
  people: MapPerson[]
  selectedId: string | null
  phase: Phase
  onSelect: (id: string | null) => void
  onArrived: () => void
  walkMs: number
  recenterNonce?: number
}

const WALK_DURATION_FALLBACK = 12000

// Build the avatar marker element. The selected marker gets an accent ring.
function makeMarkerEl(photo: string, selected: boolean): HTMLDivElement {
  const el = document.createElement('div')
  el.className = 'mb-marker'
  el.style.width = selected ? '46px' : '34px'
  el.style.height = selected ? '46px' : '34px'
  el.style.borderRadius = '9999px'
  el.style.cursor = 'pointer'
  el.style.padding = selected ? '3px' : '0'
  el.style.background = selected ? '#ff5f1f' : '#ffffff'
  el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.35)'
  el.style.transition = 'width 140ms ease, height 140ms ease'
  const img = document.createElement('img')
  img.src = photo
  img.style.width = '100%'
  img.style.height = '100%'
  img.style.borderRadius = '9999px'
  img.style.objectFit = 'cover'
  img.style.display = 'block'
  el.appendChild(img)
  return el
}

function makeDot(color: string, size: number): HTMLDivElement {
  const el = document.createElement('div')
  el.style.width = `${size}px`
  el.style.height = `${size}px`
  el.style.borderRadius = '9999px'
  el.style.background = color
  el.style.border = '3px solid #ffffff'
  el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)'
  return el
}

// Fetch a street-following driving route from me to the target via the Mapbox
// Directions API. Falls back to a straight line if the request fails.
async function fetchWalkingRoute(to: [number, number]): Promise<[number, number][]> {
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/` +
    `${ME_COORD[0]},${ME_COORD[1]};${to[0]},${to[1]}` +
    `?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`
  try {
    const res = await fetch(url)
    const data = await res.json()
    const coords = data?.routes?.[0]?.geometry?.coordinates
    if (Array.isArray(coords) && coords.length > 1) return coords as [number, number][]
  } catch {
    /* fall through to straight line */
  }
  return [ME_COORD, to]
}

// Interpolate a position a fraction `t` (0..1) along a polyline.
function pointAt(coords: [number, number][], t: number): [number, number] {
  if (coords.length < 2) return coords[0]
  const lens: number[] = []
  let total = 0
  for (let i = 1; i < coords.length; i++) {
    const l = Math.hypot(coords[i][0] - coords[i - 1][0], coords[i][1] - coords[i - 1][1])
    lens.push(l)
    total += l
  }
  let d = t * total
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {
      const f = lens[i] ? d / lens[i] : 0
      const a = coords[i]
      const b = coords[i + 1]
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]
    }
    d -= lens[i]
  }
  return coords[coords.length - 1]
}

export default function MapView({
  people,
  selectedId,
  phase,
  onSelect,
  onArrived,
  walkMs,
  recenterNonce,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const walkerRef = useRef<mapboxgl.Marker | null>(null)
  const meRef = useRef<mapboxgl.Marker | null>(null)
  const rafRef = useRef<number | null>(null)
  const loadedRef = useRef(false)

  // Keep latest callbacks without re-initialising the map.
  const onSelectRef = useRef(onSelect)
  const onArrivedRef = useRef(onArrived)
  onSelectRef.current = onSelect
  onArrivedRef.current = onArrived

  // Initialise the map once.
  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return
    mapboxgl.accessToken = MAPBOX_TOKEN
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAPBOX_STYLE,
      center: FLORENTIN_CENTER,
      zoom: FLORENTIN_ZOOM,
      attributionControl: false,
    })
    mapRef.current = map

    map.on('load', () => {
      loadedRef.current = true
      // Tap on empty map dismisses the selection.
      map.on('click', () => onSelectRef.current(null))
      // "Me" marker.
      meRef.current = new mapboxgl.Marker({ element: makeDot('#3b82f6', 20) })
        .setLngLat(ME_COORD)
        .addTo(map)
    })

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      map.remove()
      mapRef.current = null
      markersRef.current.clear()
    }
  }, [])

  // Sync people markers + selection styling.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !MAPBOX_TOKEN) return
    const add = () => {
      // Remove stale markers.
      markersRef.current.forEach((mk, id) => {
        if (!people.some((p) => p.id === id)) {
          mk.remove()
          markersRef.current.delete(id)
        }
      })
      // During navigation only the destination marker is shown.
      const visible = phase === 'browsing' ? people : people.filter((p) => p.id === selectedId)
      visible.forEach((p) => {
        const selected = p.id === selectedId
        let mk = markersRef.current.get(p.id)
        const el = makeMarkerEl(p.photo, selected)
        el.addEventListener('click', (e) => {
          e.stopPropagation()
          onSelectRef.current(selectedId === p.id ? null : p.id)
        })
        if (mk) {
          mk.getElement().replaceWith(el)
          // Recreate marker so the new element is wired up.
          mk.remove()
        }
        mk = new mapboxgl.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(map)
        markersRef.current.set(p.id, mk)
      })
      // Hide all when not browsing and nothing selected.
      if (phase !== 'browsing') {
        markersRef.current.forEach((mk, id) => {
          if (id !== selectedId) {
            mk.remove()
            markersRef.current.delete(id)
          }
        })
      }
    }
    if (loadedRef.current) add()
    else map.once('load', add)
  }, [people, selectedId, phase])

  // Frame the selected person (and me) when one is picked.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !MAPBOX_TOKEN || phase !== 'browsing') return
    const target = people.find((p) => p.id === selectedId)
    if (!target) return
    const bounds = new mapboxgl.LngLatBounds()
    bounds.extend(ME_COORD)
    bounds.extend([target.lng, target.lat])
    map.fitBounds(bounds, { padding: { top: 120, bottom: 360, left: 80, right: 80 }, duration: 600 })
  }, [selectedId, phase, people])

  // Street-following walking route for the selected person (Mapbox Directions).
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null)
  useEffect(() => {
    const target = people.find((p) => p.id === selectedId)
    if (!target || !MAPBOX_TOKEN) {
      setRouteCoords(null)
      return
    }
    let cancelled = false
    fetchWalkingRoute([target.lng, target.lat]).then((coords) => {
      if (!cancelled) setRouteCoords(coords)
    })
    return () => {
      cancelled = true
    }
  }, [selectedId, people])

  // Preview route — grey dotted line along the streets to the selected person
  // while browsing (before navigation starts).
  useEffect(() => {
    const map = mapRef.current
    if (!map || !MAPBOX_TOKEN) return

    const remove = () => {
      const m = mapRef.current
      if (!m) return
      if (m.getLayer('preview-line')) m.removeLayer('preview-line')
      if (m.getSource('preview')) m.removeSource('preview')
    }

    const draw = () => {
      remove()
      if (phase !== 'browsing' || !routeCoords) return
      const line: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: routeCoords },
      }
      map.addSource('preview', { type: 'geojson', data: line })
      map.addLayer({
        id: 'preview-line',
        type: 'line',
        source: 'preview',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#9ca3af',
          'line-width': 9,
          'line-dasharray': [0, 1.6], // round caps + zero dash = round dots
        },
      })
    }

    if (loadedRef.current) draw()
    else map.once('load', draw)
    return remove
  }, [phase, routeCoords])

  // Walking animation: move a walker dot from me to the target, draw the line.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !MAPBOX_TOKEN) return
    const target = people.find((p) => p.id === selectedId)

    function clearRoute() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      if (walkerRef.current) {
        walkerRef.current.remove()
        walkerRef.current = null
      }
      if (map!.getLayer('route-line')) map!.removeLayer('route-line')
      if (map!.getSource('route')) map!.removeSource('route')
    }

    if (phase !== 'walking' || !target) {
      if (phase === 'browsing') clearRoute()
      return
    }

    const coords: [number, number][] =
      routeCoords ?? [ME_COORD, [target.lng, target.lat]]
    const line: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: coords },
    }

    const draw = () => {
      if (!map.getSource('route')) {
        map.addSource('route', { type: 'geojson', data: line })
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 9,
            'line-dasharray': [0, 1.6], // stay as round dots during navigation
          },
        })
      }
      if (meRef.current) meRef.current.remove()
      walkerRef.current = new mapboxgl.Marker({ element: makeDot('#3b82f6', 22) })
        .setLngLat(coords[0])
        .addTo(map)
      const bounds = coords.reduce(
        (b, c) => b.extend(c),
        new mapboxgl.LngLatBounds(coords[0], coords[0]),
      )
      map.fitBounds(bounds, {
        padding: { top: 120, bottom: 360, left: 80, right: 80 },
        duration: 600,
      })

      const dur = walkMs || WALK_DURATION_FALLBACK
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / dur)
        walkerRef.current?.setLngLat(pointAt(coords, t))
        if (t < 1) rafRef.current = requestAnimationFrame(tick)
        else onArrivedRef.current()
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    if (loadedRef.current) draw()
    else map.once('load', draw)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [phase, selectedId, people, walkMs, routeCoords])

  // Recenter on me when the nonce changes (driven by the recenter button).
  useEffect(() => {
    const map = mapRef.current
    if (!map || !MAPBOX_TOKEN || !recenterNonce) return
    map.flyTo({ center: ME_COORD, zoom: FLORENTIN_ZOOM, duration: 700 })
  }, [recenterNonce])

  // No token → render nothing here; Navigate shows the static fallback.
  if (!MAPBOX_TOKEN) return null

  return <div ref={containerRef} className="mb-map absolute inset-0" />
}
