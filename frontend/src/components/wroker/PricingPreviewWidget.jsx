import { useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { Spinner } from '../common/LoadingScreen'

const calcPricing = (workerPrice) => {
  const wp = Math.round(workerPrice || 0)
  const serviceFee = Math.round(wp * 0.20)
  const maintenanceFee = 20
  const gstAmount = Math.round((serviceFee + maintenanceFee) * 0.18)
  return { workerPrice: wp, serviceFee, maintenanceFee, gstAmount, totalAmount: wp + serviceFee + maintenanceFee + gstAmount }
}

export default function PricingPreviewWidget({ worker, refreshWorker, getWorkerHeaders }) {
  const [price, setPrice]   = useState(worker?.pricing?.demandedPrice || worker?.pricing?.pricePerVisit || 200)
  const [note, setNote]     = useState(worker?.pricing?.note || '')
  const [saving, setSaving] = useState(false)

  const pricing = calcPricing(price)

  const handleSave = async () => {
    if (!price || price < 50) { toast.error('Minimum price is ₹50'); return }
    setSaving(true)
    try {
      await api.put('/workers/me/pricing', {
        demandedPrice: price,
        pricePerVisit: price,
        note,
      }, { headers: getWorkerHeaders() })
      await refreshWorker()
      toast.success('Your pricing has been updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update pricing')
    } finally { setSaving(false) }
  }

  const rows = [
    { label: 'Your Price (you receive)',  amount: pricing.workerPrice,    icon: '👷', color: 'text-slate-900', bg: 'bg-slate-100', note: 'This is what you earn' },
    { label: 'Platform Service Fee (20%)',amount: pricing.serviceFee,     icon: '💼', color: 'text-blue-700',  bg: 'bg-blue-50',   note: 'Platform profit margin' },
    { label: 'Maintenance Fee (Fixed)',   amount: pricing.maintenanceFee, icon: '🛠️', color: 'text-purple-700',bg: 'bg-purple-50', note: 'App & support costs' },
    { label: 'GST on Platform Charges',  amount: pricing.gstAmount,      icon: '🏛️', color: 'text-orange-700',bg: 'bg-orange-50', note: '18% on service + maintenance' },
  ]

  return (
    <div className="space-y-5">
      {/* Price input */}
      <div className="card p-5">
        <label className="block text-sm font-semibold text-slate-700 mb-1">Your Demanded Price (₹)</label>
        <p className="text-xs text-slate-500 mb-3">Enter the amount you want to charge per visit/service. Platform fees will be added on top.</p>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">₹</span>
              <input
                type="number"
                min="50"
                max="10000"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="input-field pl-8 text-lg font-bold"
              />
            </div>
          </div>
          {/* Slider */}
          <div className="flex-1">
            <input
              type="range"
              min="50"
              max="2000"
              step="10"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-0.5">
              <span>₹50</span>
              <span>₹2000</span>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-xs font-medium text-slate-600 mb-1">Note for customers (optional)</label>
          <input
            className="input-field text-sm"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Price may vary by job complexity"
          />
        </div>
      </div>

      {/* Live breakdown */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3">
          <p className="font-display font-bold text-white text-sm">Live Pricing Preview</p>
          <p className="text-slate-400 text-xs mt-0.5">This is exactly what the customer will see</p>
        </div>

        <div className="divide-y divide-slate-100">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-3 px-4 py-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${r.bg}`}>
                {r.icon}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${r.color}`}>{r.label}</p>
                <p className="text-xs text-slate-400">{r.note}</p>
              </div>
              <span className={`text-sm font-bold flex-shrink-0 ${r.color}`}>
                ₹{r.amount.toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="bg-brand-50 border-t-2 border-brand-200 px-4 py-4 flex items-center justify-between">
          <div>
            <p className="font-display font-bold text-slate-900">Customer Pays</p>
            <p className="text-xs text-slate-500">All charges included</p>
          </div>
          <div className="text-right">
            <p className="font-display font-extrabold text-2xl text-brand-600">
              ₹{pricing.totalAmount.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-green-600 font-semibold">You earn ₹{pricing.workerPrice}</p>
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700">
        <p className="font-semibold mb-1">💡 How pricing works</p>
        <p>You set your price → ServiceSetu adds a 20% service fee + ₹20 maintenance + 18% GST on platform charges → Customer sees the total. You always receive exactly ₹{pricing.workerPrice} per booking at this rate.</p>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="btn-primary flex items-center gap-2 w-full justify-center">
        {saving ? <Spinner size="sm" /> : '💾'} Save My Pricing
      </button>
    </div>
  )
}