import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '../components/common/LoadingScreen'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const validate = () => {
    if (!form.name || form.name.length < 2) return 'Please enter your full name'
    if (!form.email.match(/^\S+@\S+\.\S+$/)) return 'Please enter a valid email'
    if (form.password.length < 6) return 'Password must be at least 6 characters'
    if (form.phone && !form.phone.match(/^[6-9]\d{9}$/)) return 'Enter a valid 10-digit Indian phone number'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }
    setLoading(true)
    try {
      await register(form.name.trim(), form.email, form.password, form.phone)
      toast.success('Account created! Welcome to ServiceSetu 🎉')
      navigate('/dashboard')
    } catch (err) {
      setError(err.userMessage || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl text-slate-900 mb-8">
          <span className="text-2xl">🔧</span>
          Service<span className="text-brand-500">Setu</span>
        </Link>

        <div className="card p-8">
          <h1 className="font-display font-bold text-2xl text-slate-900 mb-1">Create account</h1>
          <p className="text-slate-500 text-sm mb-6">Join thousands of happy customers</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
              <input name="name" value={form.name} onChange={handleChange}
                className="input-field" placeholder="Raj Kumar" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                className="input-field" placeholder="you@example.com" autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone (optional)</label>
              <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                className="input-field" placeholder="9876543210" maxLength={10} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password *</label>
              <div className="relative">
                <input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange}
                  className="input-field pr-11" placeholder="At least 6 characters" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? <Spinner size="sm" /> : <><UserPlus size={16} /> Create Account</>}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
