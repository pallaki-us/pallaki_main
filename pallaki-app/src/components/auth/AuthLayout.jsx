import { useNavigate } from 'react-router-dom'
import AnimatedLogo from '../AnimatedLogo'

export default function AuthLayout({ role, children }) {
  const navigate = useNavigate()
  const isVendor = role === 'vendor'

  return (
    <div className={`auth-page${isVendor ? ' auth-vendor' : ' auth-planner'}`}>
      <div className="auth-left" onClick={() => navigate('/')} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && navigate('/')}>
        <AnimatedLogo size="2.4rem" color={isVendor ? 'var(--gl)' : 'var(--vl)'} />
        <h2 className="auth-left-title">
          {isVendor
            ? 'Grow your business with Pallaki'
            : 'Find perfect vendors for your celebration'}
        </h2>
        <p className="auth-left-sub">
          {isVendor
            ? 'Connect with couples and families planning South Asian events across America.'
            : 'Discover trusted South Asian vendors for weddings and celebrations across the US.'}
        </p>
        <div className="auth-left-deco">{isVendor ? '🪔' : '🌸'}</div>
      </div>
      <div className="auth-right">
        <div className="auth-form-wrap">
          {children}
        </div>
      </div>
    </div>
  )
}
