import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { WorkerAuthProvider, useWorkerAuth } from './context/WorkerAuthContext'

// Customer pages
import HomePage from './pages/customer/HomePage'
import ServicesPage from './pages/customer/ServicesPage'
import WorkersPage from './pages/customer/WorkersPage'
import BookingPage from './pages/customer/BookingPage'
import DashboardPage from './pages/customer/DashboardPage'
import BookingDetailPage from './pages/customer/BookingDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// Worker pages
import WorkerLoginPage from './pages/worker/WorkerLoginPage'
import WorkerRegisterPage from './pages/worker/WorkerRegisterPage'
import WorkerDashboardPage from './pages/worker/WorkerDashboardPage'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminBookings from './pages/admin/AdminBookings'
import AdminWorkers from './pages/admin/AdminWorkers'
import AdminCustomers from './pages/admin/AdminCustomers'

// Layout
import Navbar from './components/common/Navbar'
import AdminLayout from './components/admin/AdminLayout'
import LoadingScreen from './components/common/LoadingScreen'

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return user ? children : <Navigate to="/login" replace />
}

const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return !user ? children : <Navigate to="/" replace />
}

const WorkerPrivateRoute = ({ children }) => {
  const { worker, loading } = useWorkerAuth()
  if (loading) return <LoadingScreen />
  return worker ? children : <Navigate to="/worker/login" replace />
}

const WorkerGuestRoute = ({ children }) => {
  const { worker, loading } = useWorkerAuth()
  if (loading) return <LoadingScreen />
  return !worker ? children : <Navigate to="/worker/dashboard" replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<><Navbar /><HomePage /></>} />
      <Route path="/services" element={<><Navbar /><ServicesPage /></>} />
      <Route path="/workers" element={<><Navbar /><WorkersPage /></>} />
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* Customer protected */}
      <Route path="/book/:serviceId" element={<PrivateRoute><><Navbar /><BookingPage /></></PrivateRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><><Navbar /><DashboardPage /></></PrivateRoute>} />
      <Route path="/bookings/:id" element={<PrivateRoute><><Navbar /><BookingDetailPage /></></PrivateRoute>} />

      {/* Worker routes */}
      <Route path="/worker/login" element={<WorkerGuestRoute><WorkerLoginPage /></WorkerGuestRoute>} />
      <Route path="/worker/register" element={<WorkerGuestRoute><WorkerRegisterPage /></WorkerGuestRoute>} />
      <Route path="/worker/dashboard" element={<WorkerPrivateRoute><WorkerDashboardPage /></WorkerPrivateRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="workers" element={<AdminWorkers />} />
        <Route path="customers" element={<AdminCustomers />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <WorkerAuthProvider>
        <AppRoutes />
      </WorkerAuthProvider>
    </AuthProvider>
  )
}