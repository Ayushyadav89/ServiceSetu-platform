import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { Briefcase, CheckCircle, Clock, MapPin, Phone, Edit2, ToggleLeft, ToggleRight, IndianRupee } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useWorkerAuth } from '../../context/WorkerAuthContext'
import { Spinner, StatusBadge, EmptyState } from '../../components/common/LoadingScreen'
import PricingPreviewWidget from '../../components/wroker/PricingPreviewWidget'

const SKILL_OPTIONS = [
  { value: 'plumber',       label: 'Plumber',       icon: '🔧' },
  { value: 'electrician',   label: 'Electrician',   icon: '⚡' },
  { value: 'carpenter',     label: 'Carpenter',     icon: '🪑' },
  { value: 'painter',       label: 'Painter',       icon: '🎨' },
  { value: 'cleaner',       label: 'Cleaner',       icon: '🧹' },
  { value: 'ac_technician', label: 'AC Technician', icon: '❄️' },
  { value: 'laborer',       label: 'Laborer',       icon: '💪' },
  { value: 'pest_control',  label: 'Pest Control',  icon: '🐛' },
]

const AVAIL_COLOR = {
  available: 'bg-green-100 text-green-700',
  busy:      'bg-amber-100 text-amber-700',
  offline:   'bg-slate-100 text-slate-600',
}

