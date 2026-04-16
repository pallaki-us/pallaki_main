import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../lib/AuthContext'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export default function VendorChat({ open, onClose, onSendInquiry, vendor }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  // Reset chat when opened for a different vendor
  useEffect(() => {
    if (open) setMessages([])
  }, [open, vendor?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  if (!open) return null

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    const optimistic = [...messages, { role: 'user', content: text }]
    setMessages(optimistic)
    setLoading(true)

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
      setMessages([...optimistic, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again in a moment." }])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const greeting = `Hi! I can answer questions about ${vendor?.name} — like what's included, how the process works, availability, and more. What would you like to know?`

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-dialog" style={{ maxWidth: 500 }}>

        <div className="modal-dialog-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <h3 style={{ margin: 0 }}>
              {vendor?.avatar_url
                ? <img src={vendor.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', verticalAlign: 'middle', marginRight: 6 }} />
                : <span style={{ marginRight: 6 }}>{vendor?.icon}</span>
              }
              {vendor?.name}
            </h3>
            <span style={{ fontSize: '.65rem', background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.35)', borderRadius: 20, padding: '.15rem .55rem', color: '#fff', letterSpacing: '.04em', fontFamily: 'sans-serif' }}>AI</span>
          </div>
          <button className="modal-dialog-close" onClick={onClose}>✕</button>
        </div>

        <div className="chat-msgs">
          {/* Static greeting */}
          <div className="chat-msg-row chat-msg-row-ai">
            <div className="chat-bubble chat-bubble-ai">{greeting}</div>
          </div>

          {/* Conversation */}
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg-row chat-msg-row-${m.role === 'user' ? 'user' : 'ai'}`}>
              <div className={`chat-bubble chat-bubble-${m.role === 'user' ? 'user' : 'ai'}`}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-msg-row chat-msg-row-ai">
              <div className="chat-bubble chat-bubble-ai chat-bubble-typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-row">
          {!user && (
            <div style={{ fontSize: '.74rem', color: 'var(--tl)', textAlign: 'center', padding: '.4rem 0' }}>
              Sign in to chat
            </div>
          )}
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <textarea
              className="modal-input chat-textarea"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about services, availability, what to expect…"
              rows={1}
              disabled={!user || loading}
            />
            <button className="chat-send-btn" onClick={handleSend} disabled={!user || loading || !input.trim()}>
              {loading ? '…' : '↑'}
            </button>
          </div>
          <p style={{ fontSize: '.68rem', color: 'var(--tl)', textAlign: 'center', margin: '.4rem 0 0' }}>
            AI assistant · Powered by Claude
          </p>
        </div>

      </div>
    </div>
  )
}
