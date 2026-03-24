import { Link } from 'react-router-dom'
import { Calendar, MapPin, User, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { StatusBadge } from '../common/LoadingScreen'

export default function BookingCard({ booking }) {
  const scheduledDate = new Date(booking.scheduledDate)

  return (
    <div className="card p-4 hover:shadow-card-hover transition-all duration-200">
      <div className="flex items-start gap-4">
        {/* Service icon */}
        <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center text-xl flex-shrink-0">
          {booking.service?.icon || '🔧'}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 text-sm truncate">{booking.service?.name}</h3>
            <StatusBadge status={booking.status} />
          </div>

          <p className="text-xs text-slate-400 mb-2 font-mono">#{booking.bookingId}</p>

          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {format(scheduledDate, 'dd MMM yyyy')} · {booking.scheduledTime}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={11} />
              {booking.address?.area}, {booking.address?.city}
            </span>
            {booking.worker && (
              <span className="flex items-center gap-1">
                <User size={11} />
                {booking.worker.name}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="text-sm font-bold text-slate-900">
          ₹{booking.pricing?.totalAmount?.toLocaleString('en-IN')}
          <span className="text-xs font-normal text-slate-400 ml-1">incl. GST</span>
        </div>
        <Link to={`/bookings/${booking._id}`}
          className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors">
          View Details <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  )
}