export default function WorkerDashboardPage() {
  const { worker, workerLogout, refreshWorker, getWorkerHeaders } = useWorkerAuth()
  const [stats, setStats]           = useState(null)
  const [bookings, setBookings]     = useState([])
  const [loadingStats, setLoadingStats]     = useState(true)
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [activeTab, setActiveTab]   = useState('overview')
  const [editMode, setEditMode]     = useState(false)
  const [saving, setSaving]         = useState(false)
  const [editForm, setEditForm]     = useState(null)

  useEffect(() => { fetchStats(); fetchBookings() }, [])
  useEffect(() => { if (worker) setEditForm({ ...worker }) }, [worker])

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/workers/me/stats', { headers: getWorkerHeaders() })
      setStats(data.data.stats)
    } catch { /* ignore */ }
    finally { setLoadingStats(false) }
  }

  const fetchBookings = async () => {
    try {
      const { data } = await api.get('/workers/me/bookings', { headers: getWorkerHeaders() })
      setBookings(data.data.bookings)
    } catch { /* ignore */ }
    finally { setLoadingBookings(false) }
  }

  const toggleAvailability = async () => {
    const next = worker.availability === 'available' ? 'offline' : 'available'
    try {
      await api.put('/workers/me', { availability: next }, { headers: getWorkerHeaders() })
      await refreshWorker()
      toast.success(`You are now ${next}`)
    } catch { toast.error('Failed to update availability') }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await api.put('/workers/me', {
        name: editForm.name, bio: editForm.bio, skills: editForm.skills,
        experience: editForm.experience, location: editForm.location, workingHours: editForm.workingHours,
      }, { headers: getWorkerHeaders() })
      await refreshWorker()
      toast.success('Profile updated!')
      setEditMode(false)
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed') }
    finally { setSaving(false) }
  }

  const toggleSkill = (skill) => {
    setEditForm((f) => ({
      ...f,
      skills: f.skills.includes(skill) ? f.skills.filter((s) => s !== skill) : [...f.skills, skill],
    }))
  }

  if (!worker) return null

  const TABS = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'bookings', label: '📋 My Jobs' },
    { key: 'pricing',  label: '💰 My Pricing' },
    { key: 'profile',  label: '👤 Profile' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg text-slate-900">
            <span>🔧</span> Service<span className="text-brand-500">Setu</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${AVAIL_COLOR[worker.availability]}`}>
              {worker.availability}
            </div>
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
              {worker.name[0]}
            </div>
            <button onClick={workerLogout} className="text-xs text-slate-500 hover:text-red-500 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-7">

        {/* Welcome + toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
          <div>
            <h1 className="section-title">Welcome, {worker.name.split(' ')[0]} 👷</h1>
            <p className="text-slate-500 text-sm mt-1">📍 {worker.location?.area}, {worker.location?.city}</p>
          </div>
          <button onClick={toggleAvailability}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all self-start ${
              worker.availability === 'available'
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}>
            {worker.availability === 'available'
              ? <><ToggleRight size={18} /> Online — Accepting Jobs</>
              : <><ToggleLeft size={18} /> Go Online</>
            }
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 p-1 rounded-xl w-fit mb-6 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === t.key ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in">
            {loadingStats ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Total Jobs',  value: stats?.totalBookings ?? 0, icon: <Briefcase size={18} />,    color: 'text-blue-600 bg-blue-50'    },
                    { label: 'Completed',   value: stats?.completed ?? 0,     icon: <CheckCircle size={18} />,  color: 'text-green-600 bg-green-50'  },
                    { label: 'Pending',     value: stats?.pending ?? 0,       icon: <Clock size={18} />,        color: 'text-amber-600 bg-amber-50'  },
                    { label: 'Earnings',    value: `₹${((stats?.totalEarnings || 0)/1000).toFixed(1)}k`,
                      icon: <IndianRupee size={18} />, color: 'text-brand-600 bg-brand-50' },
                  ].map((s) => (
                    <div key={s.label} className="card p-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>{s.icon}</div>
                      <div className="font-display font-bold text-2xl text-slate-900">{s.value}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Rating + pricing summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="card p-5">
                    <h3 className="font-semibold text-slate-900 mb-3">Your Rating</h3>
                    <div className="flex items-center gap-4">
                      <div className="text-5xl font-display font-bold text-slate-900">
                        {stats?.rating?.average?.toFixed(1) || '0.0'}
                      </div>
                      <div>
                        <div className="text-amber-400 text-xl">
                          {'★'.repeat(Math.round(stats?.rating?.average || 0))}
                          {'☆'.repeat(5 - Math.round(stats?.rating?.average || 0))}
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">{stats?.rating?.count || 0} reviews</p>
                      </div>
                    </div>
                  </div>

                  <div className="card p-5">
                    <h3 className="font-semibold text-slate-900 mb-3">Your Pricing</h3>
                    {worker.pricing?.demandedPrice ? (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">You charge per visit</p>
                        <p className="font-display font-bold text-2xl text-brand-600">
                          ₹{worker.pricing.demandedPrice}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Customers pay ~₹{
                            Math.round(worker.pricing.demandedPrice +
                              worker.pricing.demandedPrice * 0.20 + 20 +
                              (worker.pricing.demandedPrice * 0.20 + 20) * 0.18)
                          } total (incl. fees)
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-slate-500 mb-2">No pricing set yet</p>
                        <button onClick={() => setActiveTab('pricing')} className="btn-outline text-xs py-1.5">
                          Set My Price →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── BOOKINGS ── */}
        {activeTab === 'bookings' && (
          <div className="animate-fade-in">
            {loadingBookings ? <div className="flex justify-center py-12"><Spinner size="lg" /></div>
            : bookings.length === 0 ? (
              <EmptyState icon="📋" title="No jobs yet" description="Your assigned jobs will appear here" />
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div key={b._id} className="card p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-xl flex-shrink-0">
                        {b.service?.icon || '🔧'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900 text-sm truncate">{b.service?.name}</p>
                          <StatusBadge status={b.status} />
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">#{b.bookingId}</p>
                        <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-500">
                          <span>📅 {format(new Date(b.scheduledDate), 'dd MMM yyyy')} · {b.scheduledTime}</span>
                          <span>👤 {b.customer?.name}</span>
                          {b.customer?.phone && (
                            <a href={`tel:${b.customer.phone}`}
                              className="flex items-center gap-1 text-brand-600 font-medium">
                              <Phone size={11} /> {b.customer.phone}
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-slate-900 text-sm">
                          ₹{b.pricing?.totalAmount?.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-green-600">
                          You earn ₹{b.pricing?.workerPrice || b.pricing?.baseAmount}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PRICING ── */}
        {activeTab === 'pricing' && (
          <div className="animate-fade-in">
            <div className="mb-5">
              <h2 className="font-display font-bold text-lg text-slate-900 mb-1">My Pricing</h2>
              <p className="text-slate-500 text-sm">
                Set your price and see exactly what the customer will be charged.
              </p>
            </div>
            <PricingPreviewWidget
              worker={worker}
              refreshWorker={refreshWorker}
              getWorkerHeaders={getWorkerHeaders}
            />
          </div>
        )}

        {/* ── PROFILE ── */}
        {activeTab === 'profile' && editForm && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display font-bold text-lg text-slate-900">My Profile</h2>
              <button onClick={() => { setEditMode(!editMode); setEditForm({ ...worker }) }}
                className="btn-secondary text-sm flex items-center gap-2">
                <Edit2 size={14} /> {editMode ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            <div className="card p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Full Name</label>
                  {editMode
                    ? <input className="input-field text-sm" value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                    : <p className="font-semibold text-slate-900">{worker.name}</p>
                  }
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Phone</label>
                  <p className="text-slate-700">{worker.phone}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">About</label>
                {editMode
                  ? <textarea rows={3} className="input-field text-sm resize-none" value={editForm.bio || ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                      placeholder="Brief description about your work..." />
                  : <p className="text-slate-600 text-sm">{worker.bio || 'No bio added yet.'}</p>
                }
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Skills</label>
                {editMode ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {SKILL_OPTIONS.map((opt) => (
                      <button key={opt.value} type="button" onClick={() => toggleSkill(opt.value)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                          editForm.skills.includes(opt.value)
                            ? 'bg-brand-500 border-brand-500 text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-brand-400'
                        }`}>
                        {opt.icon} {opt.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {worker.skills?.map((s) => (
                      <span key={s} className="bg-brand-50 text-brand-700 text-sm px-3 py-1 rounded-full capitalize">
                        {SKILL_OPTIONS.find((o) => o.value === s)?.icon} {s.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Experience</label>
                {editMode
                  ? <input type="number" min="0" className="input-field text-sm w-32" value={editForm.experience}
                      onChange={(e) => setEditForm((f) => ({ ...f, experience: Number(e.target.value) }))} />
                  : <p className="text-slate-700">{worker.experience} years</p>
                }
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Location</label>
                {editMode ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { key: 'area',    label: 'Area',    placeholder: 'Govind Nagar' },
                      { key: 'city',    label: 'City',    placeholder: 'Kanpur' },
                      { key: 'pincode', label: 'Pincode', placeholder: '208006' },
                    ].map((f) => (
                      <div key={f.key}>
                        <label className="text-xs text-slate-500 mb-1 block">{f.label}</label>
                        <input className="input-field text-sm" value={editForm.location?.[f.key] || ''}
                          placeholder={f.placeholder}
                          onChange={(e) => setEditForm((ef) => ({ ...ef, location: { ...ef.location, [f.key]: e.target.value } }))} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="flex items-center gap-1.5 text-slate-700">
                    <MapPin size={14} className="text-brand-500" />
                    {worker.location?.area}, {worker.location?.city} – {worker.location?.pincode}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Working Hours</label>
                {editMode ? (
                  <div className="flex gap-3 items-center">
                    <input type="time" className="input-field text-sm w-36" value={editForm.workingHours?.start || '08:00'}
                      onChange={(e) => setEditForm((f) => ({ ...f, workingHours: { ...f.workingHours, start: e.target.value } }))} />
                    <span className="text-slate-400 text-sm">to</span>
                    <input type="time" className="input-field text-sm w-36" value={editForm.workingHours?.end || '20:00'}
                      onChange={(e) => setEditForm((f) => ({ ...f, workingHours: { ...f.workingHours, end: e.target.value } }))} />
                  </div>
                ) : (
                  <p className="text-slate-700">
                    {worker.workingHours?.start || '08:00'} – {worker.workingHours?.end || '20:00'}
                  </p>
                )}
              </div>

              {editMode && (
                <button onClick={handleSaveProfile} disabled={saving}
                  className="btn-primary flex items-center gap-2">
                  {saving ? <Spinner size="sm" /> : null} Save Changes
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}