// LoadingScreen.jsx
export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-bounce">🔧</div>
        <p className="text-slate-500 font-medium">Loading ServiceSetu...</p>
      </div>
    </div>
  )
}
export default LoadingScreen

// StatusBadge
const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: 'bg-amber-100 text-amber-700' },
  assigned:    { label: 'Assigned',    color: 'bg-blue-100 text-blue-700' },
  confirmed:   { label: 'Confirmed',   color: 'bg-indigo-100 text-indigo-700' },
  in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-700' },
  completed:   { label: 'Completed',   color: 'bg-green-100 text-green-700' },
  cancelled:   { label: 'Cancelled',   color: 'bg-red-100 text-red-700' },
  rejected:    { label: 'Rejected',    color: 'bg-slate-100 text-slate-600' },
}

export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-slate-100 text-slate-600' }
  return (
    <span className={`status-badge ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

// Spinner
export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }
  return (
    <div className={`${sizes[size]} animate-spin rounded-full border-2 border-slate-200 border-t-brand-500 ${className}`} />
  )
}

// EmptyState
export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-800 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-xs mb-5">{description}</p>}
      {action}
    </div>
  )
}

// StarRating
export function StarRating({ rating, count, size = 'sm' }) {
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'
  return (
    <div className={`flex items-center gap-1 ${textSize}`}>
      <span className="text-amber-400">★</span>
      <span className="font-semibold text-slate-700">{rating?.toFixed(1) || '0.0'}</span>
      {count !== undefined && <span className="text-slate-400">({count})</span>}
    </div>
  )
}

// ConfirmModal
export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
      <div className="card p-6 max-w-sm w-full animate-slide-up">
        <h3 className="font-display font-bold text-lg text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary text-sm">Cancel</button>
          <button
            onClick={onConfirm}
            className={`font-semibold px-5 py-2.5 rounded-xl text-sm text-white transition-all ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-500 hover:bg-brand-600'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// PageHeader
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="section-title">{title}</h1>
        {subtitle && <p className="text-slate-500 mt-1 text-sm">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
