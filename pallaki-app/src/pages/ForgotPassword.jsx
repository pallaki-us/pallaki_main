import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AuthLayout from '../components/auth/AuthLayout'

function validateEmail(email) {
  if (!email.trim()) return 'Email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.'
  return ''
}

// step: 'email' | 'otp' | 'password' | 'done'
export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [emailErr, setEmailErr] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpErr, setOtpErr] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwErr, setPwErr] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  async function handleEmailSubmit(e) {
    e.preventDefault()
    const err = validateEmail(email)
    if (err) { setEmailErr(err); return }
    setEmailErr('')
    setEmailLoading(true)

    const normalizedEmail = email.toLowerCase().trim()

    if (supabase) {
      const [{ data: isPlanner }, { data: isVendor }] = await Promise.all([
        supabase.rpc('check_email_exists', { check_email: normalizedEmail, check_type: 'planner' }),
        supabase.rpc('check_email_exists', { check_email: normalizedEmail, check_type: 'vendor' }),
      ])

      if (!isPlanner && !isVendor) {
        setEmailErr('There\'s no account with this email. Please try another email.')
        setEmailLoading(false)
        return
      }

      await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
    }

    setEmailLoading(false)
    setStep('otp')
  }

  async function handleOtpSubmit(e) {
    e.preventDefault()
    const code = otp.trim()
    if (code.length !== 8) { setOtpErr('Enter the 8-digit code from your email.'); return }
    setOtpErr('')
    setOtpLoading(true)
    const { error } = await supabase.auth.verifyOtp({
      email: email.toLowerCase().trim(),
      token: code,
      type: 'recovery',
    })
    setOtpLoading(false)
    if (error) { setOtpErr('Invalid or expired code. Please try again.'); return }
    setStep('password')
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    if (!password) { setPwErr('Password is required.'); return }
    if (password.length < 8) { setPwErr('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setPwErr('Passwords do not match.'); return }
    setPwErr('')
    setPwLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setPwLoading(false)
    if (error) { setPwErr(error.message); return }
    await supabase.auth.signOut()
    setStep('done')
    setTimeout(() => navigate('/planner/login'), 2500)
  }

  if (step === 'done') {
    return (
      <AuthLayout role="planner">
        <div className="auth-form auth-verify">
          <div className="auth-verify-icon">✅</div>
          <h1 className="auth-form-title">Password updated</h1>
          <p className="auth-verify-text">
            Your password has been changed. Redirecting you to sign in…
          </p>
        </div>
      </AuthLayout>
    )
  }

  if (step === 'password') {
    return (
      <AuthLayout role="planner">
        <form className="auth-form" onSubmit={handlePasswordSubmit} noValidate>
          <h1 className="auth-form-title">Set a new password</h1>
          <p className="auth-form-sub">Choose a strong password for your Pallaki account.</p>

          <div className="auth-field">
            <label htmlFor="fp-pw">New Password</label>
            <div className="auth-pw-wrap">
              <input
                id="fp-pw"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setPwErr('') }}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                className={pwErr ? 'err' : ''}
                autoFocus
              />
              <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(v => !v)}
                tabIndex={-1} aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="fp-confirm">Confirm Password</label>
            <div className="auth-pw-wrap">
              <input
                id="fp-confirm"
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setPwErr('') }}
                placeholder="Repeat your password"
                autoComplete="new-password"
                className={pwErr ? 'err' : ''}
              />
              <button type="button" className="auth-pw-toggle" onClick={() => setShowConfirm(v => !v)}
                tabIndex={-1} aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                {showConfirm ? '🙈' : '👁'}
              </button>
            </div>
            {pwErr && <span className="auth-field-err">{pwErr}</span>}
          </div>

          <button type="submit" className="auth-submit" disabled={pwLoading}>
            {pwLoading ? 'Updating…' : 'Update Password →'}
          </button>
        </form>
      </AuthLayout>
    )
  }

  if (step === 'otp') {
    return (
      <AuthLayout role="planner">
        <form className="auth-form" onSubmit={handleOtpSubmit} noValidate>
          <div className="auth-verify-icon">📬</div>
          <h1 className="auth-form-title">Check your inbox</h1>
          <p className="auth-verify-text">
            We sent a reset code to <strong>{email}</strong>. Enter it below.
          </p>

          <div className="auth-field">
            <label htmlFor="fp-otp">Reset code</label>
            <input
              id="fp-otp"
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setOtpErr('') }}
              placeholder="00000000"
              maxLength={8}
              autoComplete="one-time-code"
              className={`auth-otp-input${otpErr ? ' err' : ''}`}
              autoFocus
            />
            {otpErr && <span className="auth-field-err">{otpErr}</span>}
          </div>

          <button type="submit" className="auth-submit" disabled={otpLoading}>
            {otpLoading ? 'Verifying…' : 'Verify Code →'}
          </button>

          <p className="auth-verify-hint">
            Didn&apos;t receive it? Check your spam folder or{' '}
            <button type="button" className="auth-link"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              onClick={() => { setStep('email'); setOtp(''); setOtpErr('') }}>
              try again
            </button>.
          </p>
        </form>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout role="planner">
      <form className="auth-form" onSubmit={handleEmailSubmit} noValidate>
        <h1 className="auth-form-title">Reset your password</h1>
        <p className="auth-form-sub">
          Enter your email and we&apos;ll send you a code to reset your password.
        </p>

        <div className="auth-field">
          <label htmlFor="fp-email">Email</label>
          <input
            id="fp-email"
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setEmailErr('') }}
            placeholder="you@example.com"
            autoComplete="email"
            className={emailErr ? 'err' : ''}
          />
          {emailErr && <span className="auth-field-err">{emailErr}</span>}
        </div>

        <button type="submit" className="auth-submit" disabled={emailLoading}>
          {emailLoading ? 'Sending…' : 'Send Reset Code →'}
        </button>

        <p className="auth-form-footer">
          <Link to="/planner/login" className="auth-link">← Back to Sign In</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
