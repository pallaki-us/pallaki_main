import { useState } from 'react'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Nav from './components/Nav'
import AuthModal from './components/AuthModal'
import './index.css'

// pages (we'll build these next)
import Home from './pages/Home'
import Listing from './pages/Listing'
import Detail from './pages/Detail'
import Dashboard from './pages/Dashboard'
import PlannerProfile from './pages/PlannerProfile'

function AppInner() {
  const { user, userType } = useAuth()
  const [page, setPage] = useState('home')
  const [authOpen, setAuthOpen] = useState(false)
  const [authType, setAuthType] = useState('planner')
  const [listingCat, setListingCat] = useState('All')
  const [listingCity, setListingCity] = useState('')
  const [detailId, setDetailId] = useState(null)

  function showAuth(type = 'planner') {
    setAuthType(type)
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
    setPage('detail')
  }

  function goHome(target) {
    if (target === 'dashboard' || target === 'analytics') {
      setPage(target)
    } else {
      setPage('home')
    }
  }

  function onAuthSuccess(type) {
    if (type === 'vendor') setPage('dashboard')
    else showListing('All', '')
  }

  return (
    <>
      <Nav
        onShowListing={showListing}
        onShowAuth={showAuth}
        onGoHome={goHome}
        onEditProfile={() => setPage('planner-profile')}
      />

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultType={authType}
        onSuccess={onAuthSuccess}
      />

      {page === 'home' && (
        <Home
          onSearch={showListing}
          onShowAuth={showAuth}
          onShowDetail={showDetail}
          onShowListing={showListing}
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
          onBack={() => setPage('listing')}
          onShowAuth={showAuth}
        />
      )}
      {(page === 'dashboard' || page === 'analytics') && (
        <Dashboard
          activePage={page}
          onNavigate={setPage}
        />
      )}
      {page === 'planner-profile' && (
        <PlannerProfile
          onGoHome={() => setPage('home')}
          onBrowse={() => showListing('All', '')}
        />
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
