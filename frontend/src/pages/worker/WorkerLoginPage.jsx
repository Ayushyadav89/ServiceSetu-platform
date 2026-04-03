import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import { useWorkerAuth } from '../../context/WorkerAuthContext'
import { Spinner } from '../../components/common/LoadingScreen'

export default function WorkerLoginPage() {
  const { workerLogin } = useWorkerAuth()
  const navigate = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Please fill in all fields'); return }
    setLoading(true)
    try {
      const worker = await workerLogin(form.email, form.password)
      toast.success(`Welcome back, ${worker.name.split(' ')[0]}!`)
      navigate('/worker/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl text-slate-900 mb-8">
          <span>🔧</span> Service<span className="text-brand-500">Setu</span>
        </Link>

        <div className="card p-8">
          <h1 className="font-display font-bold text-2xl text-slate-900 mb-1">Worker Login</h1>
          <p className="text-slate-500 text-sm mb-6">Sign in to your worker dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input type="email" className="input-field" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input-field pr-11"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Your password" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? <Spinner size="sm" /> : <><LogIn size={16} /> Sign In</>}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            New worker?{' '}
            <Link to="/worker/register" className="text-brand-600 font-semibold hover:underline">
              Create your profile
            </Link>
          </p>
          <p className="text-center text-sm text-slate-500 mt-2">
            Customer?{' '}
            <Link to="/login" className="text-brand-600 font-semibold hover:underline">Customer login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}