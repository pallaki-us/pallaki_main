import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'
import { supabase } from '../../lib/supabase'
import RoleToggle from './RoleToggle'

function validate(email, password) {
  const errs = {}
  if (!email.trim()) errs.email = 'Email is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Enter a valid email address.'
  if (!password) errs.password = 'Password is required.'
  return errs
}

export default function LoginForm({ role }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, userType, signIn, signInWithGoogle } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  const isVendor = role === 'vendor'
  const justVerified = searchParams.get('verified') === 'true'
  const wrongRole = searchParams.get('wrongrole')

  // Redirect already-logged-in users away from auth pages
  useEffect(() => {
    if (user && userType && userType !== '__verified__') {
      navigate(userType === 'vendor' ? '/dashboard' : '/profile', { replace: true })
    }
  }, [user, userType])

  async function handleSubmit(e) {
    e?.preventDefault()
    const errs = validate(email, password)
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    setFieldErrors({})
    setFormError('')
    setLoading(true)

    const normalizedEmail = email.toLowerCase().trim()

    // Check if email is registered — and detect wrong-role attempts
    if (supabase) {
      const { data: exists } = await supabase.rpc('check_email_exists', {
        check_email: normalizedEmail,
        check_type: role,
      })
      if (!exists) {
        const otherRole = role === 'vendor' ? 'planner' : 'vendor'
        const { data: existsOther } = await supabase.rpc('check_email_exists', {
          check_email: normalizedEmail,
          check_type: otherRole,
        })
        setLoading(false)
        setFormError(
          existsOther
            ? `This email is registered as a ${otherRole}. Please sign in at the ${otherRole} portal.`
            : 'No account found for this email. Please sign up first.'
        )
        return
      }
    }

    const { error, actualType } = await signIn(normalizedEmail, password)
    setLoading(false)

    if (error) {
      setFormError(
        error.message === 'Invalid login credentials'
          ? 'Incorrect email or password.'
          : error.message
      )
      return
    }

    // Role confusion guard (belt-and-suspenders)
    if (actualType && actualType !== role) {
      setFormError(
        `This email is registered as a ${actualType}. Please sign in at the ${actualType} portal.`
      )
      return
    }

    // Post-login redirect
    if (actualType === 'vendor') {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession()
        const { data: vendorRow } = await supabase
          .from('vendors').select('id, category')
          .eq('profile_id', session.user.id).maybeSingle()
        navigate(vendorRow?.category ? '/dashboard' : '/onboarding')
      } else {
        navigate('/dashboard')
      }
    } else {
      navigate('/profile')
    }
  }

  async function handleGoogle() {
    sessionStorage.setItem('pallaki_oauth_type', 'planner')
    await signInWithGoogle()
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <RoleToggle role={role} page="login" />

      <h1 className="auth-form-title">
        {isVendor ? 'Sign in to your vendor account' : 'Welcome back'}
      </h1>
      <p className="auth-form-sub">
        {isVendor
          ? 'Access your dashboard, manage inquiries, and update your listing.'
          : 'Browse vendors and manage your event planning.'}
      </p>

      {justVerified && (
        <div className="auth-banner auth-banner-success">
          ✓ Email verified! You can now sign in.
        </div>
      )}

      {wrongRole && !formError && (
        <div className="auth-banner auth-banner-error">
          This email is registered as a {wrongRole}. Please sign in at the {wrongRole} portal.
        </div>
      )}

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
        <label htmlFor="lf-email">Email</label>
        <input
          id="lf-email"
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
        <div className="auth-field-label-row">
          <label htmlFor="lf-pw">Password</label>
          <Link to="/forgot-password" className="auth-link-sm">Forgot password?</Link>
        </div>
        <div className="auth-pw-wrap">
          <input
            id="lf-pw"
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })) }}
            placeholder=""
            autoComplete="current-password"
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

      <button type="submit" className="auth-submit" disabled={loading}>
        {loading ? 'Signing in…' : 'Sign In →'}
      </button>

      <p className="auth-form-footer">
        Don&apos;t have an account?{' '}
        <Link to={`/${role}/signup`} className="auth-link">Create one</Link>
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
