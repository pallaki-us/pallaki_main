import { useState, useRef, useEffect } from 'react'
import { useNotifications } from '../lib/useNotifications'
import { useNavigate } from 'react-router-dom'

export default function NotificationBell({ userType }) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef()
  const navigate = useNavigate()

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleClick(n) {
    markRead(n.id)
    setOpen(false)
    if (n.type === 'new_inquiry') navigate('/analytics')
    else navigate('/profile')
  }

  function timeAgo(ts) {
    const diff = Date.now() - new Date(ts).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'relative', background: 'none', border: '1.5px solid var(--br)',
          borderRadius: '50%', width: 34, height: 34, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem', color: 'var(--vx)', transition: 'all .15s',
          background: open ? 'var(--vf)' : 'var(--wh)',
        }}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: 'var(--v)', color: '#fff',
            fontSize: '.58rem', fontWeight: 700,
            width: 16, height: 16, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--wh)',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 300, background: 'var(--wh)', border: '1px solid var(--br)',
          borderRadius: 14, boxShadow: '0 8px 28px rgba(196,132,140,.14)',
          zIndex: 400, overflow: 'hidden',
        }}>
          <div style={{
            padding: '.75rem 1rem', borderBottom: '1px solid var(--br)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '.95rem', fontWeight: 500, color: 'var(--vx)' }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '.7rem', color: 'var(--v)', fontFamily: "'Cormorant Garamond',serif",
              }}>
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', fontSize: '.84rem', color: 'var(--tl)', fontStyle: 'italic' }}>
                No notifications yet
              </div>
            ) : notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                style={{
                  padding: '.75rem 1rem', cursor: 'pointer',
                  background: n.read ? 'transparent' : 'var(--vf)',
                  borderBottom: '1px solid var(--br)',
                  transition: 'background .12s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--vp)'}
                onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'var(--vf)'}
              >
                <div style={{ display: 'flex', gap: '.6rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: 1 }}>
                    {n.type === 'new_inquiry' ? '💌' : '💬'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '.82rem', fontWeight: n.read ? 400 : 600, color: 'var(--vx)', marginBottom: '.15rem' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '.76rem', color: 'var(--tm)', lineHeight: 1.5 }}>{n.body}</div>
                    <div style={{ fontSize: '.65rem', color: 'var(--tl)', marginTop: '.25rem' }}>{timeAgo(n.created_at)}</div>
                  </div>
                  {!n.read && (
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--v)', flexShrink: 0, marginTop: 4 }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
