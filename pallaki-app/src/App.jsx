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
import PlannerConversations from './pages/PlannerConversations'
import VendorOnboarding from './pages/VendorOnboarding'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import PlannerLogin from './pages/planner/Login'
import PlannerSignup from './pages/planner/Signup'
import VendorLogin from './pages/vendor/Login'
import VendorSignup from './pages/vendor/Signup'

// Redirects unauthenticated users to login, and wrong-role users to their correct page
function RequireAuth({ children, role }) {
  const { user, userType, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to={`/${role}/login`} replace />
  // user is known but userType is still loading — show a small inline spinner
  if (!userType || userType === '__verified__') {
    if (userType === '__verified__') return null
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--cr)' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--br)', borderTopColor: 'var(--v)', animation: 'spin 0.7s linear infinite' }} />
      </div>
    )
  }
  if (userType !== role) {
    return <Navigate to={userType === 'vendor' ? '/dashboard' : '/vendors'} replace />
  }
  return children
}

function AppInner() {
  const { user, userType, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Scroll to top on every route change
  useEffect(() => { window.scrollTo({ top: 0 }) }, [location.pathname])

  // Single effect handles all auth-driven redirects in priority order
  useEffect(() => {
    if (!userType) return

    // 1. Post-email-verification
    if (userType === '__verified__') {
      navigate('/planner/login?verified=true', { replace: true })
      return
    }

    // 2. Google OAuth — must run before vendor redirect to avoid race
    const oauthIntended = sessionStorage.getItem('pallaki_oauth_type')
    if (oauthIntended) {
      sessionStorage.removeItem('pallaki_oauth_type')
      if (userType !== oauthIntended) {
        signOut()
        navigate(`/${oauthIntended}/login?wrongrole=${userType}`, { replace: true })
      } else if (userType === 'vendor') {
        navigate('/dashboard', { replace: true })
      } else {
        const isNewGoogleUser = sessionStorage.getItem('pallaki_google_new_signup')
        sessionStorage.removeItem('pallaki_google_new_signup')
        navigate(isNewGoogleUser ? '/profile' : '/vendors', { replace: true })
      }
      return
    }

    // 3. Vendor landing on planner-only page
    if (userType === 'vendor' && location.pathname === '/profile') {
      navigate('/dashboard', { replace: true })
    }
  }, [userType, location.pathname])

  async function showVendorListing() {
    if (!supabase) { navigate('/vendor/1?own=true'); return }
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return
    const { data } = await supabase
      .from('vendors').select('id')
      .eq('profile_id', session.user.id).single()
    if (data) navigate(`/vendor/${data.id}?own=true`)
  }

  const authPaths = ['/planner/login', '/planner/signup', '/vendor/login', '/vendor/signup', '/forgot-password', '/reset-password']
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
        <Route path="/conversations" element={<RequireAuth role="planner"><PlannerConversations /></RequireAuth>} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/planner/login" element={<PlannerLogin />} />
        <Route path="/planner/signup" element={<PlannerSignup />} />
        <Route path="/vendor/login" element={<VendorLogin />} />
        <Route path="/vendor/signup" element={<VendorSignup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
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
