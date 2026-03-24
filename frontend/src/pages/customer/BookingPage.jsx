import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, Clock, MapPin, CreditCard, CheckCircle, ArrowLeft, ArrowRight, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, addDays } from 'date-fns'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../../components/common/LoadingScreen'

const TIME_SLOTS = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
  '05:00 PM', '06:00 PM',
]

const STEPS = ['Service', 'Schedule', 'Address', 'Payment', 'Confirm']

export default function BookingPage() {
  const { serviceId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [step, setStep] = useState(1)
  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    scheduledDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    scheduledTime: '10:00 AM',
    street: user?.address?.street || '',
    area: user?.address?.city || '',
    city: user?.address?.city || '',
    state: user?.address?.state || 'Uttar Pradesh',
    pincode: user?.address?.pincode || '',
    landmark: '',
    customerNotes: '',
    paymentMethod: 'cash',
  })

  useEffect(() => {
    const fetchService = async () => {
      try {
        const { data } = await api.get(`/services`)
        const found = data.data.services.find((s) => s._id === serviceId)
        if (!found) { toast.error('Service not found'); navigate('/services'); return }
        setService(found)
      } catch {
        navigate('/services')
      } finally {
        setLoading(false)
      }
    }
    fetchService()
  }, [serviceId])

  const gst = service ? Math.round(service.basePrice * 0.18) : 0
  const total = service ? service.basePrice + gst : 0

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const validateStep = () => {
    if (step === 2) {
      if (!form.scheduledDate || !form.scheduledTime) { toast.error('Please select date and time'); return false }
    }
    if (step === 3) {
      if (!form.street || !form.area || !form.city || !form.pincode) {
        toast.error('Please fill in all required address fields'); return false
      }
      if (!/^\d{6}$/.test(form.pincode)) { toast.error('Please enter a valid 6-digit pincode'); return false }
    }
    return true
  }

  const handleNext = () => {
    if (validateStep()) setStep((s) => s + 1)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const payload = {
        serviceId,
        scheduledDate: form.scheduledDate,
        scheduledTime: form.scheduledTime,
        address: {
          street: form.street,
          area: form.area,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          landmark: form.landmark,
        },
        customerNotes: form.customerNotes,
        paymentMethod: form.paymentMethod,
      }
      const { data } = await api.post('/bookings', payload)
      toast.success(data.message)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.userMessage || 'Booking failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-2xl mx-auto px-4">

        {/* Back button */}
        <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/services')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>

        {/* Step progress */}
        <div className="flex items-center gap-1 mb-8">
          {STEPS.map((label, i) => {
            const num = i + 1
            const active = num === step
            const done = num < step
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
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-2 ${done ? 'bg-green-400' : 'bg-slate-200'}`} />
                )}
              </div>
            )
          })}
        </div>

        <div className="card p-6">

          {/* ── Step 1: Service overview ── */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="font-display font-bold text-xl text-slate-900 mb-4">Service Details</h2>
              <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 mb-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-3xl shadow-sm">
                    {service.icon}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-900">{service.name}</h3>
                    <p className="text-sm text-slate-500 capitalize">{service.category.replace('_', ' ')}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">{service.description}</p>
                {service.includes?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-1">✅ Includes:</p>
                    <ul className="text-xs text-slate-500 space-y-0.5">
                      {service.includes.map((item) => <li key={item}>• {item}</li>)}
                    </ul>
                  </div>
                )}
              </div>
              {/* Pricing */}
              <div className="space-y-2 text-sm mb-6">
                <div className="flex justify-between text-slate-600">
                  <span>Base Price</span>
                  <span>₹{service.basePrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (18%)</span>
                  <span>₹{gst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-2">
                  <span>Total</span>
                  <span className="text-brand-600">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <button onClick={handleNext} className="btn-primary w-full flex items-center justify-center gap-2">
                Continue <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ── Step 2: Schedule ── */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="font-display font-bold text-xl text-slate-900 mb-4">
                <Calendar className="inline mr-2 text-brand-500" size={20} />
                Choose Date & Time
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Date *</label>
                <input
                  type="date"
                  name="scheduledDate"
                  value={form.scheduledDate}
                  min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Clock className="inline mr-1.5" size={14} /> Time Slot *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setForm({ ...form, scheduledTime: slot })}
                      className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        form.scheduledTime === slot
                          ? 'bg-brand-500 border-brand-500 text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-brand-400'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
                <button onClick={handleNext} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Address ── */}
          {step === 3 && (
            <div className="animate-fade-in">
              <h2 className="font-display font-bold text-xl text-slate-900 mb-4">
                <MapPin className="inline mr-2 text-brand-500" size={20} />
                Service Address
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Street / House No. *</label>
                  <input name="street" value={form.street} onChange={handleChange} className="input-field" placeholder="12, Sector 5, Vikas Nagar" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Area / Locality *</label>
                    <input name="area" value={form.area} onChange={handleChange} className="input-field" placeholder="Govind Nagar" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                    <input name="city" value={form.city} onChange={handleChange} className="input-field" placeholder="Kanpur" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                    <input name="state" value={form.state} onChange={handleChange} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pincode *</label>
                    <input name="pincode" value={form.pincode} onChange={handleChange} className="input-field" placeholder="208006" maxLength={6} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Landmark (optional)</label>
                  <input name="landmark" value={form.landmark} onChange={handleChange} className="input-field" placeholder="Near State Bank of India" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes for worker (optional)</label>
                  <textarea name="customerNotes" value={form.customerNotes} onChange={handleChange}
                    rows={2} className="input-field resize-none" placeholder="Any special instructions..." />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep(2)} className="btn-secondary flex-1">Back</button>
                <button onClick={handleNext} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Payment ── */}
          {step === 4 && (
            <div className="animate-fade-in">
              <h2 className="font-display font-bold text-xl text-slate-900 mb-4">
                <CreditCard className="inline mr-2 text-brand-500" size={20} />
                Payment Method
              </h2>
              <div className="space-y-3 mb-6">
                {[
                  { value: 'cash', label: 'Cash on Service', desc: 'Pay in cash when service is completed', icon: '💵' },
                  { value: 'upi', label: 'UPI / GPay', desc: 'Pay using any UPI app', icon: '📱' },
                  { value: 'razorpay', label: 'Card / Net Banking', desc: 'Secure online payment (Razorpay)', icon: '💳' },
                ].map((opt) => (
                  <label key={opt.value} className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    form.paymentMethod === opt.value ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                    <input type="radio" name="paymentMethod" value={opt.value}
                      checked={form.paymentMethod === opt.value} onChange={handleChange} className="sr-only" />
                    <span className="text-2xl">{opt.icon}</span>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{opt.label}</div>
                      <div className="text-xs text-slate-500">{opt.desc}</div>
                    </div>
                    <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      form.paymentMethod === opt.value ? 'border-brand-500 bg-brand-500' : 'border-slate-300'
                    }`}>
                      {form.paymentMethod === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="btn-secondary flex-1">Back</button>
                <button onClick={handleNext} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  Review Order <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 5: Confirm ── */}
          {step === 5 && (
            <div className="animate-fade-in">
              <h2 className="font-display font-bold text-xl text-slate-900 mb-5">
                <CheckCircle className="inline mr-2 text-brand-500" size={20} />
                Confirm Booking
              </h2>
              <div className="space-y-4 text-sm mb-6">
                {/* Service */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">SERVICE</p>
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <span>{service.icon}</span> {service.name}
                  </div>
                </div>
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
                </div>
                {/* Payment */}
                <div className="flex justify-between items-center bg-slate-50 rounded-xl p-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">PAYMENT</p>
                    <p className="font-semibold text-slate-900 capitalize">{form.paymentMethod.replace('_', ' ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 mb-1">TOTAL</p>
                    <p className="text-xl font-bold text-brand-600">₹{total.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(4)} className="btn-secondary flex-1" disabled={submitting}>Back</button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting ? <><Spinner size="sm" /> Booking...</> : <>✅ Confirm Booking</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
