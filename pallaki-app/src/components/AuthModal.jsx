import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { showToast } from '../lib/toast'
import AnimatedLogo from './AnimatedLogo'

export default function AuthModal({ open, onClose, defaultType = 'planner', onSuccess, onShowPrivacy, onShowTerms, vendorOnly = false, directSignup = false, directLogin = false }) {
  const { signIn, signUp, setUserType } = useAuth()
  const [type, setType] = useState(defaultType)
  const [screen, setScreen] = useState(() => {
    if (directSignup && defaultType === 'vendor') return 'vendor-signup'
    if (vendorOnly) return 'vendor-choice'
    return `${defaultType}-choice`
  })

  // Reset screen when modal opens
  useEffect(() => {
    if (open) {
      if (directSignup && defaultType === 'vendor') setScreen('vendor-signup')
      else if (directLogin) setScreen(`${defaultType}-login`)
      else if (vendorOnly) setScreen('vendor-choice')
      else setScreen(`${defaultType}-choice`)
      setType(defaultType)
      setFname(''); setEmail(''); setPassword(''); setBizName('')
    }
  }, [open])
  const [verifyEmail, setVerifyEmail] = useState('')

  // form fields
  const [fname, setFname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [bizName, setBizName] = useState('')

  if (!open) return null

  function switchType(t) {
    setType(t)
    setScreen(`${t}-choice`)
  }

  async function handlePlannerSignup() {
    if (!fname || !email || !password) return showToast('Please fill in all fields.')
    if (password.length < 8) return showToast('Password must be at least 8 characters.')
    const { error } = await signUp(email, password, 'planner', fname)
    if (error) return showToast(error.message)
    setUserType('planner')
    setVerifyEmail(email)
    setScreen('verify')
  }

  async function handlePlannerLogin() {
    if (!email || !password) return showToast('Please enter your email and password.')
    const { error } = await signIn(email, password)
    if (error) return showToast(error.message)
    onClose()
    onSuccess('planner')
  }

  async function handleVendorSignup() {
    if (!bizName || !email || !password) return showToast('Please fill in all fields.')
    if (password.length < 8) return showToast('Password must be at least 8 characters.')
    const { error } = await signUp(email, password, 'vendor', bizName)
    if (error) return showToast(error.message)
    setUserType('vendor')
    setVerifyEmail(email)
    setScreen('verify')
  }

  async function handleVendorLogin() {
    if (!email || !password) return showToast('Please enter your email and password.')
    const { error } = await signIn(email, password)
    if (error) return showToast(error.message)
    onClose()
    onSuccess('vendor')
  }

  function resetFields() {
    setFname(''); setEmail(''); setPassword(''); setBizName('')
  }

  function goScreen(s) { resetFields(); setScreen(s) }

  return (
    <div className="auth-modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal">
        <div className="auth-modal-head">
          <button className="auth-modal-close" onClick={onClose}>✕</button>
          <span className="auth-modal-logo"><AnimatedLogo size="1.8rem" color="var(--gl)" /></span>
          <h3>{type === 'vendor' ? 'Grow with Pallaki' : 'Welcome to Pallaki'}</h3>
          <div className="modal-type-tabs">
            {!vendorOnly && (
              <button className={`modal-type-tab${type === 'planner' ? ' act' : ''}`} onClick={() => switchType('planner')}>
                👰 Event Planner
              </button>
            )}
            <button className={`modal-type-tab${type === 'vendor' ? ' act' : ''}`} onClick={() => switchType('vendor')}>
              💼 Vendor
            </button>
          </div>
        </div>

        <div className="auth-modal-body">
          {/* Planner choice */}
          {screen === 'planner-choice' && (
            <div className="auth-choice-row">
              <button className="auth-choice-btn auth-choice-btn-primary" onClick={() => goScreen('planner-signup')}>
                <span className="auth-choice-icon">🌸</span>
                <div className="auth-choice-text"><strong>Create a Free Account</strong><span>Browse vendors & plan your event</span></div>
              </button>
              <button className="auth-choice-btn auth-choice-btn-secondary" onClick={() => goScreen('planner-login')}>
                <span className="auth-choice-icon">🔑</span>
                <div className="auth-choice-text"><strong>Sign In</strong><span>Already have an account?</span></div>
              </button>
            </div>
          )}

          {/* Planner signup */}
          {screen === 'planner-signup' && (
            <div className="modal-form">
              <div className="modal-field"><label>First Name</label><input value={fname} onChange={e => setFname(e.target.value)} placeholder="Priya" /></div>
              <div className="modal-field"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="priya@email.com" /></div>
              <div className="modal-field"><label>Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" /></div>
              <p style={{ fontSize: '.72rem', color: 'var(--tl)', textAlign: 'center', lineHeight: 1.6 }}>
                By signing up you agree to our{' '}
                <span style={{ color: 'var(--v)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { onClose(); onShowTerms?.() }}>Terms & Conditions</span>
                {' '}and{' '}
                <span style={{ color: 'var(--v)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { onClose(); onShowPrivacy?.() }}>Privacy Policy</span>
              </p>
              <button className="modal-submit" onClick={handlePlannerSignup}>Create Account →</button>
              <button className="modal-back" onClick={() => goScreen('planner-choice')}>← Back</button>
            </div>
          )}

          {/* Planner login */}
          {screen === 'planner-login' && (
            <div className="modal-form">
              <div className="modal-field"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="priya@email.com" /></div>
              <div className="modal-field"><label>Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" /></div>
              <button className="modal-submit" onClick={handlePlannerLogin}>Sign In →</button>
              <button className="modal-back" onClick={() => goScreen('planner-choice')}>← Back</button>
            </div>
          )}

          {/* Vendor choice */}
          {screen === 'vendor-choice' && (
            <div className="auth-choice-row">
              <button className="auth-choice-btn auth-choice-btn-primary" onClick={() => goScreen('vendor-signup')}>
                <span className="auth-choice-icon">🚀</span>
                <div className="auth-choice-text"><strong>List Your Business</strong><span>Create a vendor profile</span></div>
              </button>
              <button className="auth-choice-btn auth-choice-btn-secondary" onClick={() => goScreen('vendor-login')}>
                <span className="auth-choice-icon">🔑</span>
                <div className="auth-choice-text"><strong>Log In</strong><span>Access your vendor dashboard</span></div>
              </button>
            </div>
          )}

          {/* Vendor signup */}
          {screen === 'vendor-signup' && (
            <div className="modal-form">
              <div className="modal-field"><label>Business Name</label><input value={bizName} onChange={e => setBizName(e.target.value)} placeholder="e.g. Riya Kapoor Photography" /></div>
              <div className="modal-field"><label>Business Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@business.com" /></div>
              <div className="modal-field"><label>Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" /></div>
              <button className="modal-submit" onClick={handleVendorSignup}>Create Vendor Account →</button>
              <p style={{ fontSize: '.72rem', color: 'var(--tl)', textAlign: 'center', lineHeight: 1.6 }}>
                By signing up you agree to our{' '}
                <span style={{ color: 'var(--gl)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { onClose(); onShowTerms?.() }}>Terms & Conditions</span>
                {' '}and{' '}
                <span style={{ color: 'var(--gl)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { onClose(); onShowPrivacy?.() }}>Privacy Policy</span>
              </p>
              <button className="modal-back" onClick={() => goScreen('vendor-choice')}>← Back</button>
            </div>
          )}

          {/* Vendor login */}
          {screen === 'vendor-login' && (
            <div className="modal-form">
              <div className="modal-field"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@business.com" /></div>
              <div className="modal-field"><label>Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" /></div>
              <button className="modal-submit" onClick={handleVendorLogin}>Log In →</button>
              <button className="modal-back" onClick={() => goScreen('vendor-choice')}>← Back</button>
            </div>
          )}

          {/* Verification sent screen */}
          {screen === 'verify' && (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📬</div>
              <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.3rem', color: 'var(--vx)', fontWeight: 400, marginBottom: '.6rem' }}>
                Check your inbox
              </h3>
              <p style={{ fontSize: '.88rem', color: 'var(--tm)', lineHeight: 1.7, marginBottom: '.4rem', fontWeight: 300 }}>
                We sent a verification link to
              </p>
              <p style={{ fontSize: '.9rem', color: 'var(--v)', fontWeight: 500, marginBottom: '1.4rem' }}>
                {verifyEmail}
              </p>
              <p style={{ fontSize: '.8rem', color: 'var(--tl)', lineHeight: 1.7, marginBottom: '1.8rem', fontWeight: 300 }}>
                Click the link in the email to activate your account. Check your spam folder if you don't see it.
              </p>
              <button className="modal-submit" onClick={() => { onClose(); onSuccess(type) }}>
                Got it →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
