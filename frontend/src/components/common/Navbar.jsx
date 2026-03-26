import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, User, LogOut, LayoutDashboard, ChevronDown, Wrench } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useWorkerAuth } from '../../context/WorkerAuthContext'

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const { worker, workerLogout }  = useWorkerAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = () => {
    logout(); navigate('/'); setDropdownOpen(false)
  }
  const handleWorkerLogout = () => {
    workerLogout(); navigate('/'); setDropdownOpen(false)
  }

  const navLinks = [
    { to: '/',         label: 'Home' },
    { to: '/services', label: 'Services' },
    { to: '/workers',  label: 'Find Workers' },
  ]

  // If worker is logged in, show worker navbar
  if (worker) {
    return (
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl text-slate-900">
              <span className="text-2xl">🔧</span>
              Service<span className="text-brand-500">Setu</span>
            </Link>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                worker.availability === 'available' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {worker.availability}
              </span>
              <button onClick={() => navigate('/worker/dashboard')}
                className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl transition-colors text-sm font-medium text-slate-700">
                <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
                  {worker.name[0]}
                </div>
                {worker.name.split(' ')[0]}
              </button>
              <button onClick={handleWorkerLogout} className="text-xs text-slate-400 hover:text-red-500">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl text-slate-900">
            <span className="text-2xl">🔧</span>
            Service<span className="text-brand-500">Setu</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === l.to ? 'text-brand-600' : 'text-slate-600 hover:text-brand-500'
                }`}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-2">
            {/* Join as worker link */}
            <Link to="/worker/register"
              className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand-600 px-3 py-2 rounded-xl hover:bg-brand-50 transition-colors">
              <Wrench size={14} /> Join as Worker
            </Link>

            {user ? (
              <div className="relative">
                <button onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl transition-colors">
                  <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
                    {user.name[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">{user.name}</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-slate-100 py-1.5 animate-fade-in">
                    {isAdmin ? (
                      <button onClick={() => { navigate('/admin'); setDropdownOpen(false) }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                        <LayoutDashboard size={15} /> Admin Panel
                      </button>
                    ) : (
                      <button onClick={() => { navigate('/dashboard'); setDropdownOpen(false) }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                        <User size={15} /> My Dashboard
                      </button>
                    )}
                    <div className="h-px bg-slate-100 my-1" />
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm py-2 px-4">Login</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">Sign Up</Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2 rounded-lg text-slate-600" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-2 animate-slide-up">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
              className="block py-2.5 px-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50">
              {l.label}
            </Link>
          ))}
          <Link to="/worker/register" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium text-brand-600 hover:bg-brand-50">
            <Wrench size={15} /> Join as Worker
          </Link>
          <div className="h-px bg-slate-100 my-2" />
          {user ? (
            <>
              <Link to={isAdmin ? '/admin' : '/dashboard'} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm text-slate-700 hover:bg-slate-50">
                <User size={16} /> {isAdmin ? 'Admin Panel' : 'My Dashboard'}
              </Link>
              <button onClick={handleLogout}
                className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm text-red-500 hover:bg-red-50 w-full">
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <div className="flex gap-2 pt-1">
              <Link to="/login" className="btn-secondary flex-1 text-center text-sm py-2" onClick={() => setMobileOpen(false)}>Login</Link>
              <Link to="/register" className="btn-primary flex-1 text-center text-sm py-2" onClick={() => setMobileOpen(false)}>Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}