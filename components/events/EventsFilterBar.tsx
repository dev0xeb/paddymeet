'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Calendar, Users, Search, SlidersHorizontal, ChevronDown, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FilterBarProps {
  currentParams: {
    city?: string
    type?: string
    vibe?: string
    date?: string
    capacity?: string
    search?: string
  }
}

function Dropdown({ label, icon: Icon, options, paramKey, currentValue, currentParams }: {
  label: string
  icon?: React.ElementType
  options: { label: string, value: string }[]
  paramKey: string
  currentValue?: string
  currentParams: Record<string, string | undefined>
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const buildHref = (value: string) => {
    const params = new URLSearchParams()
    Object.entries(currentParams).forEach(([k, v]) => {
      if (v && k !== paramKey) params.set(k, v)
    })
    if (value !== currentValue) params.set(paramKey, value)
    const str = params.toString()
    return `/events${str ? `?${str}` : ''}`
  }

  const isActive = !!currentValue

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-semibold transition-all ${
          isActive
            ? 'bg-orange-500 border-orange-500 text-white'
            : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
        }`}
      >
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {currentValue ? options.find(o => o.value === currentValue)?.label || label : label}
        <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-2xl p-3 shadow-xl z-50 min-w-[200px]">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</div>
          <div className="flex flex-wrap gap-1.5">
            {options.map(opt => (
              <Link
                key={opt.value}
                href={buildHref(opt.value)}
                onClick={() => setOpen(false)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  currentValue === opt.value
                    ? 'bg-orange-50 border-orange-300 text-orange-600'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-orange-200 hover:text-orange-500'
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function LocationDropdown({ currentCity, currentParams }: {
  currentCity?: string
  currentParams: Record<string, string | undefined>
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const cities = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan']

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const buildHref = (city: string) => {
    const params = new URLSearchParams()
    Object.entries(currentParams).forEach(([k, v]) => {
      if (v && k !== 'city') params.set(k, v)
    })
    params.set('city', city.toLowerCase())
    return `/events?${params.toString()}`
  }

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm font-semibold text-gray-700 hover:border-gray-300 transition-all"
      >
        <MapPin className="w-3.5 h-3.5 text-orange-500" />
        {currentCity ? currentCity.charAt(0).toUpperCase() + currentCity.slice(1) : 'Lagos'}
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-2xl p-2 shadow-xl z-50 min-w-[200px]">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-1 mb-1">Change location</div>
          {cities.map(city => (
            <Link
              key={city}
              href={buildHref(city)}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                currentCity === city.toLowerCase()
                  ? 'bg-orange-50 text-orange-500'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              {city}
              {city === 'Lagos' && !currentCity && (
                <span className="ml-auto text-xs text-orange-500 font-bold">Current</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function EventsFilterBar({ currentParams }: FilterBarProps) {
  const router = useRouter()
  const [search, setSearch] = useState(currentParams.search || '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    Object.entries(currentParams).forEach(([k, v]) => {
      if (v && k !== 'search') params.set(k, v)
    })
    if (search) params.set('search', search)
    router.push(`/events?${params.toString()}`)
  }

  const hasFilters = currentParams.city || currentParams.type || currentParams.vibe ||
    currentParams.date || currentParams.capacity || currentParams.search

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-6">

        {/* Title and search */}
        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Browse Events</h1>
          <form onSubmit={handleSearch} className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full w-72 focus-within:border-orange-400 focus-within:bg-white transition-all">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search events, venues..."
              className="bg-transparent border-none outline-none text-sm text-gray-900 w-full placeholder:text-gray-400"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')}>
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
          </form>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-wrap">

          <LocationDropdown currentCity={currentParams.city} currentParams={currentParams} />

          <div className="h-5 w-px bg-gray-200 flex-shrink-0" />

          <Dropdown
            label="Date"
            icon={Calendar}
            paramKey="date"
            currentValue={currentParams.date}
            currentParams={currentParams}
            options={[
              { label: 'This Weekend', value: 'this-weekend' },
              { label: 'This Week', value: 'this-week' },
              { label: 'This Month', value: 'this-month' },
              { label: 'Next Month', value: 'next-month' },
            ]}
          />

          <div className="h-5 w-px bg-gray-200 flex-shrink-0" />

          <Dropdown
            label="Type"
            icon={SlidersHorizontal}
            paramKey="type"
            currentValue={currentParams.type}
            currentParams={currentParams}
            options={[
              { label: 'Concert', value: 'concert' },
              { label: 'Club Night', value: 'club-night' },
              { label: 'Festival', value: 'festival' },
              { label: 'Day Party', value: 'day-party' },
              { label: 'Lounge', value: 'lounge' },
              { label: 'Comedy Show', value: 'comedy-show' },
              { label: 'Arts & Culture', value: 'arts-culture' },
              { label: 'Rave', value: 'rave' },
            ]}
          />

          <div className="h-5 w-px bg-gray-200 flex-shrink-0" />

          <Dropdown
            label="Vibe"
            paramKey="vibe"
            currentValue={currentParams.vibe}
            currentParams={currentParams}
            options={[
              { label: 'Turnt', value: 'turnt' },
              { label: 'Chill', value: 'chill' },
              { label: 'Exclusive', value: 'exclusive' },
              { label: 'Wild', value: 'wild' },
              { label: 'Social', value: 'social' },
              { label: 'Cultural', value: 'cultural' },
              { label: 'Classy', value: 'classy' },
            ]}
          />

          <div className="h-5 w-px bg-gray-200 flex-shrink-0" />

          <Dropdown
            label="Capacity"
            icon={Users}
            paramKey="capacity"
            currentValue={currentParams.capacity}
            currentParams={currentParams}
            options={[
              { label: 'Intimate', value: 'intimate' },
              { label: 'Medium', value: 'medium' },
              { label: 'Large Venue', value: 'large' },
              { label: 'Full House', value: 'full-house' },
            ]}
          />

          {hasFilters && (
            <Link href="/events" className="px-4 py-2 text-sm font-bold text-orange-500 hover:underline flex-shrink-0">
              Clear all
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}