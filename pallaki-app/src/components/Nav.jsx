import { useAuth } from '../lib/AuthContext'

export default function Nav({ onShowListing, onShowAuth, onGoHome }) {
  const { user, userType, signOut } = useAuth()
  const name = user?.user_metadata?.name || user?.email?.split('@')[0] || ''

  return (
    <nav>
      <div className="logo-wrap" onClick={onGoHome}>
        <div className="logo-deva">पल्लकी</div>
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
        ) : (
          <div className="nav-user">
            <span className="nav-user-name">
              {userType === 'vendor' ? 'My Dashboard' : `Hi, ${name}`}
            </span>
            <div className="nav-user-av">{name.charAt(0).toUpperCase()}</div>
            <div className="nav-user-dd">
              {userType === 'planner' ? (
                <>
                  <div className="nav-user-dd-item" onClick={() => onShowListing('All', '')}>
                    🔍 Browse Vendors
                  </div>
                  <div className="nav-user-dd-div" />
                </>
              ) : (
                <>
                  <div className="nav-user-dd-item" onClick={() => onGoHome('dashboard')}>
                    📊 Dashboard
                  </div>
                  <div className="nav-user-dd-item" onClick={() => onGoHome('analytics')}>
                    📈 Analytics
                  </div>
                  <div className="nav-user-dd-div" />
                </>
              )}
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
