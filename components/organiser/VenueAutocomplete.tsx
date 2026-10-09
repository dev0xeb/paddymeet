'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Search } from 'lucide-react'

interface VenueSuggestion {
  name: string
  address: string
  lng: number
  lat: number
}

interface Props {
  venueName: string
  venueAddress: string
  onVenueNameChange: (value: string) => void
  onVenueAddressChange: (value: string) => void
  onSelect?: (venue: VenueSuggestion) => void
  inputClass: string
  labelClass: string
}

// Nigeria's rough bounding box — keeps suggestions relevant and cuts down
// on irrelevant matches from elsewhere for short/common venue names.
const NIGERIA_BBOX = '2.6,4.2,14.7,13.9'

/**
 * A plain venue-name text input that live-suggests real places via Mapbox
 * as the organiser types, and fills in the address field when one is
 * picked. Degrades to an ordinary text input with no suggestions if
 * NEXT_PUBLIC_MAPBOX_TOKEN isn't set — never blocks event submission.
 */
export default function VenueAutocomplete({
  venueName,
  venueAddress,
  onVenueNameChange,
  onVenueAddressChange,
  onSelect,
  inputClass,
  labelClass,
}: Props) {
  const [suggestions, setSuggestions] = useState<VenueSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchSuggestions = (query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!token || query.trim().length < 3) {
      setSuggestions([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&country=ng&bbox=${NIGERIA_BBOX}&types=poi,address,place&autocomplete=true&limit=5`
        )
        const data = await res.json()
        const results: VenueSuggestion[] = (data.features || []).map((f: { text: string, place_name: string, center: [number, number] }) => ({
          name: f.text,
          address: f.place_name,
          lng: f.center[0],
          lat: f.center[1],
        }))
        setSuggestions(results)
        setShowSuggestions(true)
      } catch {
        setSuggestions([])
      }
      setLoading(false)
    }, 300)
  }

  const handleNameChange = (value: string) => {
    onVenueNameChange(value)
    fetchSuggestions(value)
  }

  const handlePick = (s: VenueSuggestion) => {
    onVenueNameChange(s.name)
    onVenueAddressChange(s.address)
    onSelect?.(s)
    setShowSuggestions(false)
    setSuggestions([])
  }

  return (
    <div className="space-y-4">
      <div ref={containerRef} className="relative">
        <label className={labelClass}>Venue name <span className="text-red-400">*</span></label>
        <div className="relative">
          <input
            type="text"
            placeholder="e.g. Eko Hotel Grounds"
            value={venueName}
            onChange={e => handleNameChange(e.target.value)}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
            className={inputClass + (token ? ' pr-9' : '')}
            autoComplete="off"
          />
          {token && (
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-20 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handlePick(s)}
                className="w-full flex items-start gap-2.5 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
              >
                <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-gray-900 truncate">{s.name}</div>
                  <div className="text-xs text-gray-500 truncate">{s.address}</div>
                </div>
              </button>
            ))}
          </div>
        )}
        {token && loading && (
          <p className="text-[11px] text-gray-400 mt-1">Searching venues…</p>
        )}
      </div>

      <div>
        <label className={labelClass}>Venue address</label>
        <input
          type="text"
          placeholder="Full address of the venue"
          value={venueAddress}
          onChange={e => onVenueAddressChange(e.target.value)}
          className={inputClass}
        />
      </div>
    </div>
  )
}
