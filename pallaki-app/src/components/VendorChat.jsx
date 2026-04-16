import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { sendInquiry } from '../lib/useInquiries'
import { showToast } from '../lib/toast'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

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
    question: 'What's your approximate budget for this service?',
    options: ['Under $2,000', '$2,000–$5,000', '$5,000–$10,000', '$10,000–$25,000', '$25,000+', 'Prefer not to say'],
  },
]

function buildMessage(answers, notes) {
  let msg = `Hi! I'm interested in booking your services.\n\n`
  msg += `Event Type: ${answers.eventType}\n`
  msg += `Timeline: ${answers.eventDate}\n`
  msg += `Guest Count: ${answers.guestCount}\n`
  msg += `Budget: ${answers.budget}`
  if (notes.trim()) msg += `\n\nAdditional notes: ${notes.trim()}`
  return msg
}

export default function VendorChat({ open, onClose, vendor }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const bottomRef = useRef(null)

  // Intake state
  const [mode, setMode] = useState('intake') // 'intake' | 'confirm' | 'done' | 'chat'
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Chat state
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setMode('intake'); setStep(0); setAnswers({}); setNotes('')
      setMessages([]); setInput('')
    }
  }, [open, vendor?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mode, step, messages, chatLoading])

  if (!open) return null

  // ── Intake handlers ──────────────────────────────────────────────────────
  function selectOption(option) {
    const stepId = INTAKE_STEPS[step].id
    const newAnswers = { ...answers, [stepId]: option }
    setAnswers(newAnswers)
    if (step < INTAKE_STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      setMode('confirm')
    }
  }

  async function handleSubmit() {
    if (!user) { onClose(); navigate('/planner/login'); return }
    setSubmitting(true)
    const message = buildMessage(answers, notes)
    const { error } = await sendInquiry({
      vendorId: vendor.id,
      plannerId: user.id,
      message,
      vendorEmail: vendor.email,
      vendorName: vendor.name,
    })
    setSubmitting(false)
    if (error) { showToast('Something went wrong. Try again.'); return }
    setMode('done')
  }

  // ── Chat handlers ────────────────────────────────────────────────────────
  async function handleChatSend() {
    const text = input.trim()
    if (!text || chatLoading) return
    setInput('')
    const optimistic = [...messages, { role: 'user', content: text }]
    setMessages(optimistic)
    setChatLoading(true)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/vendor-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ vendor, messages, message: text }),
      })
      const data = await res.json()
      if (!res.ok || !data?.reply) throw new Error(data?.error || 'No reply')
      setMessages(data.messages)
    } catch {
      setMessages([...optimistic, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again." }])
    } finally {
      setChatLoading(false)
    }
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
        {mode === 'chat' && (
          <span style={{ fontSize: '.65rem', background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.35)', borderRadius: 20, padding: '.15rem .55rem', color: '#fff', letterSpacing: '.04em', fontFamily: 'sans-serif' }}>AI</span>
        )}
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
            {/* Completed steps */}
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

            {/* Current question */}
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
              <button className="chat-link-btn" style={{ fontSize: '.68rem' }} onClick={() => setMode('chat')}>Ask a question instead →</button>
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
            {/* Show all Q&As */}
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
              <div className="chat-bubble chat-bubble-ai">
                Anything else you'd like {vendor?.name} to know? (optional)
              </div>
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
            <button
              className="modal-send-btn"
              style={{ marginTop: '.5rem' }}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Sending…' : `Send Booking Request to ${vendor?.name} →`}
            </button>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '.4rem' }}>
              <button className="chat-link-btn" style={{ fontSize: '.68rem' }} onClick={() => { setStep(0); setAnswers({}); setMode('intake') }}>← Start over</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Done view ────────────────────────────────────────────────────────────
  if (mode === 'done') {
    return (
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal-dialog" style={{ maxWidth: 500 }}>
          {header}
          <div className="modal-dialog-body">
            <div className="modal-success">
              <div className="modal-success-icon">🌸</div>
              <p className="modal-success-text">
                Your booking request has been sent to <strong style={{ color: 'var(--vx)' }}>{vendor?.name}</strong>. They'll be in touch soon!
              </p>
              <button className="modal-send-btn" onClick={() => { setMode('chat'); setMessages([]) }}>
                💬 Ask a question
              </button>
              <button className="chat-link-btn" style={{ display: 'block', margin: '.75rem auto 0', fontSize: '.8rem' }} onClick={onClose}>
                Done →
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Chat view ────────────────────────────────────────────────────────────
  const chatGreeting = `Hi! I can answer questions about ${vendor?.name} — like what's included, how the process works, and more. What would you like to know?`

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-dialog" style={{ maxWidth: 500 }}>
        {header}
        <div className="chat-msgs">
          <div className="chat-msg-row chat-msg-row-ai">
            <div className="chat-bubble chat-bubble-ai">{chatGreeting}</div>
          </div>
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg-row chat-msg-row-${m.role === 'user' ? 'user' : 'ai'}`}>
              <div className={`chat-bubble chat-bubble-${m.role === 'user' ? 'user' : 'ai'}`}>{m.content}</div>
            </div>
          ))}
          {chatLoading && (
            <div className="chat-msg-row chat-msg-row-ai">
              <div className="chat-bubble chat-bubble-ai chat-bubble-typing"><span /><span /><span /></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="chat-input-row">
          {!user && <div style={{ fontSize: '.74rem', color: 'var(--tl)', textAlign: 'center', padding: '.4rem 0' }}>Sign in to chat</div>}
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <textarea
              className="modal-input chat-textarea"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleChatKey}
              placeholder="Ask about services, packages, what to expect…"
              rows={1}
              disabled={!user || chatLoading}
            />
            <button className="chat-send-btn" onClick={handleChatSend} disabled={!user || chatLoading || !input.trim()}>
              {chatLoading ? '…' : '↑'}
            </button>
          </div>
          <p style={{ fontSize: '.68rem', color: 'var(--tl)', textAlign: 'center', margin: '.4rem 0 0' }}>
            AI assistant · <button className="chat-link-btn" onClick={() => { setStep(0); setAnswers({}); setMode('intake') }}>← Back to booking</button>
          </p>
        </div>
      </div>
    </div>
  )
}
