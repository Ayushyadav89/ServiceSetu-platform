import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, BookOpen, Users, Wrench, Menu, X, LogOut, ChevronRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = [
  { to: '/admin',           icon: <LayoutDashboard size={18} />, label: 'Dashboard',  exact: true },
  { to: '/admin/bookings',  icon: <BookOpen size={18} />,        label: 'Bookings' },
  { to: '/admin/workers',   icon: <Wrench size={18} />,          label: 'Workers' },
  { to: '/admin/customers', icon: <Users size={18} />,           label: 'Customers' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  const isActive = (item) => item.exact
    ? location.pathname === item.to
    : location.pathname.startsWith(item.to)

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? 'p-4' : 'p-5'}`}>
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg text-white mb-8 px-2">
        <span className="text-xl">🔧</span>
        Service<span className="text-brand-400">Setu</span>
        <span className="ml-auto text-xs bg-brand-500/40 px-2 py-0.5 rounded-full text-brand-300">Admin</span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => mobile && setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isActive(item)
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {item.icon}
            {item.label}
            {isActive(item) && <ChevronRight size={14} className="ml-auto" />}
          </Link>
        ))}
      </nav>

      {/* User + logout */}
      <div className="border-t border-white/10 pt-4 mt-4">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-slate-400 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl text-sm transition-colors">
          <LogOut size={15} /> Logout
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 bg-slate-900 flex-col flex-shrink-0 h-screen sticky top-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="bg-slate-900 w-64">
            <div className="flex justify-end p-4">
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <Sidebar mobile />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-600">
            <Menu size={22} />
          </button>
          <span className="font-display font-bold text-slate-900">ServiceSetu Admin</span>
        </div>

        <main className="flex-1 p-5 lg:p-7 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
