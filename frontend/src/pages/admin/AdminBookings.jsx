import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { Search, RefreshCw, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { StatusBadge, Spinner, EmptyState, PageHeader } from '../../components/common/LoadingScreen'

const STATUS_OPTIONS = ['', 'pending', 'assigned', 'confirmed', 'in_progress', 'completed', 'cancelled']
const STATUS_TRANSITIONS = {
  pending: ['assigned', 'cancelled'],
  assigned: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed'],
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState([])
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [assignModal, setAssignModal] = useState(null) // { bookingId }
  const [selectedWorker, setSelectedWorker] = useState('')
  const [assigning, setAssigning] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 15 })
      if (filterStatus) params.append('status', filterStatus)
      const [bookingsRes, workersRes] = await Promise.all([
        api.get(`/admin/bookings?${params.toString()}`),
        api.get('/admin/workers?availability=available&limit=50'),
      ])
      setBookings(bookingsRes.data.data.bookings)
      setPagination(bookingsRes.data.data.pagination)
      setWorkers(workersRes.data.data.workers)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [filterStatus, page])

  useEffect(() => { fetchData() }, [fetchData])

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await api.put(`/admin/bookings/${bookingId}/status`, { status: newStatus })
      toast.success(`Status updated to ${newStatus}`)
      fetchData()
    } catch (err) { toast.error(err.userMessage || 'Failed to update status') }
  }

  const handleAssignWorker = async () => {
    if (!selectedWorker) { toast.error('Please select a worker'); return }
    setAssigning(true)
    try {
      await api.put(`/admin/bookings/${assignModal}/assign-worker`, { workerId: selectedWorker })
      toast.success('Worker assigned & SMS sent!')
      setAssignModal(null)
      setSelectedWorker('')
      fetchData()
    } catch (err) { toast.error(err.userMessage || 'Assignment failed') }
    finally { setAssigning(false) }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Bookings"
        subtitle={`${pagination?.total ?? 0} total bookings`}
        action={
          <button onClick={fetchData} className="btn-secondary text-sm flex items-center gap-2">
            <RefreshCw size={14} /> Refresh
          </button>
        }
      />

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-5">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => { setFilterStatus(s); setPage(1) }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filterStatus === s ? 'bg-brand-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300'
            }`}
          >
            {s === '' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : bookings.length === 0 ? (
        <EmptyState icon="📋" title="No bookings found" description="Try changing the status filter" />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Booking ID', 'Customer', 'Service', 'Date', 'Worker', 'Amount', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {bookings.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-slate-500">#{b.bookingId}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 whitespace-nowrap">{b.customer?.name}</p>
                        <p className="text-xs text-slate-400">{b.customer?.phone || b.customer?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span>{b.service?.icon}</span>
                          <span className="whitespace-nowrap text-slate-700">{b.service?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 text-xs">
                        {format(new Date(b.scheduledDate), 'dd MMM yy')}<br />
                        {b.scheduledTime}
                      </td>
                      <td className="px-4 py-3">
                        {b.worker ? (
                          <span className="text-slate-700 whitespace-nowrap">{b.worker.name}</span>
                        ) : (
                          <button
                            onClick={() => { setAssignModal(b._id); setSelectedWorker('') }}
                            className="flex items-center gap-1 text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full hover:bg-brand-100 transition-colors whitespace-nowrap"
                          >
                            <UserCheck size={12} /> Assign
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        ₹{b.pricing?.totalAmount?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="px-4 py-3">
                        {STATUS_TRANSITIONS[b.status] && (
                          <select
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-400"
                            value=""
                            onChange={(e) => e.target.value && handleStatusChange(b._id, e.target.value)}
                          >
                            <option value="">Update...</option>
                            {STATUS_TRANSITIONS[b.status].map((s) => (
                              <option key={s} value={s}>{s.replace('_', ' ')}</option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-5">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-secondary text-sm py-2 px-4 disabled:opacity-40">← Prev</button>
              <span className="text-sm text-slate-500 flex items-center px-2">
                {page} / {pagination.pages}
              </span>
              <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                className="btn-secondary text-sm py-2 px-4 disabled:opacity-40">Next →</button>
            </div>
          )}
        </>
      )}

      {/* Assign worker modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
          <div className="card p-6 max-w-sm w-full animate-slide-up">
            <h3 className="font-display font-bold text-lg text-slate-900 mb-4">Assign Worker</h3>
            <p className="text-sm text-slate-500 mb-4">Select an available worker. An SMS notification will be sent to the worker.</p>
            <select
              className="input-field mb-4"
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
            >
              <option value="">-- Select Worker --</option>
              {workers.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name} · {w.skills.join(', ')} · {w.location.area} · ★{w.rating.average}
                </option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setAssignModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleAssignWorker} disabled={assigning}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                {assigning ? <Spinner size="sm" /> : <UserCheck size={14} />} Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
