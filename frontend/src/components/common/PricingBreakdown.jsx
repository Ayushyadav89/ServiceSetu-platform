import { IndianRupee, Info } from 'lucide-react'

/**
 * Transparent pricing breakdown widget
 * Shows: Worker Price → Service Fee → Maintenance → GST → Total
 */
export default function PricingBreakdown({ pricing, compact = false, workerName = null }) {
  if (!pricing) return null

  const rows = [
    {
      label:  workerName ? `Worker Price (${workerName})` : 'Worker Price',
      amount: pricing.workerPrice,
      color:  'text-slate-700',
      bg:     'bg-slate-50',
      icon:   '👷',
      note:   'Amount paid to the worker',
    },
    {
      label:  'Service Fee (20%)',
      amount: pricing.serviceFee,
      color:  'text-blue-700',
      bg:     'bg-blue-50',
      icon:   '💼',
      note:   'Platform service charge',
    },
    {
      label:  'Maintenance Fee',
      amount: pricing.maintenanceFee,
      color:  'text-purple-700',
      bg:     'bg-purple-50',
      icon:   '🛠️',
      note:   'App & support coverage',
    },
    {
      label:  'GST (18%)',
      amount: pricing.gstAmount,
      color:  'text-orange-700',
      bg:     'bg-orange-50',
      icon:   '🏛️',
      note:   'On platform charges only',
    },
  ]

  if (compact) {
    return (
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="space-y-2 text-sm mb-3">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between items-center">
              <span className="text-slate-600 flex items-center gap-1.5">
                <span className="text-base">{r.icon}</span>
                {r.label}
              </span>
              <span className="font-semibold text-slate-800">₹{r.amount.toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-slate-300">
          <span className="font-display font-bold text-slate-900">Total</span>
          <span className="font-display font-bold text-xl text-brand-600">
            ₹{pricing.totalAmount.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3 flex items-center gap-2">
        <IndianRupee size={16} className="text-brand-400" />
        <span className="font-display font-bold text-white text-sm">Price Breakdown</span>
        <div className="ml-auto flex items-center gap-1 text-xs text-slate-400">
          <Info size={12} /> Transparent pricing
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-100 bg-white">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3 px-4 py-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0 ${r.bg}`}>
              {r.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${r.color}`}>{r.label}</p>
              <p className="text-xs text-slate-400">{r.note}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className={`text-sm font-bold ${r.color}`}>+ ₹{r.amount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="bg-brand-50 border-t-2 border-brand-200 px-4 py-3.5 flex items-center justify-between">
        <div>
          <p className="font-display font-bold text-slate-900 text-base">You Pay</p>
          <p className="text-xs text-slate-500">All charges included</p>
        </div>
        <div className="text-right">
          <p className="font-display font-extrabold text-2xl text-brand-600">
            ₹{pricing.totalAmount.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500">incl. all fees & GST</p>
        </div>
      </div>
    </div>
  )
}