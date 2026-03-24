import { useNavigate } from 'react-router-dom'
import { Clock, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const PRICE_UNIT_LABEL = {
  per_visit: 'per visit',
  per_hour: 'per hour',
  per_day: 'per day',
  fixed: 'fixed',
}

export default function ServiceCard({ service }) {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleBook = () => {
    if (!user) {
      navigate('/login')
      return
    }
    navigate(`/book/${service._id}`)
  }

  return (
    <div className="card hover:shadow-card-hover transition-all duration-300 overflow-hidden group cursor-pointer" onClick={handleBook}>
      {/* Color band */}
      <div className="h-1.5 bg-gradient-to-r from-brand-400 to-brand-600" />

      <div className="p-5">
        {/* Icon + category */}
        <div className="flex items-start justify-between mb-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-2xl">
            {service.icon}
          </div>
          <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full capitalize">
            {service.category.replace('_', ' ')}
          </span>
        </div>

        {/* Name */}
        <h3 className="font-display font-bold text-slate-900 text-base mb-1 group-hover:text-brand-600 transition-colors line-clamp-2">
          {service.name}
        </h3>

        {/* Short desc */}
        <p className="text-xs text-slate-500 mb-4 line-clamp-2">{service.shortDescription}</p>

        {/* Duration + price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock size={12} />
            <span>{service.estimatedDuration} min</span>
          </div>
          <div className="text-right">
            <div className="font-display font-bold text-slate-900 text-lg">
              ₹{service.basePrice.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-400">{PRICE_UNIT_LABEL[service.priceUnit]}</div>
          </div>
        </div>

        {/* CTA */}
        <button className="mt-4 w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-all duration-200 active:scale-95 group-hover:gap-3">
          Book Now <ArrowRight size={15} />
        </button>
      </div>
    </div>
  )
}
