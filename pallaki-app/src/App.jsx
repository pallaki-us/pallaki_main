import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { supabase } from './lib/supabase'
import Nav from './components/Nav'
import './index.css'

import Home from './pages/Home'
import Listing from './pages/Listing'
import Detail from './pages/Detail'
import Dashboard from './pages/Dashboard'
import PlannerProfile from './pages/PlannerProfile'
import VendorOnboarding from './pages/VendorOnboarding'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import ForgotPassword from './pages/ForgotPassword'
import PlannerLogin from './pages/planner/Login'
import PlannerSignup from './pages/planner/Signup'
import VendorLogin from './pages/vendor/Login'
import VendorSignup from './pages/vendor/Signup'

// Redirects unauthenticated users to login, and wrong-role users to their correct page
function RequireAuth({ children, role }) {
  const { user, userType, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to={`/${role}/login`} replace />
  if (userType && userType !== '__verified__' && userType !== role) {
    return <Navigate to={userType === 'vendor' ? '/dashboard' : '/profile'} replace />
  }
  return children
}

function AppInner() {
  const { user, userType } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Post-email-verification: redirect to login with verified banner
  useEffect(() => {
    if (userType === '__verified__') {
      navigate('/planner/login?verified=true', { replace: true })
    }
  }, [userType])

  // Google OAuth: redirect planner after sign-in
  useEffect(() => {
    const oauthType = sessionStorage.getItem('pallaki_oauth_type')
    if (oauthType && user && userType === 'planner') {
      sessionStorage.removeItem('pallaki_oauth_type')
      navigate('/profile')
    }
  }, [user, userType])

  // Scroll to top on every route change
  useEffect(() => { window.scrollTo({ top: 0 }) }, [location.pathname])

  // Vendor on home or planner-only pages → redirect to dashboard
  useEffect(() => {
    const vendorOnlyPaths = ['/', '/profile']
    if (userType === 'vendor' && vendorOnlyPaths.includes(location.pathname)) {
      navigate('/dashboard')
    }
  }, [userType, location.pathname])

  async function showVendorListing() {
    if (!supabase) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return
    const { data } = await supabase
      .from('vendors').select('id')
      .eq('profile_id', session.user.id).single()
    if (data) navigate(`/vendor/${data.id}?own=true`)
  }

  const authPaths = ['/planner/login', '/planner/signup', '/vendor/login', '/vendor/signup', '/forgot-password']
  const isAuthPage = authPaths.includes(location.pathname)

  return (
    <>
      {!isAuthPage && <Nav onShowVendorListing={showVendorListing} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/vendors" element={<Listing />} />
        <Route path="/vendor/:id" element={<Detail />} />
        <Route path="/onboarding" element={<RequireAuth role="vendor"><VendorOnboarding /></RequireAuth>} />
        <Route path="/dashboard" element={<RequireAuth role="vendor"><Dashboard activePage="dashboard" onShowVendorListing={showVendorListing} /></RequireAuth>} />
        <Route path="/analytics" element={<RequireAuth role="vendor"><Dashboard activePage="analytics" onShowVendorListing={showVendorListing} /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth role="planner"><PlannerProfile /></RequireAuth>} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/planner/login" element={<PlannerLogin />} />
        <Route path="/planner/signup" element={<PlannerSignup />} />
        <Route path="/vendor/login" element={<VendorLogin />} />
        <Route path="/vendor/signup" element={<VendorSignup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
