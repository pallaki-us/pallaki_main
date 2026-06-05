import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useVendor } from '../lib/useVendors'
import { useAuth } from '../lib/AuthContext'
import { showToast } from '../lib/toast'
import { supabase } from '../lib/supabase'
import InquiryModal from '../components/InquiryModal'
import VendorChat from '../components/VendorChat'
import { trackVendorProfileView, trackBookingStarted, trackChatOpened } from '../lib/analytics'

export default function Detail() {
  const { id: vendorId } = useParams()
  const [searchParams] = useSearchParams()
  const isOwnListing = searchParams.get('own') === 'true'
  const navigate = useNavigate()
  const { user, userType } = useAuth()
  const { vendor: v, loading } = useVendor(vendorId)
  const [activeTab, setActiveTab] = useState('overview')
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [portfolioUrls, setPortfolioUrls] = useState(null)
  const [featuredUrls, setFeaturedUrls] = useState(null)

  // Sync local URL state when vendor loads + fire GA4 profile view
  useEffect(() => {
    if (!v) return
    setPortfolioUrls(v.portfolio_urls || [])
    setFeaturedUrls(v.featured_urls || [])
    if (!isOwnListing) trackVendorProfileView(v.id, v.name, v.category)
  }, [v?.id])

  // Track profile view — fires once user identity is confirmed, skips own listing
  useEffect(() => {
    if (!vendorId || !supabase || !user) return
    if (isOwnListing) return
    supabase.rpc('record_profile_view', { p_vendor_id: vendorId, p_viewer_id: user.id })
      .then(({ error }) => { if (error) console.error('profile_view error:', error) })
  }, [vendorId, user?.id, isOwnListing])


  if (loading) return (
    <div style={{ paddingTop: 64, textAlign: 'center', padding: '8rem 2rem', fontFamily: "'Cormorant Garamond',serif", fontSize: '1.2rem', fontStyle: 'italic', color: 'var(--tl)' }}>
      Loading vendor…
    </div>
  )

  if (!v) return null

  async function removePhoto(field, url) {
    const current = field === 'portfolio_urls' ? portfolioUrls : featuredUrls
    const updated = current.filter(u => u !== url)
    const { error } = await supabase.from('vendors').update({ [field]: updated }).eq('id', vendorId)
    if (error) { showToast('Failed to remove photo.'); return }
    if (field === 'portfolio_urls') setPortfolioUrls(updated)
    else setFeaturedUrls(updated)
    showToast('Photo removed.')
  }

  async function sendInquiry() {
    if (!user) { navigate('/planner/login'); return }
    if (userType === 'vendor') { showToast('Vendor accounts cannot send inquiries.'); return }
    setInquiryOpen(true)
  }

  return (
    <div id="page-detail">
      {/* Header */}
      <div className="dh">
        <button className="dh-back" onClick={() => navigate(isOwnListing ? '/dashboard' : '/vendors')}>{isOwnListing ? '← Back to Profile' : '← Back to Results'}</button>
        <div className="dh-row">
          <div className="dh-av">
            {v.avatar_url
              ? <img src={v.avatar_url} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
              : v.icon}
          </div>
          <div className="dh-info">
            <h1>{v.name}</h1>
            <div className="dh-tags">
              <span className="dh-tag">{v.cat}</span>
              <span className="dh-tag">📍 {v.loc}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-bar">
        {['overview', 'gallery', ...(userType !== 'vendor' ? ['contact'] : [])].map(tab => (
          <button
            key={tab}
            className={`tab-btn${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="tc active">
          <div className="ov-grid">
            <div className="ov-about">
              <h2>About {v.name}</h2>
              <p>{v.desc}</p>
              <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                {v.services.map(s => (
                  <span key={s} style={{ padding: '.28rem .75rem', border: '1px solid var(--br)', borderRadius: '100px', fontSize: '.75rem', color: 'var(--tm)' }}>{s}</span>
                ))}
              </div>
              <div className="ov-meta">
                <div className="ov-meta-item">
                  <div className="ov-meta-label">Events Covered</div>
                  <div className="ov-meta-val">{v.events}</div>
                </div>
                <div className="ov-meta-item">
                  <div className="ov-meta-label">Based In</div>
                  <div className="ov-meta-val">{v.loc}</div>
                </div>
                {(v.languages || []).length > 0 && (
                  <div className="ov-meta-item">
                    <div className="ov-meta-label">Languages</div>
                    <div className="ov-meta-val">{v.languages.join(', ')}</div>
                  </div>
                )}
              </div>

              {(v.service_areas || []).length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--tl)', fontWeight: 500, marginBottom: '.75rem' }}>📍 Areas Served</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
                    {v.service_areas.map((area, i) => (
                      <span key={i} style={{ padding: '.3rem .8rem', background: 'var(--vf)', border: '1px solid var(--br)', borderRadius: 100, fontSize: '.78rem', color: 'var(--tm)' }}>
                        📍 {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {userType !== 'vendor' && (
              <div className="cc-card">
                <h3>Contact this Vendor</h3>
                <div className="cc-row">📍 <span>{v.loc}</span></div>
                <div className="cc-row">✓ Identity verified by Pallaki</div>
                <button className="inq-btn chat-now-btn" onClick={() => { setChatOpen(true); trackChatOpened(v.id, v.name) }}>💬 Chat Now — Instant answers</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gallery */}
      {activeTab === 'gallery' && (
        <div className="tc active">
          {(portfolioUrls?.length > 0 || featuredUrls?.length > 0) ? (
            <div>
              {portfolioUrls?.length > 0 && (
                <div>
                  <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1rem', color: 'var(--vx)', marginBottom: '1rem', fontWeight: 400 }}>Portfolio</p>
                  <div className="gal-grid" style={{ marginBottom: '2rem' }}>
                    {portfolioUrls.map((url, i) => (
                      <div key={i} className="gal-item" style={{ background: 'var(--cd)', padding: 0, overflow: 'hidden', position: 'relative' }}>
                        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {isOwnListing && (
                          <button onClick={() => removePhoto('portfolio_urls', url)} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,.55)', color: '#fff', border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', fontSize: '.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {featuredUrls?.length > 0 && (
                <div>
                  <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1rem', color: 'var(--vx)', marginBottom: '1rem', fontWeight: 400 }}>Featured Work</p>
                  <div className="gal-grid">
                    {featuredUrls.map((url, i) => (
                      <div key={i} className="gal-item" style={{ background: 'var(--cd)', padding: 0, overflow: 'hidden', position: 'relative' }}>
                        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {isOwnListing && (
                          <button onClick={() => removePhoto('featured_urls', url)} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,.55)', color: '#fff', border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', fontSize: '.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="gal-grid">
              {[
                { emoji: '🌸', bg: 'linear-gradient(135deg,#FDEAED,#F5C4CB)' },
                { emoji: '💐', bg: 'linear-gradient(135deg,#F0EAF8,#DDD0EC)' },
                { emoji: '🎊', bg: 'linear-gradient(135deg,#F5EACA,#EDD8A0)' },
                { emoji: '🎋', bg: 'linear-gradient(135deg,#EBF2ED,#C4DCC8)' },
                { emoji: '🪷', bg: 'linear-gradient(135deg,#FFF0F5,#F5D0DF)' },
                { emoji: '🌺', bg: 'linear-gradient(135deg,#EAE8F5,#C8C4E8)' },
              ].map((item, i) => (
                <div key={i} className="gal-item" style={{ background: item.bg }}>{item.emoji}</div>
              ))}
            </div>
          )}
        </div>
      )}


      {activeTab === 'contact' && userType !== 'vendor' && (
        <div className="tc active">
          <div className="ctab-grid">
            <div>
              <div className="map-ph">
                <span style={{ fontSize: '1.5rem' }}>📍</span>
                <span style={{ fontSize: '.85rem', color: 'var(--tl)' }}>{v.loc}</span>
                <span style={{ fontSize: '.74rem', color: 'var(--tl)' }}>Map coming soon</span>
              </div>
              <div className="biz-h">
                <h4>Business Hours</h4>
                <div className="biz-row"><span>Mon – Fri</span><span>9am – 7pm</span></div>
                <div className="biz-row"><span>Sat – Sun</span><span>10am – 5pm</span></div>
              </div>
            </div>
            <div>
              <div className="cc-card">
                <h3>Contact this Vendor</h3>
                <div className="cc-row">📍 <span>{v.loc}</span></div>
                <div className="cc-row">✓ Identity verified by Pallaki</div>
                <button className="inq-btn chat-now-btn" onClick={() => { setChatOpen(true); trackChatOpened(v.id, v.name) }}>💬 Chat Now — Instant answers</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <InquiryModal
        open={inquiryOpen}
        onClose={() => setInquiryOpen(false)}
        vendor={v}
      />
      <VendorChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        onSendInquiry={() => { setChatOpen(false); setInquiryOpen(true) }}
        vendor={v}
      />
    </div>
  )
}
