'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapPin, ExternalLink } from 'lucide-react'

interface Props {
  venueName: string
  venueAddress?: string | null
  city?: string | null
  state?: string | null
}

const NIGERIA_BBOX = '2.6,4.2,14.7,13.9'

/**
 * Shows a small map pinned at the event's venue. Geocodes the stored
 * address client-side on mount (the app doesn't store coordinates — see
 * VenueAutocomplete) rather than requiring a database migration to add
 * lat/lng columns. Degrades to a plain "Open in Maps" link if there's no
 * Mapbox token configured yet, or if the address can't be geocoded —
 * never blocks the rest of the event page from rendering.
 */
export default function EventMap({ venueName, venueAddress, city, state }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [coords, setCoords] = useState<[number, number] | null>(null)
  const [geocodeFailed, setGeocodeFailed] = useState(false)

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  const canGeocode = !!token && !!venueName

  const fullAddress = [venueName, venueAddress, city, state, 'Nigeria'].filter(Boolean).join(', ')
  const externalMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`

  useEffect(() => {
    // Nothing to synchronize with an external system yet — bail before
    // touching any state. Every setState call below only happens inside
    // the fetch's own async callbacks, in response to its result.
    if (!canGeocode) return

    let cancelled = false
    const query = [venueName, city, state].filter(Boolean).join(', ')

    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&country=ng&bbox=${NIGERIA_BBOX}&types=poi,address,place&limit=1`)
      .then(res => res.json())
      .then(data => {
        if (cancelled) return
        const feature = data.features?.[0]
        if (feature?.center) {
          setCoords([feature.center[0], feature.center[1]])
        } else {
          setGeocodeFailed(true)
        }
      })
      .catch(() => { if (!cancelled) setGeocodeFailed(true) })

    return () => { cancelled = true }
  }, [canGeocode, venueName, city, state, token])

  useEffect(() => {
    if (!coords || !mapContainerRef.current || !token) return

    mapboxgl.accessToken = token
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: coords,
      zoom: 14,
      interactive: true,
    })
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    new mapboxgl.Marker({ color: '#f97316' }).setLngLat(coords).addTo(map)
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [coords, token])

  const showFallback = !canGeocode || geocodeFailed
  const showMap = canGeocode && !geocodeFailed && !!coords
  const showLoading = canGeocode && !geocodeFailed && !coords

  if (showFallback) {
    return (
      <a
        href={externalMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0">
          <MapPin className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-gray-900 truncate">{venueName || 'Venue'}</div>
          <div className="text-xs text-gray-500 truncate">{venueAddress || [city, state].filter(Boolean).join(', ')}</div>
        </div>
        <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </a>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden border border-gray-100">
      {showLoading && (
        <div className="h-48 bg-gray-50 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div ref={mapContainerRef} className={showMap ? 'h-48 w-full' : 'hidden'} />
      {showMap && (
        <a
          href={externalMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 py-2.5 bg-gray-50 text-xs font-bold text-gray-600 hover:text-orange-600 transition-colors border-t border-gray-100"
        >
          Open in Maps <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  )
}
