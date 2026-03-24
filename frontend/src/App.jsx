import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Customer pages
import HomePage from './pages/customer/HomePage'
import ServicesPage from './pages/customer/ServicesPage'
import BookingPage from './pages/customer/BookingPage'
import DashboardPage from './pages/customer/DashboardPage'
import BookingDetailPage from './pages/customer/BookingDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminBookings from './pages/admin/AdminBookings'
import AdminWorkers from './pages/admin/AdminWorkers'
import AdminCustomers from './pages/admin/AdminCustomers'

// Layout components
import Navbar from './components/common/Navbar'
import AdminLayout from './components/admin/AdminLayout'
import LoadingScreen from './components/common/LoadingScreen'

// Route guards
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

function AppRoutes() {
  const { isAdmin } = useAuth()
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<><Navbar /><HomePage /></>} />
      <Route path="/services" element={<><Navbar /><ServicesPage /></>} />
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* Protected customer routes */}
      <Route path="/book/:serviceId" element={<PrivateRoute><><Navbar /><BookingPage /></></PrivateRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><><Navbar /><DashboardPage /></></PrivateRoute>} />
      <Route path="/bookings/:id" element={<PrivateRoute><><Navbar /><BookingDetailPage /></></PrivateRoute>} />

      {/* Admin routes */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="workers" element={<AdminWorkers />} />
        <Route path="customers" element={<AdminCustomers />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
