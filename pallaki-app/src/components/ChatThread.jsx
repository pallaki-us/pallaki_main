import { useState, useEffect, useRef } from 'react'
import { useMessages } from '../lib/useMessages'
import { showToast } from '../lib/toast'

export default function ChatThread({ vendorId, plannerId, senderRole, senderId, otherName }) {
  const { messages, loading, send } = useMessages(vendorId, plannerId)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e?.preventDefault()
    if (!input.trim() || sending) return
    setSending(true)
    const { error } = await send(input, senderRole, senderId)
    if (error) {
      showToast('Failed to send message. Please try again.')
    } else {
      setInput('')
    }
    setSending(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
        {loading && (
          <p style={{ textAlign: 'center', color: 'var(--tl)', fontSize: '.85rem', padding: '2rem 0' }}>Loading…</p>
        )}
        {!loading && messages.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--tl)', fontStyle: 'italic', fontSize: '.85rem', padding: '2rem 0' }}>
            No messages yet.
          </p>
        )}
        {messages.map(msg => {
          const isMe = msg.sender_role === senderRole
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '75%',
                padding: '.6rem .85rem',
                borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: isMe ? 'var(--v)' : 'var(--wh)',
                color: isMe ? '#fff' : 'var(--vx)',
                border: isMe ? 'none' : '1px solid var(--br)',
                fontSize: '.88rem',
                lineHeight: 1.55,
                wordBreak: 'break-word',
              }}>
                <div>{msg.body}</div>
                <div style={{ fontSize: '.62rem', opacity: .55, marginTop: '.25rem', textAlign: 'right' }}>
                  {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} style={{ padding: '.65rem .75rem', borderTop: '1px solid var(--br)', display: 'flex', gap: '.5rem', background: 'var(--wh)', flexShrink: 0 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Message ${otherName || ''}…`}
          style={{ flex: 1, padding: '.55rem .85rem', borderRadius: 8, border: '1px solid var(--br)', fontSize: '.88rem', outline: 'none', fontFamily: 'inherit', background: 'var(--cr)' }}
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          style={{
            background: 'var(--v)', color: '#fff', border: 'none', borderRadius: 8,
            padding: '.55rem 1rem', cursor: 'pointer', fontSize: '1rem',
            opacity: (!input.trim() || sending) ? .45 : 1, transition: 'opacity .15s',
          }}
        >
          {sending ? '…' : '↑'}
        </button>
      </form>
    </div>
  )
}
