import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

const WorkerAuthContext = createContext(null)

export const WorkerAuthProvider = ({ children }) => {
  const [worker, setWorker]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('ss_worker_token')
      if (token) {
        // Use a separate header for worker token
        try {
          const { data } = await api.get('/workers/me', {
            headers: { Authorization: `Bearer ${token}` },
          })
          setWorker(data.data.worker)
          api.defaults.headers.common['X-Worker-Token'] = token
        } catch {
          localStorage.removeItem('ss_worker_token')
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  const workerLogin = useCallback(async (email, password) => {
    const { data } = await api.post('/workers/auth/login', { email, password })
    const { worker, token } = data.data
    localStorage.setItem('ss_worker_token', token)
    setWorker(worker)
    return worker
  }, [])

  const workerRegister = useCallback(async (formData) => {
    const { data } = await api.post('/workers/auth/register', formData)
    const { worker, token } = data.data
    localStorage.setItem('ss_worker_token', token)
    setWorker(worker)
    return worker
  }, [])

  const workerLogout = useCallback(() => {
    localStorage.removeItem('ss_worker_token')
    setWorker(null)
    toast.success('Logged out successfully')
  }, [])

  const refreshWorker = useCallback(async () => {
    const token = localStorage.getItem('ss_worker_token')
    if (!token) return
    const { data } = await api.get('/workers/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    setWorker(data.data.worker)
  }, [])

  // Helper: get auth header for worker API calls
  const getWorkerHeaders = () => {
    const token = localStorage.getItem('ss_worker_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  return (
    <WorkerAuthContext.Provider value={{
      worker, loading, workerLogin, workerRegister,
      workerLogout, refreshWorker, getWorkerHeaders,
    }}>
      {children}
    </WorkerAuthContext.Provider>
  )
}

export const useWorkerAuth = () => {
  const ctx = useContext(WorkerAuthContext)
  if (!ctx) throw new Error('useWorkerAuth must be used within WorkerAuthProvider')
  return ctx
}