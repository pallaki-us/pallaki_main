import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { supabase } from './lib/supabase'
import Nav from './components/Nav'
import AuthModal from './components/AuthModal'
import './index.css'

import Home from './pages/Home'
import Listing from './pages/Listing'
import Detail from './pages/Detail'
import Dashboard from './pages/Dashboard'
import PlannerProfile from './pages/PlannerProfile'
import VendorOnboarding from './pages/VendorOnboarding'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'

function AppInner() {
  const { user, userType } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [authOpen, setAuthOpen] = useState(false)
  const [authType, setAuthType] = useState('planner')
  const [authDirectSignup, setAuthDirectSignup] = useState(false)
  const [authDirectLogin, setAuthDirectLogin] = useState(false)

  // Detect post-verification: show sign-in modal
  useEffect(() => {
    if (userType === '__verified__') {
      setAuthType('planner')
      setAuthDirectSignup(false)
      setAuthDirectLogin(true)
      setAuthOpen(true)
    }
  }, [userType])

  // Handle post-Google-OAuth redirect
  useEffect(() => {
    const oauthType = sessionStorage.getItem('pallaki_oauth_type')
    if (oauthType && user && userType === 'planner') {
      sessionStorage.removeItem('pallaki_oauth_type')
      navigate('/profile')
    }
  }, [user, userType])

  // Scroll to top on every route change
  useEffect(() => { window.scrollTo({ top: 0 }) }, [location.pathname])

  // When a vendor lands on a non-vendor page, redirect to dashboard
  const browsePaths = ['/', '/vendors', '/vendor']
  const isVendorBrowsing = userType === 'vendor' && browsePaths.some(p => location.pathname.startsWith(p))
  useEffect(() => {
    const onVendorPage = location.pathname === '/' || location.pathname === '/profile'
    if (userType === 'vendor' && onVendorPage && !isVendorBrowsing) {
      navigate('/dashboard')
    }
  }, [userType])

  function showAuth(type = 'planner', directSignup = false) {
    setAuthType(type)
    setAuthDirectSignup(directSignup)
    setAuthOpen(true)
  }

  async function showVendorListing() {
    if (!supabase) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return
    const { data } = await supabase
      .from('vendors')
      .select('id')
      .eq('profile_id', session.user.id)
      .single()
    if (data) navigate(`/vendor/${data.id}?own=true`)
  }

  async function onAuthSuccess(type) {
    if (!supabase) {
      if (type === 'vendor') navigate('/onboarding')
      else navigate('/vendors')
      return
    }
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', session.user.id)
      .single()

    const resolvedType = profile?.user_type || type

    if (resolvedType === 'vendor') {
      const { data: vendorRow } = await supabase
        .from('vendors')
        .select('id')
        .eq('profile_id', session.user.id)
        .single()
      navigate(vendorRow ? '/dashboard' : '/onboarding')
    } else {
      navigate('/profile')
    }
  }

  return (
    <>
      <Nav
        onShowAuth={showAuth}
        onShowVendorListing={showVendorListing}
      />

      <AuthModal
        open={authOpen}
        onClose={() => { setAuthOpen(false); setAuthDirectLogin(false) }}
        defaultType={authType}
        vendorOnly={authType === 'vendor'}
        directSignup={authDirectSignup}
        directLogin={authDirectLogin}
        onSuccess={onAuthSuccess}
      />

      <Routes>
        <Route path="/" element={<Home onShowAuth={showAuth} />} />
        <Route path="/vendors" element={<Listing onShowAuth={showAuth} />} />
        <Route path="/vendor/:id" element={<Detail onShowAuth={showAuth} />} />
        <Route path="/onboarding" element={<VendorOnboarding />} />
        <Route path="/dashboard" element={<Dashboard activePage="dashboard" onShowVendorListing={showVendorListing} />} />
        <Route path="/analytics" element={<Dashboard activePage="analytics" onShowVendorListing={showVendorListing} />} />
        <Route path="/profile" element={<PlannerProfile />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
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
