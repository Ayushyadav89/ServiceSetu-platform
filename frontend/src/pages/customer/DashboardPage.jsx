import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import BookingCard from '../../components/customer/BookingCard'
import { Spinner, EmptyState } from '../../components/common/LoadingScreen'

const FILTER_TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    fetchBookings()
  }, [activeFilter, page])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 8 })
      if (activeFilter) params.append('status', activeFilter)
      const { data } = await api.get(`/bookings?${params.toString()}`)
      setBookings(data.data.bookings)
      setPagination(data.data.pagination)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Summary stats
  const stats = [
    { label: 'Total Bookings', value: pagination?.total ?? '—', icon: <Calendar size={18} />, color: 'text-blue-600 bg-blue-50' },
    { label: 'Completed', value: '—', icon: <CheckCircle size={18} />, color: 'text-green-600 bg-green-50' },
    { label: 'Pending', value: '—', icon: <Clock size={18} />, color: 'text-amber-600 bg-amber-50' },
    { label: 'Cancelled', value: '—', icon: <XCircle size={18} />, color: 'text-red-600 bg-red-50' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
          <div>
            <h1 className="section-title">My Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Welcome back, <strong>{user?.name?.split(' ')[0]}</strong> 👋</p>
          </div>
          <Link to="/services" className="btn-primary flex items-center gap-2 text-sm self-start">
            <Plus size={16} /> Book a Service
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          {stats.map((s) => (
            <div key={s.label} className="card p-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                {s.icon}
              </div>
              <div className="font-display font-bold text-2xl text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-5 -mx-1 px-1">
          {FILTER_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setActiveFilter(t.key); setPage(1) }}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeFilter === t.key
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Bookings list */}
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : bookings.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No bookings yet"
            description={activeFilter ? `No ${activeFilter} bookings found` : "You haven't made any bookings yet. Book your first service today!"}
            action={
              !activeFilter && (
                <Link to="/services" className="btn-primary text-sm">Browse Services</Link>
              )
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookings.map((b) => (
                <BookingCard key={b._id} booking={b} />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-7">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary text-sm py-2 px-4 disabled:opacity-40"
                >
                  ← Prev
                </button>
                <span className="text-sm text-slate-500">
                  Page {page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="btn-secondary text-sm py-2 px-4 disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
