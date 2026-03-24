import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Search, MapPin, Shield, Clock, Star, ArrowRight, ChevronRight } from 'lucide-react'
import api from '../../services/api'
import { Spinner } from '../../components/common/LoadingScreen'
import ServiceCard from '../../components/customer/ServiceCard'

const CATEGORIES = [
  { key: 'plumber',      label: 'Plumber',       icon: '🔧', color: 'bg-blue-50   text-blue-600' },
  { key: 'electrician',  label: 'Electrician',   icon: '⚡', color: 'bg-yellow-50 text-yellow-600' },
  { key: 'carpenter',    label: 'Carpenter',     icon: '🪑', color: 'bg-amber-50  text-amber-600' },
  { key: 'painter',      label: 'Painter',       icon: '🎨', color: 'bg-pink-50   text-pink-600' },
  { key: 'cleaner',      label: 'Cleaner',       icon: '🧹', color: 'bg-green-50  text-green-600' },
  { key: 'ac_technician',label: 'AC Technician', icon: '❄️', color: 'bg-cyan-50   text-cyan-600' },
  { key: 'laborer',      label: 'Laborer',       icon: '💪', color: 'bg-orange-50 text-orange-600' },
  { key: 'pest_control', label: 'Pest Control',  icon: '🐛', color: 'bg-lime-50   text-lime-600' },
]

const FEATURES = [
  { icon: '✅', title: 'Verified Workers', desc: 'All workers are background-checked and skill-verified.' },
  { icon: '⚡', title: 'Same-day Service', desc: 'Book now and get service as early as today.' },
  { icon: '💰', title: 'Transparent Pricing', desc: 'No hidden charges. Pay only what you see.' },
  { icon: '🌟', title: '4.8★ Rated', desc: 'Thousands of satisfied customers across the city.' },
]

const TESTIMONIALS = [
  { name: 'Priya S.', city: 'Kanpur', rating: 5, text: 'Got a plumber within 2 hours. Excellent service, very professional!', service: 'Plumbing' },
  { name: 'Rohit M.', city: 'Kanpur', rating: 5, text: 'The electrician fixed our wiring issue quickly. Highly recommended.', service: 'Electrical' },
  { name: 'Sunita K.', city: 'Kanpur', rating: 4, text: 'Deep cleaning was thorough. My house feels brand new. Worth it!', service: 'Cleaning' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [popularServices, setPopularServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState(null)

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data } = await api.get('/services')
        setPopularServices(data.data.services.slice(0, 6))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchServices()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/services?search=${encodeURIComponent(searchQuery)}`)
  }

  const filteredServices = activeCategory
    ? popularServices.filter((s) => s.category === activeCategory)
    : popularServices

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-brand-700/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 text-xs font-medium px-3 py-1.5 rounded-full border border-white/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Trusted by 10,000+ customers in Kanpur
            </div>

            <h1 className="font-display font-extrabold text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-4">
              Home Services,<br />
              <span className="text-brand-400">On Demand.</span>
            </h1>
            <p className="text-slate-300 text-lg mb-8 max-w-xl">
              Book verified plumbers, electricians, carpenters and more — in minutes. Same-day availability across your city.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex gap-2 bg-white p-2 rounded-2xl shadow-xl max-w-lg">
              <div className="flex items-center gap-2 flex-1 px-2">
                <Search size={18} className="text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search plumber, electrician..."
                  className="flex-1 text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none text-sm"
                />
              </div>
              <button type="submit" className="btn-primary text-sm py-2.5 px-5 flex-shrink-0">
                Search
              </button>
            </form>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-4 mt-8">
              {[['🔧', '8+ Services'], ['👷', '100+ Workers'], ['⭐', '4.8 Rating'], ['📍', 'Kanpur Based']].map(([icon, label]) => (
                <div key={label} className="flex items-center gap-1.5 text-white/80 text-sm">
                  <span>{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORY PILLS ──────────────────────────────────── */}
      <section className="bg-white border-b border-slate-100 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === null ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Services
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(activeCategory === cat.key ? null : cat.key)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.key ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{cat.icon}</span> {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES GRID ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="section-title">Popular Services</h2>
            <p className="text-slate-500 text-sm mt-1">Most booked by customers in your area</p>
          </div>
          <Link to="/services" className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
            View all <ChevronRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No services found in this category.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredServices.map((service) => (
              <ServiceCard key={service._id} service={service} />
            ))}
          </div>
        )}
      </section>

      {/* ── WHY CHOOSE US ────────────────────────────────────── */}
      <section className="bg-white border-y border-slate-100 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="section-title">Why ServiceSetu?</h2>
            <p className="text-slate-500 mt-2 max-w-lg mx-auto">We connect you with skilled, verified local professionals — fast, affordable and reliable.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="text-center p-6 rounded-2xl bg-slate-50 hover:bg-brand-50 transition-colors group">
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="font-display font-bold text-slate-900 mb-1 group-hover:text-brand-700 transition-colors">{f.title}</h3>
                <p className="text-sm text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="section-title text-center mb-2">What Customers Say</h2>
        <p className="text-slate-500 text-center mb-8">Real reviews from real people</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="card p-5">
              <div className="flex items-center gap-1 text-amber-400 mb-2 text-sm">
                {'★'.repeat(t.rating)}
              </div>
              <p className="text-slate-600 text-sm mb-4 italic">"{t.text}"</p>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{t.name}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin size={10} /> {t.city}
                  </div>
                </div>
                <span className="text-xs text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">{t.service}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-brand-500 to-brand-600 py-14">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="font-display font-extrabold text-3xl text-white mb-3">Ready to book a service?</h2>
          <p className="text-brand-100 mb-7">Get a verified professional at your door in under 2 hours.</p>
          <Link to="/services" className="inline-flex items-center gap-2 bg-white text-brand-600 font-bold px-8 py-3.5 rounded-2xl hover:bg-brand-50 transition-colors shadow-lg">
            Book Now <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-white font-display font-bold text-xl mb-2">
                <span>🔧</span> ServiceSetu
              </div>
              <p className="text-sm max-w-xs">Hyperlocal service marketplace connecting customers with skilled local professionals.</p>
            </div>
            <div className="flex gap-10 text-sm">
              <div>
                <div className="text-white font-semibold mb-2">Services</div>
                {['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Cleaning'].map((s) => (
                  <div key={s} className="hover:text-white cursor-pointer mb-1 transition-colors">{s}</div>
                ))}
              </div>
              <div>
                <div className="text-white font-semibold mb-2">Company</div>
                {['About', 'Contact', 'Careers', 'Privacy Policy'].map((s) => (
                  <div key={s} className="hover:text-white cursor-pointer mb-1 transition-colors">{s}</div>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-6 text-xs text-center">
            © {new Date().getFullYear()} ServiceSetu. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
