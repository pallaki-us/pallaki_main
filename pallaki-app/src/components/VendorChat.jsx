import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { sendInquiry } from '../lib/useInquiries'
import { useMessages } from '../lib/useMessages'
import { supabase } from '../lib/supabase'
import { showToast } from '../lib/toast'
import { trackBookingStarted, trackBookingCompleted } from '../lib/analytics'

const INTAKE_STEPS = [
  {
    id: 'eventType',
    question: 'What type of event are you planning?',
    options: ['💍 Wedding', '💕 Engagement', '🎵 Sangeet / Mehndi', '🎂 Birthday', '🍼 Baby Shower', '🏡 Other'],
  },
  {
    id: 'eventDate',
    question: 'When is your event?',
    options: ['Within 3 months', '3–6 months away', '6–12 months away', '1+ year away', 'Date not set yet'],
  },
  {
    id: 'guestCount',
    question: 'How many guests are you expecting?',
    options: ['Under 50', '50–100', '100–200', '200–400', '400+'],
  },
  {
    id: 'budget',
    question: "What's your approximate budget for this service?",
    options: ['Under $2,000', '$2,000–$5,000', '$5,000–$10,000', '$10,000–$25,000', '$25,000+', 'Prefer not to say'],
  },
]

function buildMessage(answers, notes, contactName, contactEmail, contactPhone) {
  let msg = `Hi! I'm interested in booking your services.\n\n`
  msg += `Event Type: ${answers.eventType}\n`
  msg += `Timeline: ${answers.eventDate}\n`
  msg += `Guest Count: ${answers.guestCount}\n`
  msg += `Budget: ${answers.budget}`
  if (contactName || contactEmail || contactPhone) {
    msg += `\n\nBest way to reach me:`
    if (contactName) msg += `\nName: ${contactName}`
    if (contactEmail) msg += `\nEmail: ${contactEmail}`
    if (contactPhone) msg += `\nPhone: ${contactPhone}`
  }
  if (notes.trim()) msg += `\n\nAdditional notes: ${notes.trim()}`
  return msg
}

