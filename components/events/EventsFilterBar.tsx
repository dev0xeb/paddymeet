'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
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

function Dropdown({
  label,
  icon: Icon,
  options,
  paramKey,
  currentValue,
  currentParams,
  onSelect,
}: {
  label: string
  icon?: React.ElementType
  options: { label: string; value: string }[]
  paramKey: string
  currentValue?: string
  currentParams: Record<string, string | undefined>
  onSelect: (href: string) => void
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
  const activeLabel = options.find(o => o.value === currentValue)?.label

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
        {activeLabel || label}
        <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-[calc(100%+8px)] left-0 bg-white border border-gray-200 rounded-2xl p-3 shadow-2xl z-[999] min-w-[200px]">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</div>
          <div className="flex flex-wrap gap-1.5">
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => {
                  setOpen(false)
                  onSelect(buildHref(opt.value))
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  currentValue === opt.value
                    ? 'bg-orange-50 border-orange-300 text-orange-600'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-orange-200 hover:text-orange-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function LocationDropdown({
  currentCity,
  currentParams,
  onSelect,
}: {
  currentCity?: string
  currentParams: Record<string, string | undefined>
  onSelect: (href: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [expandedState, setExpandedState] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const nigeriaLocations: { state: string; cities: string[] }[] = [
    { state: 'Lagos', cities: ['Lagos Island', 'Lagos Mainland', 'Lekki', 'Victoria Island', 'Ikeja', 'Surulere', 'Yaba', 'Ajah', 'Ikoyi', 'Festac'] },
    { state: 'Abuja (FCT)', cities: ['Central Area', 'Garki', 'Wuse', 'Maitama', 'Asokoro', 'Gwarinpa', 'Lugbe', 'Jabi'] },
    { state: 'Rivers', cities: ['Port Harcourt', 'Obio-Akpor', 'Eleme', 'Bonny'] },
    { state: 'Oyo', cities: ['Ibadan', 'Ogbomosho', 'Oyo'] },
    { state: 'Kano', cities: ['Kano', 'Fagge', 'Dala', 'Gwale'] },
    { state: 'Anambra', cities: ['Awka', 'Onitsha', 'Nnewi'] },
    { state: 'Enugu', cities: ['Enugu', 'Nsukka'] },
    { state: 'Delta', cities: ['Asaba', 'Warri', 'Ughelli'] },
    { state: 'Edo', cities: ['Benin City', 'Auchi'] },
    { state: 'Imo', cities: ['Owerri', 'Orlu'] },
    { state: 'Kaduna', cities: ['Kaduna', 'Zaria'] },
    { state: 'Kwara', cities: ['Ilorin', 'Offa'] },
    { state: 'Osun', cities: ['Osogbo', 'Ile-Ife', 'Ilesa'] },
    { state: 'Ogun', cities: ['Abeokuta', 'Sagamu', 'Ijebu-Ode'] },
    { state: 'Cross River', cities: ['Calabar', 'Ogoja'] },
    { state: 'Akwa Ibom', cities: ['Uyo', 'Eket'] },
    { state: 'Bayelsa', cities: ['Yenagoa', 'Ogbia'] },
    { state: 'Plateau', cities: ['Jos', 'Bukuru'] },
    { state: 'Borno', cities: ['Maiduguri', 'Biu'] },
    { state: 'Sokoto', cities: ['Sokoto', 'Binji'] },
    { state: 'Katsina', cities: ['Katsina', 'Daura'] },
    { state: 'Niger', cities: ['Minna', 'Bida', 'Suleja'] },
    { state: 'Kebbi', cities: ['Birnin Kebbi', 'Argungu'] },
    { state: 'Zamfara', cities: ['Gusau', 'Kaura Namoda'] },
    { state: 'Jigawa', cities: ['Dutse', 'Hadejia'] },
    { state: 'Yobe', cities: ['Damaturu', 'Potiskum'] },
    { state: 'Adamawa', cities: ['Yola', 'Mubi'] },
    { state: 'Taraba', cities: ['Jalingo', 'Wukari'] },
    { state: 'Gombe', cities: ['Gombe', 'Kumo'] },
    { state: 'Bauchi', cities: ['Bauchi', 'Azare'] },
    { state: 'Nassarawa', cities: ['Lafia', 'Keffi'] },
    { state: 'Benue', cities: ['Makurdi', 'Gboko'] },
    { state: 'Kogi', cities: ['Lokoja', 'Okene'] },
    { state: 'Ebonyi', cities: ['Abakaliki', 'Onueke'] },
    { state: 'Abia', cities: ['Umuahia', 'Aba'] },
    { state: 'Ekiti', cities: ['Ado-Ekiti', 'Ikere-Ekiti'] },
    { state: 'Ondo', cities: ['Akure', 'Ondo', 'Ore'] },
  ]

  const filtered = search.trim()
    ? nigeriaLocations.filter(l =>
        l.state.toLowerCase().includes(search.toLowerCase()) ||
        l.cities.some(c => c.toLowerCase().includes(search.toLowerCase()))
      )
    : nigeriaLocations

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
    params.set('city', city)
    return `/events?${params.toString()}`
  }

  const clearCity = () => {
    const params = new URLSearchParams()
    Object.entries(currentParams).forEach(([k, v]) => {
      if (v && k !== 'city') params.set(k, v)
    })
    onSelect(`/events${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-semibold transition-all ${
          currentCity
            ? 'bg-orange-500 border-orange-500 text-white'
            : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
        }`}
      >
        <MapPin className="w-3.5 h-3.5" />
        {currentCity || 'Location'}
        <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-[calc(100%+8px)] left-0 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[999] w-72">
          {/* Search */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus-within:border-orange-400 transition-all">
              <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setExpandedState(null) }}
                placeholder="Search state or city..."
                className="bg-transparent outline-none text-sm text-gray-900 w-full placeholder:text-gray-400"
                autoFocus
              />
              {search && (
                <button onClick={() => { setSearch(''); setExpandedState(null) }}>
                  <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto p-2">
            {/* All Nigeria option */}
            {currentCity && (
              <button
                onClick={() => { setOpen(false); clearCity() }}
                className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-orange-500 hover:bg-orange-50 transition-colors mb-1"
              >
                All of Nigeria
              </button>
            )}

            {filtered.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No results found</p>
            )}

            {filtered.map(({ state, cities }) => {
              const isExpanded = expandedState === state || search.trim() !== ''
              const matchingCities = search.trim()
                ? cities.filter(c => c.toLowerCase().includes(search.toLowerCase()) || state.toLowerCase().includes(search.toLowerCase()))
                : cities

              return (
                <div key={state}>
                  {/* State row */}
                  <button
                    onClick={() => setExpandedState(isExpanded && !search ? null : state)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold text-gray-800 hover:bg-gray-50 transition-colors text-left"
                  >
                    <span>{state}</span>
                    {!search && (
                      <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    )}
                  </button>

                  {/* Cities */}
                  {isExpanded && (
                    <div className="ml-3 mb-1 space-y-0.5">
                      {matchingCities.map(city => (
                        <button
                          key={city}
                          onClick={() => {
                            setOpen(false)
                            setSearch('')
                            onSelect(buildHref(city))
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                            currentCity === city
                              ? 'bg-orange-50 text-orange-500 font-bold'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function EventsFilterBar({ currentParams }: FilterBarProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(currentParams.search || '')

  const handleSelect = (href: string) => {
    startTransition(() => {
      router.push(href)
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    Object.entries(currentParams).forEach(([k, v]) => {
      if (v && k !== 'search') params.set(k, v)
    })
    if (search) params.set('search', search)
    startTransition(() => {
      router.push(`/events?${params.toString()}`)
    })
  }

  const handleClear = () => {
    setSearch('')
    startTransition(() => {
      router.push('/events')
    })
  }

  const hasFilters =
    currentParams.city || currentParams.type || currentParams.vibe ||
    currentParams.date || currentParams.capacity || currentParams.search

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-6">

        {/* Title and search */}
        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Browse Events
          </h1>
          <form
            onSubmit={handleSearch}
            className="relative flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full w-72 focus-within:border-orange-400 focus-within:bg-white transition-all"
          >
            {isPending ? (
              <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            ) : (
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search events, venues..."
              className="bg-transparent border-none outline-none text-sm text-gray-900 w-full placeholder:text-gray-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="flex-shrink-0"
              >
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </form>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 flex-wrap">

          <LocationDropdown
            currentCity={currentParams.city}
            currentParams={currentParams}
            onSelect={handleSelect}
          />

          <div className="h-5 w-px bg-gray-200 flex-shrink-0" />

          <Dropdown
            label="Date"
            icon={Calendar}
            paramKey="date"
            currentValue={currentParams.date}
            currentParams={currentParams}
            onSelect={handleSelect}
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
            onSelect={handleSelect}
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
            onSelect={handleSelect}
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
            onSelect={handleSelect}
            options={[
              { label: 'Intimate', value: 'intimate' },
              { label: 'Medium', value: 'medium' },
              { label: 'Large Venue', value: 'large' },
              { label: 'Full House', value: 'full-house' },
            ]}
          />

          {hasFilters && (
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm font-bold text-orange-500 hover:underline flex-shrink-0"
            >
              Clear all
            </button>
          )}
        </div>
      </div>
    </div>
  )
}