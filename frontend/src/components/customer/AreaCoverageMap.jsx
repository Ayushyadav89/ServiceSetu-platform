import { useState, useEffect } from 'react'
import { MapPin, Users, Star, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../../services/api'
import { Spinner } from '../common/LoadingScreen'

const STATUS_CONFIG = {
  available:   { label: 'Available',   bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
  limited:     { label: 'Limited',     bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
  unavailable: { label: 'No Workers',  bg: 'bg-red-100',    text: 'text-red-600',    dot: 'bg-red-400'    },
}

const SKILL_ICONS = {
  plumber: '🔧', electrician: '⚡', carpenter: '🪑',
  painter: '🎨', cleaner: '🧹', ac_technician: '❄️',
  laborer: '💪', pest_control: '🐛',
}

export default function AreaCoverageMap({ city = 'Kanpur' }) {
  const [coverage, setCoverage] = useState([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [filter, setFilter]     = useState('all') // all | available | limited

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/workers/coverage?city=${city}`)
        setCoverage(data.data.coverage)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetch()
  }, [city])

  const filtered = coverage.filter((c) => {
    if (filter === 'available') return c.availableWorkers > 0
    if (filter === 'limited')   return c.availableWorkers > 0 && c.availableWorkers <= 2
    return true
  })

  const totalAvailable = coverage.reduce((s, c) => s + c.availableWorkers, 0)
  const totalAreas     = coverage.length

  if (loading) return (
    <div className="card p-8 flex justify-center"><Spinner size="md" /></div>
  )

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-white text-lg flex items-center gap-2">
              <MapPin size={18} className="text-brand-400" />
              Area Coverage — {city}
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              {totalAvailable} workers available across {totalAreas} areas
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-display font-bold text-brand-400">{totalAvailable}</div>
            <div className="text-xs text-slate-400">available now</div>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mt-3">
          {[
            { key: 'all',       label: 'All Areas' },
            { key: 'available', label: 'Has Workers' },
            { key: 'limited',   label: 'Limited' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-xs font-medium px-3 py-1 rounded-full transition-all ${
                filter === f.key
                  ? 'bg-brand-500 text-white'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Area list */}
      <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm">No areas match this filter</div>
        ) : filtered.map((area) => {
          const status = STATUS_CONFIG[area.status] || STATUS_CONFIG.unavailable
          const isOpen = expanded === area.pincode

          return (
            <div key={area.pincode}>
              <button
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left"
                onClick={() => setExpanded(isOpen ? null : area.pincode)}
              >
                {/* Status dot */}
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${status.dot}`} />

                {/* Area info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 text-sm">{area.area}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pincode: {area.pincode}
                  </p>
                </div>

                {/* Worker counts */}
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 justify-end">
                    <Users size={13} className="text-slate-400" />
                    <span className="text-sm font-bold text-slate-900">{area.availableWorkers}</span>
                    <span className="text-xs text-slate-400">/ {area.totalWorkers}</span>
                  </div>
                  <div className="flex items-center gap-0.5 justify-end mt-0.5">
                    <Star size={10} className="text-amber-400 fill-amber-400" />
                    <span className="text-xs text-slate-500">{area.avgRating || '—'}</span>
                  </div>
                </div>

                <div className="text-slate-400 flex-shrink-0">
                  {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </div>
              </button>

              {/* Expanded details */}
              {isOpen && (
                <div className="px-5 pb-4 bg-slate-50 border-t border-slate-100 animate-fade-in">
                  <div className="pt-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Services available in this area
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {area.skills?.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1 text-xs bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full capitalize">
                          <span>{SKILL_ICONS[s] || '🔧'}</span>
                          {s.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        {area.availableWorkers} available
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        {area.busyWorkers} busy
                      </span>
                      <span className="flex items-center gap-1">
                        <Star size={11} className="text-amber-400" />
                        Avg {area.avgRating} rating
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
        <p className="text-xs text-slate-400 text-center">
          Coverage data updates in real-time as workers accept/complete jobs
        </p>
      </div>
    </div>
  )
}