export default function VendorChat({ open, onClose, vendor }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const bottomRef = useRef(null)

  // mode: 'intake' | 'contact' | 'confirm' | 'live-chat'
  const [mode, setMode] = useState('intake')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [sending, setSending] = useState(false)

  // Real-time messages hook — only active when in live-chat mode
  const { messages, send } = useMessages(
    mode === 'live-chat' ? vendor?.id : null,
    mode === 'live-chat' ? user?.id : null
  )

  // When chat opens, check if there's already an existing inquiry
  useEffect(() => {
    if (!open || !user || !vendor?.id || !supabase) return
    setMode('intake'); setStep(0); setAnswers({}); setNotes('')
    setContactName(''); setContactEmail(user?.email || ''); setContactPhone('')
    setChatInput('')

    // Check for existing inquiry — if yes, skip intake and go straight to chat
    supabase
      .from('inquiries')
      .select('id')
      .eq('vendor_id', vendor.id)
      .eq('planner_id', user.id)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setMode('live-chat')
      })
  }, [open, vendor?.id, user?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mode, step, messages])

  if (!open) return null

  // ── Intake handlers ──────────────────────────────────────────────────────
  function selectOption(option) {
    const stepId = INTAKE_STEPS[step].id
    const newAnswers = { ...answers, [stepId]: option }
    setAnswers(newAnswers)
    if (step < INTAKE_STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      setMode('contact')
      trackBookingStarted(vendor?.id, vendor?.name)
    }
  }

  async function handleSubmit() {
    if (!user) { onClose(); navigate('/planner/login'); return }
    setSubmitting(true)
    const message = buildMessage(answers, notes, contactName, contactEmail, contactPhone)
    const { error } = await sendInquiry({
      vendorId: vendor.id,
      plannerId: user.id,
      message,
      vendorEmail: vendor.email,
      vendorName: vendor.name,
      intakeData: { ...answers, contactName: contactName || null, contactEmail: contactEmail || null, contactPhone: contactPhone || null },
    })
    setSubmitting(false)
    if (error) { showToast('Something went wrong. Try again.'); return }
    trackBookingCompleted(vendor?.id, vendor?.name)
    setMode('live-chat')
  }

  // ── Live chat send ────────────────────────────────────────────────────────
  async function handleChatSend(e) {
    e?.preventDefault()
    if (!chatInput.trim() || sending) return
    setSending(true)
    const { error } = await send(chatInput, 'planner', user?.id)
    if (error) {
      showToast('Failed to send message. Please try again.')
    } else {
      setChatInput('')
    }
    setSending(false)
  }

  function handleChatKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend() }
  }

  // ── Header ───────────────────────────────────────────────────────────────
  const header = (
    <div className="modal-dialog-head">
      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
        <h3 style={{ margin: 0 }}>
          {vendor?.avatar_url
            ? <img src={vendor.avatar_url} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', verticalAlign: 'middle', marginRight: 6 }} />
            : <span style={{ marginRight: 6 }}>{vendor?.icon}</span>}
          {vendor?.name}
        </h3>
      </div>
      <button className="modal-dialog-close" onClick={onClose}>✕</button>
    </div>
  )

  // ── Intake view ──────────────────────────────────────────────────────────
  if (mode === 'intake') {
    return (
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal-dialog" style={{ maxWidth: 500 }}>
          {header}
          <div className="chat-msgs">
            {INTAKE_STEPS.slice(0, step).map((s, i) => (
              <div key={s.id}>
                <div className="chat-msg-row chat-msg-row-ai">
                  <div className="chat-bubble chat-bubble-ai">{s.question}</div>
                </div>
                <div className="chat-msg-row chat-msg-row-user">
                  <div className="chat-bubble chat-bubble-user">{answers[s.id]}</div>
                </div>
              </div>
            ))}
            <div className="chat-msg-row chat-msg-row-ai">
              <div className="chat-bubble chat-bubble-ai">{INTAKE_STEPS[step].question}</div>
            </div>
            <div className="intake-options">
              {INTAKE_STEPS[step].options.map(opt => (
                <button key={opt} className="intake-opt-btn" onClick={() => selectOption(opt)}>{opt}</button>
              ))}
            </div>
            <div ref={bottomRef} />
          </div>
          <div className="chat-input-row">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '.68rem', color: 'var(--tl)' }}>Step {step + 1} of {INTAKE_STEPS.length}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Contact view ─────────────────────────────────────────────────────────
  if (mode === 'contact') {
    return (
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal-dialog" style={{ maxWidth: 500 }}>
          {header}
          <div className="chat-msgs" style={{ height: 'auto', maxHeight: 320 }}>
            {INTAKE_STEPS.map(s => (
              <div key={s.id}>
                <div className="chat-msg-row chat-msg-row-ai">
                  <div className="chat-bubble chat-bubble-ai">{s.question}</div>
                </div>
                <div className="chat-msg-row chat-msg-row-user">
                  <div className="chat-bubble chat-bubble-user">{answers[s.id]}</div>
                </div>
              </div>
            ))}
            <div className="chat-msg-row chat-msg-row-ai">
              <div className="chat-bubble chat-bubble-ai">How can {vendor?.name} reach you directly?</div>
            </div>
            <div ref={bottomRef} />
          </div>
          <div className="chat-input-row">
            <div className="details-form" style={{ gap: '.6rem', marginBottom: '.75rem' }}>
              <div className="df full">
                <label style={{ fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--tl)', fontWeight: 500 }}>Your Name</label>
                <input className="modal-input" type="text" value={contactName} onChange={e => setContactName(e.target.value)} style={{ marginBottom: 0 }} />
              </div>
              <div className="df full">
                <label style={{ fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--tl)', fontWeight: 500 }}>Email</label>
                <input className="modal-input" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} style={{ marginBottom: 0 }} />
              </div>
              <div className="df full">
                <label style={{ fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--tl)', fontWeight: 500 }}>Phone / WhatsApp <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 300 }}>(optional)</span></label>
                <input className="modal-input" type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} style={{ marginBottom: 0 }} />
              </div>
            </div>
            <div style={{ background: 'var(--gp)', border: '1px solid rgba(196,154,60,.25)', borderRadius: 10, padding: '.75rem 1rem', marginBottom: '.75rem' }}>
              <p style={{ fontSize: '.72rem', color: 'var(--tm)', lineHeight: 1.65, margin: 0 }}>
                🔒 <strong style={{ color: 'var(--vx)' }}>Your privacy is protected.</strong> Your contact details are shared only with this vendor.{' '}
                <a href="/privacy" target="_blank" style={{ color: 'var(--v)' }}>Privacy Policy →</a>
              </p>
            </div>
            <button className="modal-send-btn" onClick={() => setMode('confirm')}>Continue →</button>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.4rem' }}>
              <button className="chat-link-btn" style={{ fontSize: '.68rem' }} onClick={() => setStep(INTAKE_STEPS.length - 1)}>← Back</button>
              <button className="chat-link-btn" style={{ fontSize: '.68rem' }} onClick={() => setMode('confirm')}>Skip →</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Confirm view ─────────────────────────────────────────────────────────
  if (mode === 'confirm') {
    return (
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal-dialog" style={{ maxWidth: 500 }}>
          {header}
          <div className="chat-msgs" style={{ height: 'auto', maxHeight: 360 }}>
            {INTAKE_STEPS.map(s => (
              <div key={s.id}>
                <div className="chat-msg-row chat-msg-row-ai">
                  <div className="chat-bubble chat-bubble-ai">{s.question}</div>
                </div>
                <div className="chat-msg-row chat-msg-row-user">
                  <div className="chat-bubble chat-bubble-user">{answers[s.id]}</div>
                </div>
              </div>
            ))}
            <div className="chat-msg-row chat-msg-row-ai">
              <div className="chat-bubble chat-bubble-ai">Anything else you'd like {vendor?.name} to know? (optional)</div>
            </div>
            <div ref={bottomRef} />
          </div>
          <div className="chat-input-row">
            <textarea
              className="modal-input chat-textarea"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. outdoor ceremony, vegetarian only, specific song requests…"
              rows={2}
            />
            <button className="modal-send-btn" style={{ marginTop: '.5rem' }} onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Sending…' : `Send to ${vendor?.name} & Start Chat →`}
            </button>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '.4rem' }}>
              <button className="chat-link-btn" style={{ fontSize: '.68rem' }} onClick={() => { setStep(0); setAnswers({}); setContactName(''); setContactEmail(user?.email || ''); setContactPhone(''); setMode('intake') }}>← Start over</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Live chat view ────────────────────────────────────────────────────────
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-dialog" style={{ maxWidth: 500 }}>
        {header}
        <div className="chat-msgs">
          {messages.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--tl)', fontStyle: 'italic', fontSize: '.85rem', padding: '2rem 0' }}>
              No messages yet. Say hello!
            </p>
          )}
          {messages.map(msg => {
            const isMe = msg.sender_role === 'planner'
            return (
              <div key={msg.id} className={`chat-msg-row chat-msg-row-${isMe ? 'user' : 'ai'}`}>
                <div className={`chat-bubble chat-bubble-${isMe ? 'user' : 'ai'}`}>
                  {msg.body}
                  <div style={{ fontSize: '.6rem', opacity: .5, marginTop: '.2rem', textAlign: 'right' }}>
                    {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
        <form className="chat-input-row" onSubmit={handleChatSend} style={{ display: 'flex', gap: '.5rem', padding: '.65rem .75rem', borderTop: '1px solid var(--br)' }}>
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={handleChatKey}
            placeholder={`Message ${vendor?.name}…`}
            style={{ flex: 1, padding: '.55rem .85rem', borderRadius: 8, border: '1px solid var(--br)', fontSize: '.88rem', outline: 'none', fontFamily: 'inherit', background: 'var(--cr)' }}
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || sending}
            style={{ background: 'var(--v)', color: '#fff', border: 'none', borderRadius: 8, padding: '.55rem 1rem', cursor: 'pointer', fontSize: '1rem', opacity: (!chatInput.trim() || sending) ? .45 : 1, transition: 'opacity .15s' }}
          >
            {sending ? '…' : '↑'}
          </button>
        </form>
      </div>
    </div>
  )
}
