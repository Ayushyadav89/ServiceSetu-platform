import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { RefreshCw, Phone, Mail } from 'lucide-react'
import api from '../../services/api'
import { Spinner, EmptyState, PageHeader } from '../../components/common/LoadingScreen'

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/customers?page=${page}&limit=20`)
      setCustomers(data.data.customers)
      setPagination(data.data.pagination)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchCustomers() }, [page])

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Customers"
        subtitle={`${pagination?.total ?? 0} registered customers`}
        action={
          <button onClick={fetchCustomers} className="btn-secondary text-sm flex items-center gap-2">
            <RefreshCw size={14} /> Refresh
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : customers.length === 0 ? (
        <EmptyState icon="👥" title="No customers yet" description="Customers will appear here once they register." />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Customer', 'Email', 'Phone', 'City', 'Joined', 'Status'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {customers.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-xs flex-shrink-0">
                            {c.name[0]}
                          </div>
                          <span className="font-medium text-slate-900">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="flex items-center gap-1">
                          <Mail size={12} className="text-slate-400" /> {c.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {c.phone ? (
                          <div className="flex items-center gap-1">
                            <Phone size={12} className="text-slate-400" /> {c.phone}
                          </div>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {c.address?.city || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {format(new Date(c.createdAt), 'dd MMM yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`status-badge ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-5">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-secondary text-sm py-2 px-4 disabled:opacity-40">← Prev</button>
              <span className="text-sm text-slate-500 flex items-center px-2">{page} / {pagination.pages}</span>
              <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                className="btn-secondary text-sm py-2 px-4 disabled:opacity-40">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
