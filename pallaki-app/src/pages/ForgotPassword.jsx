import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AuthLayout from '../components/auth/AuthLayout'

function validateEmail(email) {
  if (!email.trim()) return 'Email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.'
  return ''
}

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [emailErr, setEmailErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpErr, setOtpErr] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)

  async function handleEmailSubmit(e) {
    e.preventDefault()
    const err = validateEmail(email)
    if (err) { setEmailErr(err); return }
    setEmailErr('')
    setLoading(true)

    if (supabase) {
      await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })
    }

    setLoading(false)
    setCodeSent(true)
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
    if (error) {
      setOtpErr('Invalid or expired code. Please try again.')
      return
    }
    navigate('/reset-password')
  }

  if (codeSent) {
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
            <button type="button" className="auth-link" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              onClick={() => { setCodeSent(false); setOtp(''); setOtpErr('') }}>
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

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? 'Sending…' : 'Send Reset Code →'}
        </button>

        <p className="auth-form-footer">
          <Link to="/planner/login" className="auth-link">← Back to Sign In</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
