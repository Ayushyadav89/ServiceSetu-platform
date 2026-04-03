import { useState } from 'react'
import { MapPin, Users } from 'lucide-react'
import AreaWorkerChecker from '../../components/customer/AreaWorkerChecker'
import AreaCoverageMap from '../../components/customer/AreaCoverageMap'

const QUICK_PINCODES = [
  { pincode: '208001', area: 'Civil Lines' },
  { pincode: '208002', area: 'Arya Nagar' },
  { pincode: '208006', area: 'Govind Nagar' },
  { pincode: '208011', area: 'Kidwai Nagar' },
  { pincode: '208013', area: 'Shyam Nagar' },
]

export default function WorkersPage() {
  const [activeTab, setActiveTab] = useState('check') // 'check' | 'coverage'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <Users size={20} className="text-brand-600" />
            </div>
            <h1 className="section-title">Worker Availability</h1>
          </div>
          <p className="text-slate-500 text-sm ml-13">
            Check if verified workers are available in your area before booking
          </p>

          {/* Tabs */}
          <div className="flex gap-1 mt-5 bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('check')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'check' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              🔍 Check My Pincode
            </button>
            <button
              onClick={() => setActiveTab('coverage')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'coverage' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              🗺️ Coverage Map
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-7">

        {activeTab === 'check' && (
          <div className="animate-fade-in">
            {/* Quick pincode pills */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Popular areas in Kanpur
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_PINCODES.map((p) => (
                  <div key={p.pincode}
                    className="flex items-center gap-1.5 text-xs bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-full shadow-sm">
                    <MapPin size={11} className="text-brand-500" />
                    <span className="font-medium">{p.area}</span>
                    <span className="text-slate-400">{p.pincode}</span>
                  </div>
                ))}
              </div>
            </div>

            <AreaWorkerChecker />
          </div>
        )}

        {activeTab === 'coverage' && (
          <div className="animate-fade-in">
            <AreaCoverageMap city="Kanpur" />
          </div>
        )}

        {/* Info boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {[
            { icon: '📍', title: 'Pincode Matching', desc: 'Workers are matched first by exact pincode, then by area, then by city.' },
            { icon: '⚡', title: 'Real-time Status', desc: 'Availability updates instantly when a worker accepts or completes a job.' },
            { icon: '🔄', title: 'Auto Assignment', desc: 'When you book, the highest-rated available worker in your area is auto-assigned.' },
          ].map((info) => (
            <div key={info.title} className="card p-4">
              <div className="text-2xl mb-2">{info.icon}</div>
              <p className="font-semibold text-slate-900 text-sm mb-1">{info.title}</p>
              <p className="text-xs text-slate-500">{info.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}