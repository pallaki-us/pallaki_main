import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { usePlannerThreads } from '../lib/useMessages'
import ChatThread from '../components/ChatThread'

export default function PlannerConversations() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { threads, loading } = usePlannerThreads(user?.id)
  const [activeThread, setActiveThread] = useState(null)
  const [readThreadIds, setReadThreadIds] = useState(new Set())

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cd)', paddingTop: 64 }}>
      {/* Sticky action bar */}
      <div style={{ position: 'sticky', top: 64, zIndex: 100, background: 'var(--cr)', borderBottom: '1px solid var(--br)', padding: '.75rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <button className="btn-o" style={{ padding: '.45rem 1rem', fontSize: '.78rem' }} onClick={() => navigate('/')}>← Back</button>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1rem', color: 'var(--vx)', fontWeight: 400 }}>💌 My Conversations</span>
        </div>
        <button className="btn-o" style={{ padding: '.45rem 1rem', fontSize: '.78rem' }} onClick={() => navigate('/vendors')}>Browse Vendors →</button>
      </div>

      <div className="dash-body">
        <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', height: 'calc(100vh - 180px)', minHeight: 500 }}>
            {/* Thread list */}
            <div style={{ borderRight: '1px solid var(--br)', overflowY: 'auto', background: 'var(--cr)' }}>
              <div style={{ padding: '.75rem 1rem', fontSize: '.72rem', fontWeight: 600, color: 'var(--tl)', textTransform: 'uppercase', letterSpacing: '.08em', borderBottom: '1px solid var(--br)' }}>
                Vendors
              </div>
              {loading && (
                <p style={{ fontSize: '.82rem', color: 'var(--tl)', padding: '1.5rem 1rem', textAlign: 'center' }}>Loading…</p>
              )}
              {!loading && threads.length === 0 && (
                <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '.85rem', color: 'var(--tl)', fontStyle: 'italic', marginBottom: '1rem' }}>No conversations yet.</p>
                  <button className="btn-p" style={{ fontSize: '.78rem', padding: '.5rem 1rem' }} onClick={() => navigate('/vendors')}>Browse Vendors</button>
                </div>
              )}
              {threads.map(t => {
                const v = t.vendor
                const isActive = activeThread?.vendor_id === t.vendor_id
                const isUnread = t.hasUnread && !readThreadIds.has(t.vendor_id)
                return (
                  <div
                    key={t.vendor_id}
                    onClick={() => { setActiveThread(t); setReadThreadIds(prev => new Set([...prev, t.vendor_id])) }}
                    style={{
                      padding: '.85rem 1rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--br)',
                      background: isActive ? 'var(--vf)' : 'transparent',
                      display: 'flex', alignItems: 'center', gap: '.6rem',
                      transition: 'background .15s',
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--vp)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0, overflow: 'hidden' }}>
                      {v?.avatar_url
                        ? <img src={v.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : v?.icon || '🌸'}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '.85rem', fontWeight: isUnread ? 700 : 600, color: 'var(--vx)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v?.name || 'Vendor'}</div>
                      <div style={{ fontSize: '.72rem', color: 'var(--tl)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v?.category}{v?.city ? ` · ${v.city}` : ''}</div>
                    </div>
                    {isUnread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--v)', flexShrink: 0 }} />}
                  </div>
                )
              })}
            </div>

            {/* Chat panel */}
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {activeThread ? (
                <>
                  <div style={{ padding: '.75rem 1.25rem', borderBottom: '1px solid var(--br)', display: 'flex', alignItems: 'center', gap: '.75rem', flexShrink: 0, background: 'var(--cr)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--vp)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, overflow: 'hidden' }}>
                      {activeThread.vendor?.avatar_url
                        ? <img src={activeThread.vendor.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : activeThread.vendor?.icon || '🌸'}
                    </div>
                    <div>
                      <div style={{ fontSize: '.9rem', fontWeight: 600, color: 'var(--vx)' }}>{activeThread.vendor?.name}</div>
                      <div style={{ fontSize: '.72rem', color: 'var(--tl)' }}>{activeThread.vendor?.category}{activeThread.vendor?.city ? ` · ${activeThread.vendor.city}` : ''}</div>
                    </div>
                    <button
                      className="btn-o"
                      style={{ marginLeft: 'auto', padding: '.35rem .85rem', fontSize: '.75rem' }}
                      onClick={() => navigate(`/vendor/${activeThread.vendor_id}`)}
                    >
                      View Listing →
                    </button>
                  </div>
                  <div style={{ flex: 1, minHeight: 0 }}>
                    <ChatThread
                      vendorId={activeThread.vendor_id}
                      plannerId={user?.id}
                      senderRole="planner"
                      senderId={user?.id}
                      otherName={activeThread.vendor?.name}
                    />
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', color: 'var(--tl)' }}>
                  <div style={{ fontSize: '2rem' }}>💌</div>
                  <p style={{ fontSize: '.9rem', fontStyle: 'italic' }}>Select a conversation to read messages</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
