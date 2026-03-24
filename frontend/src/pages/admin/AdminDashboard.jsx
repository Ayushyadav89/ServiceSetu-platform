import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { TrendingUp, Users, Briefcase, IndianRupee, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import api from '../../services/api'
import { Spinner, StatusBadge } from '../../components/common/LoadingScreen'

const StatCard = ({ label, value, icon, color, sub }) => (
  <div className="card p-5">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      {sub && <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{sub}</span>}
    </div>
    <div className="font-display font-extrabold text-2xl text-slate-900 mb-0.5">{value}</div>
    <div className="text-sm text-slate-500">{label}</div>
  </div>
)

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/analytics').then(({ data }) => {
      setData(data.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!data) return null

  const { stats, topServices, recentBookings } = data

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="section-title">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Overview as of {format(new Date(), 'dd MMM yyyy, hh:mm a')}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCard label="Total Bookings" value={stats.totalBookings} icon={<Briefcase size={18} />} color="text-blue-600 bg-blue-50" />
        <StatCard label="This Month" value={stats.monthBookings} icon={<TrendingUp size={18} />} color="text-brand-600 bg-brand-50" sub={`${stats.bookingGrowth > 0 ? '+' : ''}${stats.bookingGrowth}%`} />
        <StatCard label="Total Customers" value={stats.totalCustomers} icon={<Users size={18} />} color="text-purple-600 bg-purple-50" />
        <StatCard label="Revenue (Paid)" value={`₹${(stats.totalRevenue / 1000).toFixed(1)}k`} icon={<IndianRupee size={18} />} color="text-green-600 bg-green-50" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCard label="Pending" value={stats.pendingBookings} icon={<Clock size={18} />} color="text-amber-600 bg-amber-50" />
        <StatCard label="Completed" value={stats.completedBookings} icon={<CheckCircle size={18} />} color="text-green-600 bg-green-50" />
        <StatCard label="Total Workers" value={stats.totalWorkers} icon={<Users size={18} />} color="text-indigo-600 bg-indigo-50" />
        <StatCard label="Available Workers" value={stats.availableWorkers} icon={<AlertCircle size={18} />} color="text-teal-600 bg-teal-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent bookings */}
        <div className="lg:col-span-2 card">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-display font-bold text-slate-900">Recent Bookings</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {recentBookings.length === 0 ? (
              <p className="text-slate-400 text-sm p-5">No bookings yet.</p>
            ) : recentBookings.map((b) => (
              <div key={b._id} className="px-5 py-3.5 flex items-center gap-3">
                <span className="text-xl flex-shrink-0">{b.service?.icon || '🔧'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{b.service?.name}</p>
                  <p className="text-xs text-slate-500">{b.customer?.name} · {b.address?.area}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <StatusBadge status={b.status} />
                  <p className="text-xs text-slate-400 mt-1">{format(new Date(b.createdAt), 'dd MMM')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top services */}
        <div className="card">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-display font-bold text-slate-900">Top Services</h2>
          </div>
          <div className="p-4 space-y-3">
            {topServices.length === 0 ? (
              <p className="text-slate-400 text-sm">No data yet.</p>
            ) : topServices.map((s, i) => (
              <div key={s._id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                  {i + 1}
                </div>
                <span className="text-lg">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{s.name}</p>
                  <p className="text-xs text-slate-400">{s.count} bookings</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
