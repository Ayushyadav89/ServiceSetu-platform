import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, RefreshCw, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { Spinner, EmptyState, PageHeader, StarRating, ConfirmModal } from '../../components/common/LoadingScreen'

const SKILL_OPTIONS = ['plumber', 'electrician', 'carpenter', 'painter', 'laborer', 'cleaner', 'ac_technician', 'pest_control']
const AVAILABILITY_COLORS = {
  available: 'bg-green-100 text-green-700',
  busy: 'bg-amber-100 text-amber-700',
  offline: 'bg-slate-100 text-slate-600',
}

const emptyForm = { name: '', phone: '', skills: [], experience: 0, location: { area: '', city: 'Kanpur', pincode: '' } }

export default function AdminWorkers() {
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editWorker, setEditWorker] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteModal, setDeleteModal] = useState(null)
  const [filterAvail, setFilterAvail] = useState('')
  const [filterSkill, setFilterSkill] = useState('')

  const fetchWorkers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: 50 })
      if (filterAvail) params.append('availability', filterAvail)
      if (filterSkill) params.append('skill', filterSkill)
      const { data } = await api.get(`/admin/workers?${params.toString()}`)
      setWorkers(data.data.workers)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [filterAvail, filterSkill])

  useEffect(() => { fetchWorkers() }, [fetchWorkers])

  const openAdd = () => { setForm(emptyForm); setEditWorker(null); setShowForm(true) }
  const openEdit = (w) => {
    setForm({ name: w.name, phone: w.phone, skills: w.skills, experience: w.experience, location: w.location })
    setEditWorker(w._id)
    setShowForm(true)
  }

  const handleSkillToggle = (skill) => {
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(skill) ? f.skills.filter((s) => s !== skill) : [...f.skills, skill],
    }))
  }

  const handleSave = async () => {
    if (!form.name || !form.phone || form.skills.length === 0) {
      toast.error('Name, phone and at least one skill are required')
      return
    }
    if (!/^[6-9]\d{9}$/.test(form.phone)) { toast.error('Enter a valid Indian phone number'); return }
    if (!/^\d{6}$/.test(form.location.pincode)) { toast.error('Enter a valid 6-digit pincode'); return }

    setSaving(true)
    try {
      if (editWorker) {
        await api.put(`/admin/workers/${editWorker}`, form)
        toast.success('Worker updated successfully')
      } else {
        await api.post('/admin/workers', form)
        toast.success('Worker registered successfully')
      }
      setShowForm(false)
      fetchWorkers()
    } catch (err) { toast.error(err.userMessage || 'Save failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/workers/${deleteModal}`)
      toast.success('Worker deactivated')
      setDeleteModal(null)
      fetchWorkers()
    } catch (err) { toast.error(err.userMessage || 'Delete failed') }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Workers"
        subtitle={`${workers.length} registered workers`}
        action={
          <button onClick={openAdd} className="btn-primary text-sm flex items-center gap-2">
            <Plus size={15} /> Add Worker
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select className="input-field text-sm w-40" value={filterAvail} onChange={(e) => setFilterAvail(e.target.value)}>
          <option value="">All Availability</option>
          <option value="available">Available</option>
          <option value="busy">Busy</option>
          <option value="offline">Offline</option>
        </select>
        <select className="input-field text-sm w-44" value={filterSkill} onChange={(e) => setFilterSkill(e.target.value)}>
          <option value="">All Skills</option>
          {SKILL_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <button onClick={fetchWorkers} className="btn-secondary text-sm flex items-center gap-2">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Workers grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : workers.length === 0 ? (
        <EmptyState icon="👷" title="No workers found" description="Add your first worker to get started"
          action={<button onClick={openAdd} className="btn-primary text-sm">Add Worker</button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {workers.map((w) => (
            <div key={w._id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center font-bold text-brand-600">
                    {w.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{w.name}</p>
                    <a href={`tel:${w.phone}`} className="flex items-center gap-1 text-xs text-slate-500 hover:text-brand-600">
                      <Phone size={11} /> {w.phone}
                    </a>
                  </div>
                </div>
                <span className={`status-badge ${AVAILABILITY_COLORS[w.availability]} capitalize`}>
                  {w.availability}
                </span>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1 mb-3">
                {w.skills.map((s) => (
                  <span key={s} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">
                    {s.replace('_', ' ')}
                  </span>
                ))}
              </div>

              {/* Stats row */}
              <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                <span>📍 {w.location.area}, {w.location.city}</span>
                <StarRating rating={w.rating.average} count={w.rating.count} />
              </div>
              <div className="text-xs text-slate-400">
                {w.experience} yr exp · {w.totalJobsCompleted} jobs completed
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                <button onClick={() => openEdit(w)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 py-2 rounded-xl transition-colors">
                  <Edit2 size={13} /> Edit
                </button>
                <button onClick={() => setDeleteModal(w._id)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 py-2 rounded-xl transition-colors">
                  <Trash2 size={13} /> Deactivate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in overflow-y-auto">
          <div className="card p-6 max-w-lg w-full my-4 animate-slide-up">
            <h3 className="font-display font-bold text-lg text-slate-900 mb-5">
              {editWorker ? 'Edit Worker' : 'Register New Worker'}
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
                  <input className="input-field text-sm" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ramesh Kumar" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone *</label>
                  <input className="input-field text-sm" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" maxLength={10} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Skills * (select all that apply)</label>
                <div className="flex flex-wrap gap-2">
                  {SKILL_OPTIONS.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleSkillToggle(skill)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all capitalize ${
                        form.skills.includes(skill)
                          ? 'bg-brand-500 border-brand-500 text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-brand-400'
                      }`}
                    >
                      {skill.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Years of Experience</label>
                <input type="number" className="input-field text-sm" value={form.experience} min={0}
                  onChange={(e) => setForm({ ...form, experience: Number(e.target.value) })} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Area *</label>
                  <input className="input-field text-sm" value={form.location.area}
                    onChange={(e) => setForm({ ...form, location: { ...form.location, area: e.target.value } })}
                    placeholder="Govind Nagar" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">City *</label>
                  <input className="input-field text-sm" value={form.location.city}
                    onChange={(e) => setForm({ ...form, location: { ...form.location, city: e.target.value } })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Pincode *</label>
                  <input className="input-field text-sm" value={form.location.pincode} maxLength={6}
                    onChange={(e) => setForm({ ...form, location: { ...form.location, pincode: e.target.value } })}
                    placeholder="208006" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1" disabled={saving}>Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <Spinner size="sm" /> : null}
                {editWorker ? 'Save Changes' : 'Register Worker'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteModal}
        title="Deactivate Worker"
        message="Are you sure you want to deactivate this worker? They won't receive new jobs."
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(null)}
        confirmLabel="Deactivate"
        danger
      />
    </div>
  )
}
