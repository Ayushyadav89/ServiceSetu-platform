import { useState, useEffect, useRef } from 'react'
import { MapPin, Search, CheckCircle, XCircle, Clock, Star, ChevronRight, AlertCircle, Building2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../common/LoadingScreen'

const SKILL_OPTIONS = [
  { value: '',             label: 'Any Service',   icon: '🔍' },
  { value: 'plumber',      label: 'Plumber',       icon: '🔧' },
  { value: 'electrician',  label: 'Electrician',   icon: '⚡' },
  { value: 'carpenter',    label: 'Carpenter',     icon: '🪑' },
  { value: 'painter',      label: 'Painter',       icon: '🎨' },
  { value: 'cleaner',      label: 'Cleaner',       icon: '🧹' },
  { value: 'ac_technician',label: 'AC Technician', icon: '❄️' },
  { value: 'laborer',      label: 'Laborer',       icon: '💪' },
]

const AVAIL_CFG = {
  available: { label: 'Available', dot: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50'  },
  busy:      { label: 'Busy',      dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50'  },
  offline:   { label: 'Offline',   dot: 'bg-slate-400', text: 'text-slate-500', bg: 'bg-slate-100' },
}

// Autocomplete input with debounced API suggestions
function AutocompleteInput({ placeholder, value, onChange, type, icon: Icon }) {
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen]   = useState(false)
  const [loading, setLoading] = useState(false)
  const ref   = useRef(null)
  const timer = useRef(null)

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const handleChange = (e) => {
    const val = e.target.value
    onChange(val)
    clearTimeout(timer.current)
    if (val.length < 2) { setSuggestions([]); setOpen(false); return }
    setLoading(true)
    timer.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/workers/suggestions?q=${encodeURIComponent(val)}&type=${type}`)
        setSuggestions(data.data.suggestions)
        setOpen(true)
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }, 300)
  }

  return (
    <div className="relative flex-1" ref={ref}>
      <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className="input-field pl-9 text-sm w-full"
      />
      {loading && <Spinner size="sm" className="absolute right-3 top-1/2 -translate-y-1/2" />}
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {suggestions.map((s) => (
            <button key={s} type="button"
              className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              onMouseDown={() => { onChange(s); setOpen(false) }}>
              <MapPin size={12} className="text-brand-500 flex-shrink-0" /> {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AreaWorkerChecker() {
  const navigate = useNavigate()
  const { user }  = useAuth()
  const [area, setArea]     = useState('')
  const [city, setCity]     = useState('')
  const [skill, setSkill]   = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const handleCheck = async (e) => {
    e.preventDefault()
    if (!area && !city) { setError('Please enter an area name or city'); return }
    setError(''); setLoading(true); setResult(null)
    try {
      const params = new URLSearchParams()
      if (area)  params.append('area', area)
      if (city)  params.append('city', city)
      if (skill) params.append('skill', skill)
      const { data } = await api.get(`/workers/available?${params.toString()}`)
      setResult(data.data)
    } catch { setError('Failed to check availability. Please try again.') }
    finally { setLoading(false) }
  }

  // When customer clicks Book on a worker card
  const handleBookWorker = (workerId) => {
    if (!user) { navigate('/login'); return }
    // Go to services page with the worker pre-selected
    navigate(`/services?workerContext=${workerId}`)
  }

  const matchLabel = {
    area:    `Workers in "${area}"`,
    city:    `No workers in "${area || 'that area'}" — showing all in ${city}`,
    pincode: `Workers near pincode`,
    none:    'No workers found',
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500">
          <MapPin size={20} />
        </div>
        <div>
          <h2 className="font-display font-bold text-slate-900 text-lg">Check Worker Availability</h2>
          <p className="text-slate-500 text-xs">Enter your area name and city to find nearby workers</p>
        </div>
      </div>

      <form onSubmit={handleCheck} className="space-y-3 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <AutocompleteInput
            placeholder="Area / locality (e.g. Govind Nagar)"
            value={area} onChange={setArea} type="area" icon={MapPin}
          />
          <AutocompleteInput
            placeholder="City (e.g. Kanpur)"
            value={city} onChange={setCity} type="city" icon={Building2}
          />
        </div>
        <div className="flex gap-3">
          <select value={skill} onChange={(e) => setSkill(e.target.value)} className="input-field text-sm flex-1">
            {SKILL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.icon} {o.label}</option>
            ))}
          </select>
          <button type="submit" disabled={loading}
            className="btn-primary text-sm flex items-center gap-2 px-6">
            {loading ? <Spinner size="sm" /> : <><Search size={15} /> Search</>}
          </button>
        </div>
      </form>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-2.5 rounded-xl mb-4">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {result && (
        <>
          {/* Summary banner */}
          <div className={`rounded-2xl p-4 mb-4 border ${
            result.availableCount > 0 ? 'bg-green-50 border-green-200'
            : result.count > 0 ? 'bg-amber-50 border-amber-200'
            : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              {result.availableCount > 0
                ? <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
                : result.count > 0
                ? <Clock size={18} className="text-amber-600 flex-shrink-0" />
                : <XCircle size={18} className="text-red-500 flex-shrink-0" />
              }
              <div>
                <p className="font-semibold text-slate-900 text-sm">
                  {result.availableCount > 0
                    ? `${result.availableCount} worker${result.availableCount > 1 ? 's' : ''} available right now!`
                    : result.count > 0
                    ? `${result.count} worker(s) registered but all currently busy`
                    : 'No workers found in this area'
                  }
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{matchLabel[result.matchType]}</p>
              </div>
            </div>
          </div>

          {/* Worker cards */}
          {result.count > 0 && (
            <div className="space-y-4">
              {result.available?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Available Now ({result.available.length})
                  </p>
                  <div className="space-y-2">
                    {result.available.map((w) => (
                      <WorkerRow key={w._id} worker={w} onBook={() => handleBookWorker(w._id)} />
                    ))}
                  </div>
                </div>
              )}
              {result.busy?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 mt-4">
                    Currently Busy ({result.busy.length})
                  </p>
                  <div className="space-y-2 opacity-70">
                    {result.busy.map((w) => <WorkerRow key={w._id} worker={w} />)}
                  </div>
                </div>
              )}
            </div>
          )}

          {result.count === 0 && (
            <div className="text-center py-6">
              <p className="text-2xl mb-2">😕</p>
              <p className="font-semibold text-slate-700 text-sm">No workers found in this area</p>
              <p className="text-xs text-slate-500 mt-1">Try a different area, city, or remove the skill filter</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function WorkerRow({ worker, onBook }) {
  const cfg = AVAIL_CFG[worker.availability] || AVAIL_CFG.offline

  // Show the final price the customer would pay
  const workerPrice  = worker.pricing?.demandedPrice || 0
  const serviceFee   = Math.round(workerPrice * 0.20)
  const maintenance  = 20
  const gst          = Math.round((serviceFee + maintenance) * 0.18)
  const totalPrice   = workerPrice + serviceFee + maintenance + gst

  return (
    <div className="flex items-start gap-3 bg-slate-50 hover:bg-slate-100 rounded-xl px-4 py-3 transition-colors">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm flex-shrink-0">
        {worker.name[0]}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-slate-900 text-sm">{worker.name}</p>
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} /> {cfg.label}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500">
          <span>📍 {worker.location?.area}, {worker.location?.city}</span>
          <span className="flex items-center gap-0.5">
            <Star size={11} className="text-amber-400 fill-amber-400" />
            {worker.rating?.average?.toFixed(1) || '0.0'}
          </span>
          <span>{worker.experience}yr exp</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {worker.skills?.map((s) => (
            <span key={s} className="text-xs bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full capitalize">
              {s.replace('_', ' ')}
            </span>
          ))}
        </div>
        {worker.bio && <p className="text-xs text-slate-400 mt-1 italic line-clamp-1">"{worker.bio}"</p>}

        {/* Price row */}
        {workerPrice > 0 && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
            <span className="text-xs text-slate-500">
              Worker asks <span className="font-semibold text-slate-700">₹{workerPrice}</span>
            </span>
            <span className="text-xs font-bold text-brand-600">
              You pay ₹{totalPrice}
            </span>
          </div>
        )}
      </div>

      {/* Book button */}
      {onBook && worker.availability === 'available' && (
        <button onClick={onBook}
          className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 px-3 py-1.5 rounded-lg transition-colors mt-1">
          Book <ChevronRight size={12} />
        </button>
      )}
    </div>
  )
}