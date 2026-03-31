import { useAuth } from '../lib/AuthContext'
import AnimatedLogo from './AnimatedLogo'
import PalanquinProcession from './PalanquinProcession'

export default function Nav({ onShowListing, onShowAuth, onGoHome, onEditProfile, onShowVendorListing }) {
  const { user, userType, signOut } = useAuth()
  const name = user?.user_metadata?.name || user?.email?.split('@')[0] || ''

  return (
    <nav>
      <div className="logo-wrap" onClick={onGoHome} style={{ width: 120, flexShrink: 0 }}>
        <AnimatedLogo size="2rem" color="var(--v)" onClick={onGoHome} />
      </div>
      <div style={{ flex: 1, overflow: 'hidden', height: '100%', display: 'flex', alignItems: 'center' }}>
        <video
          src="/pallaki_main/procession.mp4"
          autoPlay
          loop
          muted
          playsInline
          style={{ height: 44, width: '100%', objectFit: 'contain', objectPosition: 'center' }}
        />
      </div>
      <div className="nav-r">
        {!user ? (
          <>
            <button className="nl nav-vendor" onClick={() => onShowAuth('vendor')}>
              List Your Business
            </button>
            <button className="nl nav-login" onClick={() => onShowAuth('planner')}>
              Sign In
            </button>
          </>
        ) : userType === 'vendor' ? (
          <div className="nav-user">
            <span className="nav-user-name">My Dashboard</span>
            <div className="nav-user-av">{name.charAt(0).toUpperCase()}</div>
            <div className="nav-user-dd">
              <div className="nav-user-dd-item" onClick={() => onGoHome('dashboard')}>
                📊 Back to Dashboard
              </div>
              <div className="nav-user-dd-item" onClick={() => onGoHome('analytics')}>
                📈 Analytics
              </div>
              <div className="nav-user-dd-item" onClick={onShowVendorListing}>
                🔍 See Your Listing
              </div>
              <div className="nav-user-dd-div" />
              <div className="nav-user-dd-item danger" onClick={signOut}>
                ← Sign Out
              </div>
            </div>
          </div>
        ) : (
          <div className="nav-user">
            <span className="nav-user-name">{`Hi, ${name}`}</span>
            <div className="nav-user-av">{name.charAt(0).toUpperCase()}</div>
            <div className="nav-user-dd">
              <div className="nav-user-dd-item" onClick={onEditProfile}>
                ✎ Edit Profile
              </div>
              <div className="nav-user-dd-item" onClick={() => onShowListing('All', '')}>
                🔍 Browse Vendors
              </div>
              <div className="nav-user-dd-div" />
              <div className="nav-user-dd-item danger" onClick={signOut}>
                ← Sign Out
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
