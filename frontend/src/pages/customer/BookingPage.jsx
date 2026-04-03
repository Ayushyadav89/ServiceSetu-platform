import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Calendar, Clock, MapPin, CreditCard, CheckCircle, ArrowLeft, ArrowRight, Star, Phone, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, addDays } from 'date-fns'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../../components/common/LoadingScreen'
import PricingBreakdown from '../../components/common/PricingBreakdown'

const TIME_SLOTS = [
  '08:00 AM','09:00 AM','10:00 AM','11:00 AM',
  '12:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM','06:00 PM',
]

const STEPS = ['Service', 'Select Worker', 'Schedule', 'Address', 'Payment', 'Confirm']

// Pricing calculator (mirrors backend)
const calcPricing = (workerPrice) => {
  const wp = Math.round(workerPrice || 0)
  const serviceFee = Math.round(wp * 0.20)
  const maintenanceFee = 20
  const gstAmount = Math.round((serviceFee + maintenanceFee) * 0.18)
  return { workerPrice: wp, serviceFee, maintenanceFee, gstAmount, totalAmount: wp + serviceFee + maintenanceFee + gstAmount }
}

export default function BookingPage() {
  const { serviceId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [step, setStep]         = useState(1)
  const [service, setService]   = useState(null)
  const [workers, setWorkers]   = useState([])
  const [selectedWorker, setSelectedWorker] = useState(null)
  const [loadingSvc, setLoadingSvc] = useState(true)
  const [loadingWorkers, setLoadingWorkers] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [pricing, setPricing]   = useState(null)

  const [form, setForm] = useState({
    scheduledDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    scheduledTime: '10:00 AM',
    street: user?.address?.street || '',
    area:   user?.address?.city   || '',
    city:   user?.address?.city   || '',
    state:  user?.address?.state  || 'Uttar Pradesh',
    pincode: user?.address?.pincode || '',
    landmark: '',
    customerNotes: '',
    paymentMethod: 'cash',
  })

  // Load service
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/services')
        const found = data.data.services.find((s) => s._id === serviceId)
        if (!found) { toast.error('Service not found'); navigate('/services'); return }
        setService(found)
        setPricing(calcPricing(found.basePrice))
      } catch { navigate('/services') }
      finally { setLoadingSvc(false) }
    }
    load()
  }, [serviceId])

  // If workerId passed in URL (from Find Workers page), pre-select
  useEffect(() => {
    const wid = searchParams.get('workerId')
    if (wid && service) loadWorkerById(wid)
  }, [service, searchParams])

  const loadWorkerById = async (wid) => {
    try {
      const { data } = await api.get(`/workers/${wid}`)
      const w = data.data.worker
      setSelectedWorker(w)
      const wp = w.pricing?.demandedPrice || service?.basePrice || 0
      setPricing(calcPricing(wp))
    } catch { /* ignore */ }
  }

  // Load workers when entering step 2
  const loadWorkers = async () => {
    if (!service) return
    setLoadingWorkers(true)
    try {
      const { data } = await api.get(`/workers/available?skill=${service.category}&city=Kanpur`)
      setWorkers(data.data.workers || [])
    } catch { /* ignore */ }
    finally { setLoadingWorkers(false) }
  }

  useEffect(() => {
    if (step === 2) loadWorkers()
  }, [step])

  const handleSelectWorker = (w) => {
    setSelectedWorker(w)
    const wp = w?.pricing?.demandedPrice || service?.basePrice || 0
    setPricing(calcPricing(wp))
  }

  const handleSkipWorker = () => {
    setSelectedWorker(null)
    setPricing(calcPricing(service?.basePrice || 0))
    setStep(3)
  }

  const validateStep = () => {
    if (step === 3 && (!form.scheduledDate || !form.scheduledTime)) {
      toast.error('Please select date and time'); return false
    }
    if (step === 4) {
      if (!form.street || !form.area || !form.city || !form.pincode) {
        toast.error('Please fill all required address fields'); return false
      }
      if (!/^\d{6}$/.test(form.pincode)) { toast.error('Enter valid 6-digit pincode'); return false }
    }
    return true
  }

  const handleNext = () => { if (validateStep()) setStep((s) => s + 1) }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const payload = {
        serviceId,
        workerId: selectedWorker?._id || undefined,
        scheduledDate: form.scheduledDate,
        scheduledTime: form.scheduledTime,
        address: { street: form.street, area: form.area, city: form.city, state: form.state, pincode: form.pincode, landmark: form.landmark },
        customerNotes: form.customerNotes,
        paymentMethod: form.paymentMethod,
      }
      const { data } = await api.post('/bookings', payload)
      toast.success(data.message)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.userMessage || 'Booking failed. Please try again.')
    } finally { setSubmitting(false) }
  }

  if (loadingSvc) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>

  const AVAIL_CFG = {
    available: { dot: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50', label: 'Available' },
    busy:      { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', label: 'Busy' },
    offline:   { dot: 'bg-slate-400', text: 'text-slate-500', bg: 'bg-slate-100', label: 'Offline' },
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-2xl mx-auto px-4">

        {/* Back */}
        <button onClick={() => step > 1 ? setStep((s) => s - 1) : navigate('/services')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft size={16} /> Back
        </button>

        {/* Step pills */}
        <div className="flex items-center gap-1 mb-7 overflow-x-auto pb-1">
          {STEPS.map((label, i) => {
            const num = i + 1; const done = num < step; const active = num === step
            return (
              <div key={label} className="flex items-center flex-shrink-0">
                <div className={`flex items-center gap-1 ${active ? 'text-brand-600' : done ? 'text-green-600' : 'text-slate-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    active ? 'bg-brand-500 text-white' : done ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>{done ? '✓' : num}</div>
                  <span className="text-xs font-medium hidden sm:block whitespace-nowrap">{label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`w-4 h-px mx-1 ${done ? 'bg-green-400' : 'bg-slate-200'}`} />}
              </div>
            )
          })}
        </div>

        <div className="card p-6">

          {/* ── STEP 1: Service Overview ── */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="font-display font-bold text-xl text-slate-900 mb-4">Service Details</h2>
              <div className="bg-gradient-to-br from-brand-50 to-orange-50 border border-brand-100 rounded-2xl p-5 mb-5">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-3xl shadow-sm">
                    {service.icon}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-lg">{service.name}</h3>
                    <p className="text-sm text-slate-500 capitalize">{service.category.replace('_', ' ')}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">{service.description}</p>
                {service.includes?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-1">✅ Includes:</p>
                    <ul className="text-xs text-slate-500 space-y-0.5">
                      {service.includes.map((i) => <li key={i}>• {i}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {/* Pricing preview */}
              {pricing && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Estimated Pricing</p>
                  <PricingBreakdown pricing={pricing} />
                  <p className="text-xs text-slate-400 mt-2 text-center">
                    * Final price may vary if you choose a worker with different rates
                  </p>
                </div>
              )}

              <button onClick={handleNext} className="btn-primary w-full flex items-center justify-center gap-2">
                Continue <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ── STEP 2: Select Worker ── */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display font-bold text-xl text-slate-900">Choose a Worker</h2>
                  <p className="text-slate-500 text-xs mt-0.5">Select a specific worker or let us assign the best one</p>
                </div>
                <button onClick={handleSkipWorker}
                  className="text-xs text-brand-600 font-semibold hover:underline">
                  Auto-assign →
                </button>
              </div>

              {loadingWorkers ? (
                <div className="flex justify-center py-10"><Spinner size="md" /></div>
              ) : workers.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl">
                  <p className="text-3xl mb-2">😕</p>
                  <p className="font-semibold text-slate-700">No workers found in your area</p>
                  <p className="text-sm text-slate-500 mt-1">We'll auto-assign when one becomes available</p>
                  <button onClick={handleSkipWorker} className="btn-primary text-sm mt-4">Continue Anyway</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {workers.map((w) => {
                    const cfg = AVAIL_CFG[w.availability] || AVAIL_CFG.offline
                    const workerPrice = w.pricing?.demandedPrice || service.basePrice
                    const wp = calcPricing(workerPrice)
                    const isSelected = selectedWorker?._id === w._id

                    return (
                      <div key={w._id}
                        onClick={() => w.availability === 'available' && handleSelectWorker(w)}
                        className={`border-2 rounded-2xl p-4 transition-all cursor-pointer ${
                          isSelected ? 'border-brand-500 bg-brand-50'
                          : w.availability !== 'available' ? 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                          : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50'
                        }`}>
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center font-bold text-brand-700 text-lg flex-shrink-0">
                            {w.name[0]}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-display font-bold text-slate-900">{w.name}</p>
                              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} /> {cfg.label}
                              </span>
                              {isSelected && <span className="text-xs font-semibold text-brand-600 bg-brand-100 px-2 py-0.5 rounded-full">✓ Selected</span>}
                            </div>

                            <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <MapPin size={11} className="text-brand-500" />
                                {w.location?.area}, {w.location?.city}
                              </span>
                              <span className="flex items-center gap-1">
                                <Star size={11} className="text-amber-400 fill-amber-400" />
                                {w.rating?.average?.toFixed(1) || '0.0'} ({w.rating?.count || 0})
                              </span>
                              <span>{w.experience} yr exp</span>
                            </div>

                            {/* Skills */}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {w.skills?.map((s) => (
                                <span key={s} className="text-xs bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full capitalize">
                                  {s.replace('_', ' ')}
                                </span>
                              ))}
                            </div>

                            {w.bio && <p className="text-xs text-slate-400 mt-1.5 italic line-clamp-1">"{w.bio}"</p>}

                            {/* Worker's price demand */}
                            <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                              <div className="text-xs text-slate-500">
                                Worker asks:{' '}
                                <span className="font-semibold text-slate-700">
                                  ₹{workerPrice.toLocaleString('en-IN')}
                                </span>
                                {w.pricing?.note && <span className="ml-1 text-slate-400">· {w.pricing.note}</span>}
                              </div>
                              <div className="text-right">
                                <span className="text-xs text-slate-500">You pay: </span>
                                <span className="font-bold text-brand-600">₹{wp.totalAmount.toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {selectedWorker && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
                  <CheckCircle size={16} /> {selectedWorker.name} selected · You pay ₹{pricing?.totalAmount}
                </div>
              )}

              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
                <button onClick={handleNext} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Schedule ── */}
          {step === 3 && (
            <div className="animate-fade-in">
              <h2 className="font-display font-bold text-xl text-slate-900 mb-4">
                <Calendar className="inline mr-2 text-brand-500" size={20} /> Date & Time
              </h2>

              {/* Selected worker reminder */}
              {selectedWorker && (
                <div className="flex items-center gap-3 bg-brand-50 border border-brand-100 rounded-xl p-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-brand-200 flex items-center justify-center text-brand-700 font-bold text-sm">
                    {selectedWorker.name[0]}
                  </div>
                  <div className="flex-1 text-sm">
                    <span className="font-semibold text-slate-900">{selectedWorker.name}</span>
                    <span className="text-slate-500 ml-1">· {selectedWorker.location?.area}</span>
                  </div>
                  <div className="text-sm font-bold text-brand-600">₹{pricing?.totalAmount}</div>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Date *</label>
                <input type="date" name="scheduledDate" value={form.scheduledDate}
                  min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                  onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                  className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Time Slot *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button key={slot} type="button"
                      onClick={() => setForm({ ...form, scheduledTime: slot })}
                      className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        form.scheduledTime === slot
                          ? 'bg-brand-500 border-brand-500 text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-brand-400'
                      }`}>{slot}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(2)} className="btn-secondary flex-1">Back</button>
                <button onClick={handleNext} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Address ── */}
          {step === 4 && (
            <div className="animate-fade-in">
              <h2 className="font-display font-bold text-xl text-slate-900 mb-4">
                <MapPin className="inline mr-2 text-brand-500" size={20} /> Service Address
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Street / House No. *</label>
                  <input className="input-field" value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                    placeholder="12, Sector 5, Vikas Nagar" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Area *</label>
                    <input className="input-field" value={form.area}
                      onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="Govind Nagar" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                    <input className="input-field" value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Kanpur" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                    <input className="input-field" value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pincode *</label>
                    <input className="input-field" value={form.pincode} maxLength={6}
                      onChange={(e) => setForm({ ...form, pincode: e.target.value })} placeholder="208006" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Landmark</label>
                  <input className="input-field" value={form.landmark}
                    onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                    placeholder="Near State Bank of India" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes for worker</label>
                  <textarea rows={2} className="input-field resize-none" value={form.customerNotes}
                    onChange={(e) => setForm({ ...form, customerNotes: e.target.value })}
                    placeholder="Any special instructions..." />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep(3)} className="btn-secondary flex-1">Back</button>
                <button onClick={handleNext} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 5: Payment ── */}
          {step === 5 && (
            <div className="animate-fade-in">
              <h2 className="font-display font-bold text-xl text-slate-900 mb-4">
                <CreditCard className="inline mr-2 text-brand-500" size={20} /> Payment Method
              </h2>
              {pricing && (
                <div className="mb-5">
                  <PricingBreakdown pricing={pricing} workerName={selectedWorker?.name} compact />
                </div>
              )}
              <div className="space-y-3">
                {[
                  { value: 'cash',     label: 'Cash on Service',     desc: 'Pay cash when service is done', icon: '💵' },
                  { value: 'upi',      label: 'UPI / GPay',          desc: 'Pay using any UPI app',         icon: '📱' },
                  { value: 'razorpay', label: 'Card / Net Banking',  desc: 'Secure payment via Razorpay',   icon: '💳' },
                ].map((opt) => (
                  <label key={opt.value} className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    form.paymentMethod === opt.value ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                    <input type="radio" name="paymentMethod" value={opt.value}
                      checked={form.paymentMethod === opt.value}
                      onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="sr-only" />
                    <span className="text-2xl">{opt.icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 text-sm">{opt.label}</div>
                      <div className="text-xs text-slate-500">{opt.desc}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      form.paymentMethod === opt.value ? 'border-brand-500 bg-brand-500' : 'border-slate-300'
                    }`}>
                      {form.paymentMethod === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep(4)} className="btn-secondary flex-1">Back</button>
                <button onClick={handleNext} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  Review <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 6: Confirm ── */}
          {step === 6 && (
            <div className="animate-fade-in">
              <h2 className="font-display font-bold text-xl text-slate-900 mb-5">
                <CheckCircle className="inline mr-2 text-brand-500" size={20} /> Confirm Booking
              </h2>
              <div className="space-y-3 text-sm mb-5">

                {/* Service */}
                <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3">
                  <span className="text-2xl">{service.icon}</span>
                  <div>
                    <p className="font-semibold text-slate-900">{service.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{service.category.replace('_', ' ')}</p>
                  </div>
                </div>

                {/* Worker */}
                {selectedWorker ? (
                  <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-200 flex items-center justify-center text-brand-700 font-bold">
                      {selectedWorker.name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{selectedWorker.name}</p>
                      <div className="flex gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1"><MapPin size={10} /> {selectedWorker.location?.area}, {selectedWorker.location?.city}</span>
                        <span className="flex items-center gap-1"><Star size={10} className="text-amber-400" /> {selectedWorker.rating?.average?.toFixed(1)}</span>
                        {selectedWorker.phone && (
                          <a href={`tel:${selectedWorker.phone}`} className="flex items-center gap-1 text-brand-600">
                            <Phone size={10} /> {selectedWorker.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 flex items-center gap-2">
                    <Users size={14} /> Worker will be auto-assigned based on your location
                  </div>
                )}

                {/* Schedule */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">SCHEDULE</p>
                  <p className="font-semibold text-slate-900">
                    {format(new Date(form.scheduledDate), 'EEEE, dd MMMM yyyy')} · {form.scheduledTime}
                  </p>
                </div>

                {/* Address */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">ADDRESS</p>
                  <p className="font-semibold text-slate-900">
                    {form.street}, {form.area}, {form.city} – {form.pincode}
                  </p>
                  {form.landmark && <p className="text-xs text-slate-500 mt-0.5">Near: {form.landmark}</p>}
                </div>

                {/* Full pricing */}
                {pricing && (
                  <div>
                    <p className="text-xs text-slate-500 mb-2">PRICING BREAKDOWN</p>
                    <PricingBreakdown pricing={pricing} workerName={selectedWorker?.name} />
                  </div>
                )}

                {/* Payment */}
                <div className="bg-slate-50 rounded-xl p-3 flex justify-between text-sm">
                  <span className="text-slate-600 capitalize">Payment: {form.paymentMethod.replace('_', ' ')}</span>
                  <span className={`font-semibold ${form.paymentMethod === 'cash' ? 'text-amber-600' : 'text-green-600'}`}>
                    {form.paymentMethod === 'cash' ? 'Pay after service' : 'Pay now'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(5)} disabled={submitting} className="btn-secondary flex-1">Back</button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting ? <><Spinner size="sm" /> Booking...</> : '✅ Confirm Booking'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}