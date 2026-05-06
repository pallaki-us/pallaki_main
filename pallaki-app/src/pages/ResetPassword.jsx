import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import AuthLayout from '../components/auth/AuthLayout'

export default function ResetPassword() {
  const navigate = useNavigate()
  const { user, loading, signOut } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pwErr, setPwErr] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!password) { setPwErr('Password is required.'); return }
    if (password.length < 8) { setPwErr('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setPwErr('Passwords do not match.'); return }
    setPwErr('')
    setSubmitting(true)

    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setPwErr(error.message); setSubmitting(false); return }

    setDone(true)
    setSubmitting(false)
    signOut()
    setTimeout(() => navigate('/planner/login'), 2500)
  }

  if (loading) {
    return (
      <AuthLayout role="planner">
        <div className="auth-form auth-verify">
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--br)', borderTopColor: 'var(--v)', animation: 'spin 0.7s linear infinite', margin: '2rem auto' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </AuthLayout>
    )
  }

  if (!user) {
    return (
      <AuthLayout role="planner">
        <div className="auth-form auth-verify">
          <div className="auth-verify-icon">🔗</div>
          <h1 className="auth-form-title">Code expired</h1>
          <p className="auth-verify-text">
            This reset session is invalid or has expired.
          </p>
          <Link to="/forgot-password" className="auth-submit" style={{ textDecoration: 'none', textAlign: 'center' }}>
            Request a new code →
          </Link>
        </div>
      </AuthLayout>
    )
  }

  if (done) {
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

  return (
    <AuthLayout role="planner">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <h1 className="auth-form-title">Set a new password</h1>
        <p className="auth-form-sub">Choose a strong password for your Pallaki account.</p>

        <div className="auth-field">
          <label htmlFor="rp-password">New Password</label>
          <input
            id="rp-password"
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setPwErr('') }}
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            className={pwErr ? 'err' : ''}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="rp-confirm">Confirm Password</label>
          <input
            id="rp-confirm"
            type="password"
            value={confirm}
            onChange={e => { setConfirm(e.target.value); setPwErr('') }}
            placeholder="Repeat your password"
            autoComplete="new-password"
            className={pwErr ? 'err' : ''}
          />
          {pwErr && <span className="auth-field-err">{pwErr}</span>}
        </div>

        <button type="submit" className="auth-submit" disabled={submitting}>
          {submitting ? 'Updating…' : 'Update Password →'}
        </button>
      </form>
    </AuthLayout>
  )
}
