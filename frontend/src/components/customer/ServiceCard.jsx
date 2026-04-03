import { useNavigate } from 'react-router-dom'
import { Clock, ArrowRight, MapPin } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const PRICE_UNIT_LABEL = {
  per_visit: 'per visit',
  per_hour:  'per hour',
  per_day:   'per day',
  fixed:     'fixed',
}

/**
 * ServiceCard
 * Props:
 *   service          - service object
 *   availableWorkers - number of available workers (optional)
 *   areaName         - area name to display (optional)
 *   onBook           - override booking handler (optional, used when worker pre-selected)
 */
export default function ServiceCard({ service, availableWorkers = null, areaName = null, onBook = null }) {
  const navigate = useNavigate()
  const { user }  = useAuth()

  const handleBook = () => {
    if (onBook) { onBook(); return }           // pre-selected worker path
    if (!user) { navigate('/login'); return }
    navigate(`/book/${service._id}`)
  }

  const availBadge = availableWorkers === null ? null
    : availableWorkers === 0
    ? { label: 'No workers nearby',            color: 'bg-red-100 text-red-600',    dot: 'bg-red-400'   }
    : availableWorkers <= 2
    ? { label: `${availableWorkers} available`, color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' }
    : { label: `${availableWorkers} available`, color: 'bg-green-100 text-green-700', dot: 'bg-green-500' }

  return (
    <div className="card hover:shadow-card-hover transition-all duration-300 overflow-hidden group flex flex-col">
      <div className="h-1.5 bg-gradient-to-r from-brand-400 to-brand-600" />
      <div className="p-5 flex flex-col flex-1">

        {/* Icon + badges */}
        <div className="flex items-start justify-between mb-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-2xl">
            {service.icon}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full capitalize">
              {service.category.replace('_', ' ')}
            </span>
            {availBadge && (
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${availBadge.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${availBadge.dot}`} /> {availBadge.label}
              </span>
            )}
          </div>
        </div>

        {/* Name + description */}
        <h3 className="font-display font-bold text-slate-900 text-base mb-1 group-hover:text-brand-600 transition-colors line-clamp-2">
          {service.name}
        </h3>
        <p className="text-xs text-slate-500 mb-3 line-clamp-2 flex-1">{service.shortDescription}</p>

        {/* Area label */}
        {areaName && (
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
            <MapPin size={11} className="text-brand-500 flex-shrink-0" />
            Workers in <strong className="ml-0.5">{areaName}</strong>
          </div>
        )}

        {/* Duration + price row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock size={12} /> <span>{service.estimatedDuration} min</span>
          </div>
          <div className="text-right">
            <div className="font-display font-bold text-slate-900 text-lg leading-tight">
              ₹{service.basePrice.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-400">{PRICE_UNIT_LABEL[service.priceUnit]}</div>
          </div>
        </div>

        {/* CTA button */}
        <button
          onClick={handleBook}
          className="mt-auto w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-all duration-200 active:scale-95 group-hover:gap-3"
        >
          Book Now <ArrowRight size={15} />
        </button>
      </div>
    </div>
  )
}