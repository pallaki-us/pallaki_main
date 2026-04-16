import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'
import RoleToggle from './RoleToggle'

function validate(name, email, password, isVendor) {
  const errs = {}
  const nameLabel = isVendor ? 'Business name' : 'First name'
  if (!name.trim()) errs.name = `${nameLabel} is required.`
  if (!email.trim()) errs.email = 'Email is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Enter a valid email address.'
  if (!password) errs.password = 'Password is required.'
  else if (password.length < 8) errs.password = 'Password must be at least 8 characters.'
  return errs
}

export default function SignupForm({ role }) {
  const navigate = useNavigate()
  const { user, userType, signUp, signInWithGoogle } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifyEmail, setVerifyEmail] = useState('')

  const isVendor = role === 'vendor'

  // Redirect already-logged-in users away from auth pages
  useEffect(() => {
    if (user && userType && userType !== '__verified__') {
      navigate(userType === 'vendor' ? '/onboarding' : '/profile', { replace: true })
    }
  }, [user, userType])

  async function handleSubmit(e) {
    e?.preventDefault()
    const errs = validate(name, email, password, isVendor)
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    setFieldErrors({})
    setFormError('')
    setLoading(true)

    const { error } = await signUp(email.toLowerCase().trim(), password, role, name.trim())
    setLoading(false)

    if (error) {
      const msg = error.message?.toLowerCase() || ''
      if (msg.includes('already registered') || msg.includes('user already exists') || msg.includes('already been registered')) {
        setFormError('An account with this email already exists. Sign in instead.')
      } else {
        setFormError(error.message)
      }
      return
    }

    setVerifyEmail(email.toLowerCase().trim())
  }

  async function handleGoogle() {
    sessionStorage.setItem('pallaki_oauth_type', 'planner')
    await signInWithGoogle()
  }

  // Post-signup: show email verification prompt
  if (verifyEmail) {
    return (
      <div className="auth-form auth-verify">
        <div className="auth-verify-icon">📬</div>
        <h1 className="auth-form-title">Check your inbox</h1>
        <p className="auth-verify-text">We sent a verification link to</p>
        <p className="auth-verify-email">{verifyEmail}</p>
        <p className="auth-verify-hint">
          Click the link in the email to activate your account. Check your spam folder if you don&apos;t see it within a few minutes.
        </p>
        <button className="auth-submit" onClick={() => navigate(`/${role}/login`)}>
          Go to Sign In →
        </button>
      </div>
    )
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <RoleToggle role={role} page="signup" />

      <h1 className="auth-form-title">
        {isVendor ? 'List your business on Pallaki' : 'Create your free account'}
      </h1>
      <p className="auth-form-sub">
        {isVendor
          ? 'Reach couples and families planning South Asian events.'
          : 'Browse vendors and start planning your perfect event.'}
      </p>

      {formError && (
        <div className="auth-banner auth-banner-error">{formError}</div>
      )}

      {!isVendor && (
        <>
          <button type="button" className="auth-google-btn" onClick={handleGoogle}>
            <GoogleIcon />
            Continue with Google
          </button>
          <div className="auth-divider"><span>or</span></div>
        </>
      )}

      <div className="auth-field">
        <label htmlFor="sf-name">{isVendor ? 'Business Name' : 'First Name'}</label>
        <input
          id="sf-name"
          type="text"
          value={name}
          onChange={e => { setName(e.target.value); setFieldErrors(p => ({ ...p, name: '' })) }}
          placeholder=""
          autoComplete={isVendor ? 'organization' : 'given-name'}
          className={fieldErrors.name ? 'err' : ''}
        />
        {fieldErrors.name && <span className="auth-field-err">{fieldErrors.name}</span>}
      </div>

      <div className="auth-field">
        <label htmlFor="sf-email">{isVendor ? 'Business Email' : 'Email'}</label>
        <input
          id="sf-email"
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: '' })) }}
          placeholder=""
          autoComplete="email"
          className={fieldErrors.email ? 'err' : ''}
        />
        {fieldErrors.email && <span className="auth-field-err">{fieldErrors.email}</span>}
      </div>

      <div className="auth-field">
        <label htmlFor="sf-pw">Password</label>
        <div className="auth-pw-wrap">
          <input
            id="sf-pw"
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })) }}
            placeholder=""
            autoComplete="new-password"
            className={fieldErrors.password ? 'err' : ''}
          />
          <button
            type="button"
            className="auth-pw-toggle"
            onClick={() => setShowPw(v => !v)}
            tabIndex={-1}
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw ? '🙈' : '👁'}
          </button>
        </div>
        {fieldErrors.password && <span className="auth-field-err">{fieldErrors.password}</span>}
      </div>

      <p className="auth-terms">
        By signing up you agree to our{' '}
        <Link to="/terms" className="auth-link">Terms & Conditions</Link>
        {' '}and{' '}
        <Link to="/privacy" className="auth-link">Privacy Policy</Link>
      </p>

      <button type="submit" className="auth-submit" disabled={loading}>
        {loading ? 'Creating account…' : 'Create Account →'}
      </button>

      <p className="auth-form-footer">
        Already have an account?{' '}
        <Link to={`/${role}/login`} className="auth-link">Sign in</Link>
      </p>
    </form>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
