import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AuthLayout from '../components/auth/AuthLayout'

function validateEmail(email) {
  if (!email.trim()) return 'Email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.'
  return ''
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [emailErr, setEmailErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
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
    setSent(true)
  }

  return (
    <AuthLayout role="planner">
      {sent ? (
        <div className="auth-form auth-verify">
          <div className="auth-verify-icon">📨</div>
          <h1 className="auth-form-title">Check your inbox</h1>
          <p className="auth-verify-text">
            If an account exists for <strong>{email}</strong>, you&apos;ll receive a reset link shortly.
          </p>
          <p className="auth-verify-hint">
            Check your spam folder if you don&apos;t see it within a few minutes.
          </p>
          <Link to="/planner/login" className="auth-submit" style={{ textDecoration: 'none', textAlign: 'center' }}>
            Back to Sign In →
          </Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <h1 className="auth-form-title">Reset your password</h1>
          <p className="auth-form-sub">
            Enter your email and we&apos;ll send you a link to reset your password.
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
            {loading ? 'Sending…' : 'Send Reset Link →'}
          </button>

          <p className="auth-form-footer">
            <Link to="/planner/login" className="auth-link">← Back to Sign In</Link>
          </p>
        </form>
      )}
    </AuthLayout>
  )
}
