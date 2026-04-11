import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { sendInquiry } from '../lib/useInquiries'
import { showToast } from '../lib/toast'

export default function InquiryModal({ open, onClose, vendor }) {
  const { user, userType } = useAuth()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  if (!open) return null

  async function handleSend() {
    if (!user) { onClose(); navigate('/planner/login'); return }
    if (userType === 'vendor') { showToast('Vendor accounts cannot send inquiries.'); return }
    if (!message.trim()) { showToast('Please write a message.'); return }

    setSending(true)
    const { error } = await sendInquiry({
      vendorId: vendor.id,
      plannerId: user.id,
      message,
      eventDate,
    })
    setSending(false)

    if (error) { showToast('Something went wrong. Try again.'); return }
    setSent(true)
  }

  function handleClose() {
    setSent(false)
    setMessage('')
    setEventDate('')
    onClose()
  }

  return (
    <div className="auth-modal-overlay open" onClick={e => e.target === e.currentTarget && handleClose()}>
      <div className="auth-modal">
        <div className="auth-modal-head">
          <button className="auth-modal-close" onClick={handleClose}>✕</button>
          <span className="auth-modal-logo">पल्लकी</span>
          <h3>{sent ? 'Inquiry Sent!' : `Contact ${vendor?.name}`}</h3>
        </div>

        <div className="auth-modal-body">
          {sent ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌸</div>
              <p style={{ fontSize: '.88rem', color: 'var(--tm)', lineHeight: 1.7, marginBottom: '1.5rem', fontWeight: 300 }}>
                Your inquiry has been sent to <strong style={{ color: 'var(--vx)' }}>{vendor?.name}</strong>. They typically respond within 24 hours.
              </p>
              <button className="modal-submit" onClick={handleClose}>Done →</button>
            </div>
          ) : (
            <div className="modal-form">
              <div style={{ background: 'var(--vf)', border: '1px solid var(--br)', borderRadius: 10, padding: '.85rem 1rem', display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{vendor?.icon}</span>
                <div>
                  <div style={{ fontSize: '.88rem', fontWeight: 500, color: 'var(--vx)' }}>{vendor?.name}</div>
                  <div style={{ fontSize: '.74rem', color: 'var(--tl)' }}>📍 {vendor?.loc} · ★ {vendor?.rating}</div>
                </div>
              </div>

              <div className="modal-field">
                <label>Your Event Date</label>
                <input
                  type="month"
                  value={eventDate}
                  onChange={e => setEventDate(e.target.value)}
                  style={{ padding: '.75rem .9rem', border: '1.5px solid var(--br)', borderRadius: 10, fontFamily: "'Cormorant Garamond',serif", fontSize: '.88rem', outline: 'none', background: 'var(--cr)' }}
                />
              </div>

              <div className="modal-field">
                <label>Message</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value.slice(0, 500))}
                  placeholder="Tell them about your event — date, location, what you're looking for…"
                  style={{ padding: '.75rem .9rem', border: '1.5px solid var(--br)', borderRadius: 10, fontFamily: "'Cormorant Garamond',serif", fontSize: '.88rem', outline: 'none', resize: 'vertical', minHeight: 110, background: 'var(--cr)', width: '100%' }}
                />
                <div style={{ fontSize: '.68rem', color: 'var(--tl)', textAlign: 'right' }}>{message.length}/500</div>
              </div>

              <button className="modal-submit" onClick={handleSend} disabled={sending}>
                {sending ? 'Sending…' : 'Send Inquiry →'}
              </button>
              <p style={{ fontSize: '.72rem', color: 'var(--tl)', textAlign: 'center', marginTop: '.3rem' }}>
                ✓ Verified vendor · Responds within 24 hours
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
