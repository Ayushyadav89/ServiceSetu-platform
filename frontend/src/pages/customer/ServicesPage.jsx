import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import api from '../../services/api'
import ServiceCard from '../../components/customer/ServiceCard'
import { Spinner, EmptyState } from '../../components/common/LoadingScreen'

const CATEGORIES = [
  { key: '',             label: 'All Services' },
  { key: 'plumber',      label: '🔧 Plumber' },
  { key: 'electrician',  label: '⚡ Electrician' },
  { key: 'carpenter',    label: '🪑 Carpenter' },
  { key: 'painter',      label: '🎨 Painter' },
  { key: 'cleaner',      label: '🧹 Cleaner' },
  { key: 'ac_technician',label: '❄️ AC Technician' },
  { key: 'laborer',      label: '💪 Laborer' },
]

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
]

export default function ServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [sort, setSort] = useState('popular')

  useEffect(() => {
    fetchServices()
  }, [category])

  const fetchServices = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      const { data } = await api.get(`/services?${params.toString()}`)
      setServices(data.data.services)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Client-side filtering + sorting
  const displayServices = services
    .filter((s) =>
      !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'price_asc') return a.basePrice - b.basePrice
      if (sort === 'price_desc') return b.basePrice - a.basePrice
      return b.popularity - a.popularity
    })

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="section-title mb-1">All Services</h1>
          <p className="text-slate-500 text-sm">Browse and book from our range of home services</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar filters */}
          <aside className="lg:w-56 flex-shrink-0">
            <div className="card p-4 sticky top-24">
              <h3 className="font-semibold text-slate-900 mb-3 text-sm">Categories</h3>
              <div className="space-y-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setCategory(cat.key)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                      category === cat.key
                        ? 'bg-brand-500 text-white font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1">
            {/* Search + Sort bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search services..."
                  className="input-field pl-9"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                )}
              </div>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-field sm:w-48">
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Results count */}
            {!loading && (
              <p className="text-sm text-slate-500 mb-4">
                {displayServices.length} service{displayServices.length !== 1 ? 's' : ''} found
                {category && ` in ${CATEGORIES.find(c => c.key === category)?.label}`}
              </p>
            )}

            {/* Grid */}
            {loading ? (
              <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            ) : displayServices.length === 0 ? (
              <EmptyState
                icon="🔍"
                title="No services found"
                description="Try adjusting your search or browse all categories"
                action={
                  <button onClick={() => { setSearch(''); setCategory('') }} className="btn-primary text-sm">
                    Clear filters
                  </button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {displayServices.map((s) => (
                  <ServiceCard key={s._id} service={s} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
