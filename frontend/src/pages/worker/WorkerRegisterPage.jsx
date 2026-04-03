import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useWorkerAuth } from '../../context/WorkerAuthContext'
import { Spinner } from '../../components/common/LoadingScreen'

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

const STEPS = ['Account', 'Skills & Experience', 'Location', 'Review']

export default function WorkerRegisterPage() {
  const { workerRegister } = useWorkerAuth()
  const navigate = useNavigate()
  const [step, setStep]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [error, setError]     = useState('')

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    skills: [], experience: 0, bio: '',
    location: { area: '', city: '', pincode: '', state: 'Uttar Pradesh' },
    workingHours: { start: '08:00', end: '20:00' },
  })

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))
  const setLoc = (key, val) => setForm((f) => ({ ...f, location: { ...f.location, [key]: val } }))

  const toggleSkill = (skill) =>
    set('skills', form.skills.includes(skill)
      ? form.skills.filter((s) => s !== skill)
      : [...form.skills, skill])

  const validateStep = () => {
    setError('')
    if (step === 1) {
      if (!form.name || form.name.length < 2) return setError('Please enter your full name') || false
      if (!form.email.match(/^\S+@\S+\.\S+$/)) return setError('Enter a valid email') || false
      if (!form.phone.match(/^[6-9]\d{9}$/)) return setError('Enter a valid 10-digit Indian phone number') || false
      if (form.password.length < 6) return setError('Password must be at least 6 characters') || false
    }
    if (step === 2) {
      if (form.skills.length === 0) return setError('Please select at least one skill') || false
    }
    if (step === 3) {
      if (!form.location.area) return setError('Please enter your area / locality') || false
      if (!form.location.city) return setError('Please enter your city') || false
      if (!/^\d{6}$/.test(form.location.pincode)) return setError('Enter a valid 6-digit pincode') || false
    }
    return true
  }

  const handleNext = () => { if (validateStep()) setStep((s) => s + 1) }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await workerRegister(form)
      toast.success('Profile created! Welcome to ServiceSetu 🎉')
      navigate('/worker/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-lg mx-auto px-4">

        {/* Header */}
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl text-slate-900 mb-8">
          <span>🔧</span> Service<span className="text-brand-500">Setu</span>
        </Link>

        <div className="mb-6">
          <h1 className="section-title">Create Worker Profile</h1>
          <p className="text-slate-500 text-sm mt-1">Join our network and start receiving job requests</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-7">
          {STEPS.map((label, i) => {
            const num = i + 1
            const done = num < step
            const active = num === step
            return (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className={`flex items-center gap-1.5 ${active ? 'text-brand-600' : done ? 'text-green-600' : 'text-slate-400'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    active ? 'bg-brand-500 text-white' : done ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {done ? '✓' : num}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-2 ${done ? 'bg-green-400' : 'bg-slate-200'}`} />}
              </div>
            )
          })}
        </div>

        <div className="card p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          {/* Step 1: Account */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="font-display font-bold text-lg text-slate-900 mb-1">Account Details</h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input className="input-field" value={form.name}
                  onChange={(e) => set('name', e.target.value)} placeholder="Ramesh Kumar" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input type="email" className="input-field" value={form.email}
                  onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                <input type="tel" className="input-field" value={form.phone} maxLength={10}
                  onChange={(e) => set('phone', e.target.value.replace(/\D/g, ''))} placeholder="9876543210" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} className="input-field pr-11"
                    value={form.password} onChange={(e) => set('password', e.target.value)}
                    placeholder="At least 6 characters" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Skills */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="font-display font-bold text-lg text-slate-900 mb-4">Skills & Experience</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Your Skills * (choose all that apply)</label>
                <div className="grid grid-cols-2 gap-2">
                  {SKILL_OPTIONS.map((opt) => (
                    <button key={opt.value} type="button" onClick={() => toggleSkill(opt.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        form.skills.includes(opt.value)
                          ? 'bg-brand-500 border-brand-500 text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-brand-400'
                      }`}>
                      <span>{opt.icon}</span> {opt.label}
                      {form.skills.includes(opt.value) && <CheckCircle size={14} className="ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Years of Experience</label>
                <input type="number" min="0" max="50" className="input-field" value={form.experience}
                  onChange={(e) => set('experience', Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  About You <span className="text-slate-400 text-xs">(optional)</span>
                </label>
                <textarea rows={3} className="input-field resize-none" value={form.bio}
                  onChange={(e) => set('bio', e.target.value)}
                  placeholder="Brief description of your work, specializations..." />
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="animate-fade-in">
              <h2 className="font-display font-bold text-lg text-slate-900 mb-4">Your Location</h2>
              <p className="text-sm text-slate-500 mb-4">
                Customers search by area and city — be accurate so you appear in the right searches.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Area / Locality *</label>
                  <input className="input-field" value={form.location.area}
                    onChange={(e) => setLoc('area', e.target.value)}
                    placeholder="e.g. Govind Nagar, Kidwai Nagar" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                    <input className="input-field" value={form.location.city}
                      onChange={(e) => setLoc('city', e.target.value)} placeholder="Kanpur" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pincode *</label>
                    <input className="input-field" value={form.location.pincode} maxLength={6}
                      onChange={(e) => setLoc('pincode', e.target.value.replace(/\D/g, ''))}
                      placeholder="208006" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                  <input className="input-field" value={form.location.state}
                    onChange={(e) => setLoc('state', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Work Start Time</label>
                    <input type="time" className="input-field" value={form.workingHours.start}
                      onChange={(e) => set('workingHours', { ...form.workingHours, start: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Work End Time</label>
                    <input type="time" className="input-field" value={form.workingHours.end}
                      onChange={(e) => set('workingHours', { ...form.workingHours, end: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="animate-fade-in">
              <h2 className="font-display font-bold text-lg text-slate-900 mb-4">Review Your Profile</h2>
              <div className="space-y-3 text-sm">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">ACCOUNT</p>
                  <p className="font-semibold text-slate-900">{form.name}</p>
                  <p className="text-slate-600">{form.email} · {form.phone}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-2">SKILLS</p>
                  <div className="flex flex-wrap gap-1.5">
                    {form.skills.map((s) => (
                      <span key={s} className="bg-brand-100 text-brand-700 text-xs px-2.5 py-1 rounded-full capitalize">
                        {SKILL_OPTIONS.find((o) => o.value === s)?.icon} {s.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                  <p className="text-slate-600 mt-2">{form.experience} years experience</p>
                  {form.bio && <p className="text-slate-500 text-xs mt-1 italic">"{form.bio}"</p>}
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">LOCATION</p>
                  <p className="font-semibold text-slate-900">
                    {form.location.area}, {form.location.city} – {form.location.pincode}
                  </p>
                  <p className="text-slate-600 text-xs mt-0.5">
                    Working hours: {form.workingHours.start} – {form.workingHours.end}
                  </p>
                </div>
              </div>

              <div className="mt-5 p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700">
                ✅ After registration, customers searching for your area + skills will see your profile immediately.
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button onClick={() => setStep((s) => s - 1)} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                <ArrowLeft size={15} /> Back
              </button>
            )}
            {step < 4 ? (
              <button onClick={handleNext} className="btn-primary flex-1 flex items-center justify-center gap-2">
                Continue <ArrowRight size={15} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                {loading ? <Spinner size="sm" /> : '🚀 Create My Profile'}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          Already have a worker account?{' '}
          <Link to="/worker/login" className="text-brand-600 font-semibold hover:underline">Sign in</Link>
        </p>
        <p className="text-center text-sm text-slate-500 mt-2">
          Looking to book a service?{' '}
          <Link to="/login" className="text-brand-600 font-semibold hover:underline">Customer login</Link>
        </p>
      </div>
    </div>
  )
}