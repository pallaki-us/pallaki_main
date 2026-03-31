import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { supabase } from './lib/supabase'
import Nav from './components/Nav'
import AuthModal from './components/AuthModal'
import './index.css'

// pages (we'll build these next)
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
  const [page, setPage] = useState(() => {
    // will be corrected by the useEffect below once userType is known
    return 'home'
  })
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
  const [listingCat, setListingCat] = useState('All')
  const [listingCity, setListingCity] = useState('')
  const [detailId, setDetailId] = useState(null)
  const [detailIsOwn, setDetailIsOwn] = useState(false)

  // vendorBrowsing is true whenever a vendor is on a browsing page
  const vendorBrowsing = userType === 'vendor' && ['home', 'listing', 'detail'].includes(page)

  // Scroll to top on every page change
  useEffect(() => { window.scrollTo({ top: 0 }) }, [page])

  // When userType resolves, redirect vendor away from home
  useEffect(() => {
    if (userType === 'vendor' && (page === 'home' || page === 'planner-profile') && !vendorBrowsing) {
      setPage('dashboard')
    }
  }, [userType])

  function showAuth(type = 'planner', directSignup = false) {
    setAuthType(type)
    setAuthDirectSignup(directSignup)
    setAuthOpen(true)
  }

  function showListing(cat = 'All', city = '') {
    if (!user) { showAuth('planner'); return }
    setListingCat(cat)
    setListingCity(city)
    setPage('listing')
  }

  function showDetail(id) {
    if (!user) { showAuth('planner'); return }
    setDetailId(id)
    setDetailIsOwn(false)
    setPage('detail')
  }

  // Vendors can view their own listing page (read-only)
  async function showVendorListing() {
    if (!supabase) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return
    const { data } = await supabase
      .from('vendors')
      .select('id')
      .eq('profile_id', session.user.id)
      .single()
    if (data) { setDetailId(data.id); setDetailIsOwn(true); setPage('detail') }
  }

  function goHome(target) {
    if (target === 'dashboard' || target === 'analytics') {
      setPage(target)
    } else if (userType === 'vendor' && !vendorBrowsing) {
      setPage('dashboard')
    } else {
      setPage('home')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  async function onAuthSuccess(type) {
    if (!supabase) {
      if (type === 'vendor') setPage('vendor-onboarding')
      else showListing('All', '')
      return
    }
    // Always re-fetch from profiles to get the real user_type
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
      if (vendorRow) { setPage('dashboard') }
      else { setPage('vendor-onboarding') }
    } else {
      setPage('planner-profile')
    }
  }

  return (
    <>
      <Nav
        onShowListing={showListing}
        onShowAuth={showAuth}
        onGoHome={goHome}
        onEditProfile={() => setPage('planner-profile')}
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
        onShowPrivacy={() => setPage('privacy')}
        onShowTerms={() => setPage('terms')}
      />

      {page === 'home' && (
        <Home
          onSearch={showListing}
          onShowAuth={showAuth}
          onShowDetail={showDetail}
          onShowListing={showListing}
          onShowPrivacy={() => setPage('privacy')}
          onShowTerms={() => setPage('terms')}
        />
      )}
      {page === 'listing' && (
        <Listing
          initCat={listingCat}
          initCity={listingCity}
          onShowDetail={showDetail}
          onGoHome={() => setPage('home')}
        />
      )}
      {page === 'detail' && (
        <Detail
          vendorId={detailId}
          onBack={detailIsOwn ? () => setPage('dashboard') : () => setPage('listing')}
          onShowAuth={showAuth}
          isOwnListing={detailIsOwn}
        />
      )}
      {page === 'vendor-onboarding' && (
        <VendorOnboarding onComplete={() => setPage('dashboard')} />
      )}
      {(page === 'dashboard' || page === 'analytics') && (
        <Dashboard
          activePage={page}
          onNavigate={setPage}
          onShowDetail={showDetail}
          onBrowseWebsite={() => setPage('home')}
          onShowVendorListing={showVendorListing}
        />
      )}
      {page === 'planner-profile' && (
        <PlannerProfile
          onGoHome={() => setPage('home')}
          onBrowse={() => showListing('All', '')}
        />
      )}
      {page === 'privacy' && (
        <Privacy onClose={() => setPage('home')} />
      )}
      {page === 'terms' && (
        <Terms onClose={() => setPage('home')} onShowPrivacy={() => setPage('privacy')} />
      )}
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

