import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import AnimatedLogo from './AnimatedLogo'
import PalanquinProcession from './PalanquinProcession'
import NotificationBell from './NotificationBell'

export default function Nav({ onShowVendorListing }) {
  const { user, userType, signOut } = useAuth()
  const navigate = useNavigate()
  const name = user?.user_metadata?.name || user?.email?.split('@')[0] || ''
  const [menuOpen, setMenuOpen] = useState(false)
  const [ddOpen, setDdOpen] = useState(false)
  const ddRef = useRef(null)

  useEffect(() => {
    if (!ddOpen) return
    function handleOutside(e) {
      if (ddRef.current && !ddRef.current.contains(e.target)) setDdOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [ddOpen])

  async function handleSignOut() {
    setDdOpen(false)
    await signOut()
    navigate('/')
    setMenuOpen(false)
  }

  function goHome() {
    if (userType === 'vendor') navigate('/dashboard')
    else navigate('/')
    setMenuOpen(false)
  }

  function navTo(path) {
    navigate(path)
    setMenuOpen(false)
  }

  return (
    <>
      <nav>
        <div className="logo-wrap" onClick={goHome} style={{ width: 120, flexShrink: 0 }}>
          <AnimatedLogo size="2rem" color="var(--v)" />
        </div>
        <div style={{ flex: 1, overflow: 'hidden', height: '100%', display: 'flex', alignItems: 'center' }}>
          <video
            src={`${import.meta.env.BASE_URL}procession.mp4`}
            autoPlay
            loop
            muted
            playsInline
            style={{ height: 44, width: '100%', objectFit: 'contain' }}
          />
        </div>
        <div className="nav-r">
          {user && <NotificationBell userType={userType} />}
          {!user ? (
            <>
              <button className="nl nav-vendor" onClick={() => navigate('/vendor/signup')}>
                List Your Business
              </button>
              <button className="nl nav-login" onClick={() => navigate('/planner/login')}>
                Sign In
              </button>
              <button className="nav-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
                {menuOpen ? '✕' : '☰'}
              </button>
            </>
          ) : userType === 'vendor' ? (
            <div ref={ddRef} className={`nav-user${ddOpen ? ' open' : ''}`} onClick={() => setDdOpen(o => !o)}>
              <span className="nav-user-name">My Dashboard</span>
              <div className="nav-user-av">{name.charAt(0).toUpperCase()}</div>
              <div className="nav-user-dd" onClick={e => e.stopPropagation()}>
                <div className="nav-user-dd-item" onClick={() => { navigate('/dashboard'); setDdOpen(false) }}>
                  📊 Back to Dashboard
                </div>
                <div className="nav-user-dd-item" onClick={() => { navigate('/analytics'); setDdOpen(false) }}>
                  💌 Conversations
                </div>
                <div className="nav-user-dd-item" onClick={() => { onShowVendorListing(); setDdOpen(false) }}>
                  🔍 See Your Listing
                </div>
                <div className="nav-user-dd-div" />
                <div className="nav-user-dd-item danger" onClick={handleSignOut}>
                  ← Sign Out
                </div>
              </div>
            </div>
          ) : (
            <div ref={ddRef} className={`nav-user${ddOpen ? ' open' : ''}`} onClick={() => setDdOpen(o => !o)}>
              <span className="nav-user-name">{`Hi, ${name}`}</span>
              <div className="nav-user-av">{name.charAt(0).toUpperCase()}</div>
              <div className="nav-user-dd" onClick={e => e.stopPropagation()}>
                <div className="nav-user-dd-item" onClick={() => { navigate('/profile'); setDdOpen(false) }}>
                  ✎ Edit Profile
                </div>
                <div className="nav-user-dd-item" onClick={() => { navigate('/conversations'); setDdOpen(false) }}>
                  💌 My Conversations
                </div>
                <div className="nav-user-dd-item" onClick={() => { navigate('/vendors'); setDdOpen(false) }}>
                  🔍 Browse Vendors
                </div>
                <div className="nav-user-dd-div" />
                <div className="nav-user-dd-item danger" onClick={handleSignOut}>
                  ← Sign Out
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile menu — shown only when hamburger is open (logged-out state) */}
      {!user && (
        <div className={`nav-mobile-menu${menuOpen ? ' open' : ''}`}>
          <button className="nav-mobile-item primary" onClick={() => navTo('/planner/login')}>
            Sign In
          </button>
          <button className="nav-mobile-item outline" onClick={() => navTo('/vendor/signup')}>
            List Your Business
          </button>
        </div>
      )}
    </>
  )
}
