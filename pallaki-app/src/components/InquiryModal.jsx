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
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && handleClose()}>
      <div className="modal-dialog">

        <div className="modal-dialog-head">
          <h3>{sent ? '🌸 Inquiry Sent!' : `Contact ${vendor?.name}`}</h3>
          <button className="modal-dialog-close" onClick={handleClose}>✕</button>
        </div>

        <div className="modal-dialog-body">
          {sent ? (
            <div className="modal-success">
              <div className="modal-success-icon">🌸</div>
              <p className="modal-success-text">
                Your inquiry has been sent to <strong style={{ color: 'var(--vx)' }}>{vendor?.name}</strong>.
                They typically respond within 24 hours.
              </p>
              <button className="modal-send-btn" onClick={handleClose}>Done →</button>
            </div>
          ) : (
            <>
              <div className="modal-vendor-card">
                <span className="mvc-icon">{vendor?.icon}</span>
                <div>
                  <div className="mvc-name">{vendor?.name}</div>
                  <div className="mvc-meta">📍 {vendor?.loc} · ★ {vendor?.rating}</div>
                </div>
              </div>

              <div>
                <label className="modal-label">Event Date <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 300 }}>(optional)</span></label>
                <input
                  type="month"
                  className="modal-input"
                  value={eventDate}
                  onChange={e => setEventDate(e.target.value)}
                />
              </div>

              <div>
                <label className="modal-label">Message *</label>
                <textarea
                  className="modal-input modal-textarea"
                  value={message}
                  onChange={e => setMessage(e.target.value.slice(0, 500))}
                  placeholder="Tell them about your event — date, location, what you're looking for…"
                />
                <div className="modal-char-count">{message.length}/500</div>
              </div>

              <button className="modal-send-btn" onClick={handleSend} disabled={sending}>
                {sending ? 'Sending…' : 'Send Inquiry →'}
              </button>
              <p className="modal-footer-note">✓ Verified vendor · Responds within 24 hours</p>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
