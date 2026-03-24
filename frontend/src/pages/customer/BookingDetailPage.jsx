import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, Phone, MapPin, Calendar, Clock, CreditCard, MessageSquare, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { StatusBadge, Spinner, ConfirmModal } from '../../components/common/LoadingScreen'

export default function BookingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelModal, setCancelModal] = useState(false)
  const [rating, setRating] = useState({ score: 0, review: '', submitting: false })
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    fetchBooking()
  }, [id])

  const fetchBooking = async () => {
    try {
      const { data } = await api.get(`/bookings/${id}`)
      setBooking(data.data.booking)
    } catch {
      toast.error('Booking not found')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await api.put(`/bookings/${id}/cancel`, { reason: 'Cancelled by customer' })
      toast.success('Booking cancelled')
      fetchBooking()
    } catch (err) {
      toast.error(err.userMessage || 'Failed to cancel')
    } finally {
      setCancelling(false)
      setCancelModal(false)
    }
  }

  const handleRate = async () => {
    if (!rating.score) { toast.error('Please select a rating'); return }
    setRating((r) => ({ ...r, submitting: true }))
    try {
      await api.post(`/bookings/${id}/rate`, { score: rating.score, review: rating.review })
      toast.success('Thanks for your feedback!')
      fetchBooking()
    } catch (err) {
      toast.error(err.userMessage || 'Failed to submit rating')
    } finally {
      setRating((r) => ({ ...r, submitting: false }))
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>
  if (!booking) return null

  const canCancel = ['pending', 'assigned'].includes(booking.status)
  const canRate = booking.status === 'completed' && !booking.rating?.score

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <button onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        {/* Header */}
        <div className="card p-5 mb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{booking.service?.icon}</span>
                <h1 className="font-display font-bold text-lg text-slate-900">{booking.service?.name}</h1>
              </div>
              <p className="text-xs text-slate-400 font-mono">#{booking.bookingId}</p>
            </div>
            <StatusBadge status={booking.status} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar size={14} className="text-brand-500" />
              {format(new Date(booking.scheduledDate), 'dd MMM yyyy')}
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Clock size={14} className="text-brand-500" />
              {booking.scheduledTime}
            </div>
            <div className="flex items-center gap-2 text-slate-600 col-span-2">
              <MapPin size={14} className="text-brand-500 flex-shrink-0" />
              {booking.address?.street}, {booking.address?.area}, {booking.address?.city} – {booking.address?.pincode}
            </div>
          </div>
        </div>

        {/* Worker info */}
        {booking.worker && (
          <div className="card p-5 mb-4">
            <h2 className="font-semibold text-slate-900 mb-3 text-sm">Assigned Worker</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                  {booking.worker.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{booking.worker.name}</p>
                  <div className="flex gap-1 text-xs">
                    {booking.worker.skills?.slice(0, 2).map((s) => (
                      <span key={s} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">
                        {s.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <a href={`tel:${booking.worker.phone}`}
                className="flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-green-100 transition-colors">
                <Phone size={14} /> Call
              </a>
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className="card p-5 mb-4">
          <h2 className="font-semibold text-slate-900 mb-3 text-sm">
            <CreditCard className="inline mr-1.5 text-brand-500" size={15} /> Payment
          </h2>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Base Amount</span>
              <span>₹{booking.pricing?.baseAmount?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST (18%)</span>
              <span>₹{booking.pricing?.taxAmount?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-2">
              <span>Total</span>
              <span className="text-brand-600">₹{booking.pricing?.totalAmount?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 pt-1">
              <span>Payment method</span>
              <span className="capitalize">{booking.payment?.method}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Status</span>
              <span className={`font-semibold ${booking.payment?.status === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                {booking.payment?.status === 'paid' ? '✅ Paid' : '⏳ Unpaid'}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {booking.customerNotes && (
          <div className="card p-4 mb-4">
            <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
              <MessageSquare size={12} /> Customer Notes
            </p>
            <p className="text-sm text-slate-700">{booking.customerNotes}</p>
          </div>
        )}

        {/* Rate booking */}
        {canRate && (
          <div className="card p-5 mb-4 border-2 border-amber-200 bg-amber-50">
            <h2 className="font-semibold text-slate-900 mb-3">⭐ Rate your experience</h2>
            <div className="flex gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating((r) => ({ ...r, score: star }))}
                  className={`text-3xl transition-transform hover:scale-110 ${star <= rating.score ? 'text-amber-400' : 'text-slate-300'}`}>
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={rating.review}
              onChange={(e) => setRating((r) => ({ ...r, review: e.target.value }))}
              rows={2} className="input-field text-sm mb-3 resize-none"
              placeholder="Share your experience (optional)..."
            />
            <button onClick={handleRate} disabled={rating.submitting}
              className="btn-primary text-sm flex items-center gap-2">
              {rating.submitting ? <Spinner size="sm" /> : <Star size={14} />}
              Submit Rating
            </button>
          </div>
        )}

        {/* Existing rating */}
        {booking.rating?.score && (
          <div className="card p-4 mb-4 bg-green-50 border border-green-200">
            <p className="text-sm font-semibold text-green-800 mb-1">
              {'★'.repeat(booking.rating.score)}{'☆'.repeat(5 - booking.rating.score)} You rated this {booking.rating.score}/5
            </p>
            {booking.rating.review && <p className="text-sm text-green-700 italic">"{booking.rating.review}"</p>}
          </div>
        )}

        {/* Cancel button */}
        {canCancel && (
          <button onClick={() => setCancelModal(true)}
            className="w-full border-2 border-red-200 text-red-500 hover:bg-red-50 font-semibold py-2.5 rounded-xl text-sm transition-colors">
            Cancel Booking
          </button>
        )}

        <ConfirmModal
          isOpen={cancelModal}
          title="Cancel Booking"
          message="Are you sure you want to cancel this booking? This action cannot be undone."
          onConfirm={handleCancel}
          onCancel={() => setCancelModal(false)}
          confirmLabel={cancelling ? 'Cancelling...' : 'Yes, Cancel'}
          danger
        />
      </div>
    </div>
  )
}
