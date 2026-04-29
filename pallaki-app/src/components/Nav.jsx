import { useState } from 'react'
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

  async function handleSignOut() {
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
            <div className="nav-user">
              <span className="nav-user-name">My Dashboard</span>
              <div className="nav-user-av">{name.charAt(0).toUpperCase()}</div>
              <div className="nav-user-dd">
                <div className="nav-user-dd-item" onClick={() => navigate('/dashboard')}>
                  📊 Back to Dashboard
                </div>
                <div className="nav-user-dd-item" onClick={() => navigate('/analytics')}>
                  💌 Conversations
                </div>
                <div className="nav-user-dd-item" onClick={onShowVendorListing}>
                  🔍 See Your Listing
                </div>
                <div className="nav-user-dd-div" />
                <div className="nav-user-dd-item danger" onClick={handleSignOut}>
                  ← Sign Out
                </div>
              </div>
            </div>
          ) : (
            <div className="nav-user">
              <span className="nav-user-name">{`Hi, ${name}`}</span>
              <div className="nav-user-av">{name.charAt(0).toUpperCase()}</div>
              <div className="nav-user-dd">
                <div className="nav-user-dd-item" onClick={() => navigate('/profile')}>
                  ✎ Edit Profile
                </div>
                <div className="nav-user-dd-item" onClick={() => navigate('/conversations')}>
                  💌 My Conversations
                </div>
                <div className="nav-user-dd-item" onClick={() => navigate('/vendors')}>
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
