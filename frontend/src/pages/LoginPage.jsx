import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '../components/common/LoadingScreen'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`)
      navigate(user.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err) {
      setError(err.userMessage || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (role) => {
    if (role === 'admin') setForm({ email: 'admin@servicesetu.com', password: 'Admin@123' })
    else setForm({ email: 'priya@example.com', password: 'Demo@123' })
    setError('')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-500 to-brand-700 p-12 flex-col justify-between">
        <Link to="/" className="flex items-center gap-2 text-white font-display font-bold text-xl">
          <span className="text-2xl">🔧</span> ServiceSetu
        </Link>
        <div>
          <h2 className="text-4xl font-display font-bold text-white mb-4">
            Trusted services,<br />at your doorstep.
          </h2>
          <p className="text-brand-100 text-lg">
            Connect with verified local professionals for all your home service needs.
          </p>
        </div>
        <div className="flex gap-4 text-sm text-brand-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">500+</div>
            <div>Workers</div>
          </div>
          <div className="w-px bg-brand-400" />
          <div className="text-center">
            <div className="text-2xl font-bold text-white">10k+</div>
            <div>Bookings</div>
          </div>
          <div className="w-px bg-brand-400" />
          <div className="text-center">
            <div className="text-2xl font-bold text-white">4.8★</div>
            <div>Rating</div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl text-slate-900 mb-8 lg:hidden">
            <span className="text-2xl">🔧</span>
            Service<span className="text-brand-500">Setu</span>
          </Link>

          <h1 className="font-display font-bold text-2xl text-slate-900 mb-1">Welcome back</h1>
          <p className="text-slate-500 text-sm mb-6">Sign in to your account to continue</p>

          {/* Demo quick-fill buttons */}
          <div className="flex gap-2 mb-6">
            <button onClick={() => fillDemo('customer')}
              className="flex-1 text-xs py-2 px-3 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors font-medium">
              👤 Demo Customer
            </button>
            <button onClick={() => fillDemo('admin')}
              className="flex-1 text-xs py-2 px-3 rounded-lg bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 transition-colors font-medium">
              🛡️ Demo Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                className="input-field" placeholder="you@example.com" autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange}
                  className="input-field pr-11" placeholder="Your password" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? <Spinner size="sm" /> : <><LogIn size={16} /> Sign In</>}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 font-semibold hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
