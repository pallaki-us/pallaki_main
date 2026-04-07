import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useVendor } from '../lib/useVendors'
import { useAuth } from '../lib/AuthContext'
import { showToast } from '../lib/toast'
import { supabase } from '../lib/supabase'
import InquiryModal from '../components/InquiryModal'

export default function Detail({ onShowAuth }) {
  const { id: vendorId } = useParams()
  const [searchParams] = useSearchParams()
  const isOwnListing = searchParams.get('own') === 'true'
  const navigate = useNavigate()
  const { user, userType } = useAuth()
  const { vendor: v, loading } = useVendor(vendorId)
  const [activeTab, setActiveTab] = useState('overview')
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    if (!vendorId || !supabase) return
    supabase
      .from('reviews')
      .select('id, reviewer_name, event_type, body, review_text, rating, stars, created_at')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setReviews((data || []).map(r => ({
        id: r.id,
        reviewer_name: r.reviewer_name || 'Anonymous',
        event_type: r.event_type,
        review_text: r.review_text || r.body,
        stars: r.stars || r.rating,
        created_at: r.created_at,
      }))))
  }, [vendorId])

  if (loading) return (
    <div style={{ paddingTop: 64, textAlign: 'center', padding: '8rem 2rem', fontFamily: "'Cormorant Garamond',serif", fontSize: '1.2rem', fontStyle: 'italic', color: 'var(--tl)' }}>
      Loading vendor…
    </div>
  )

  if (!v) return null

  async function sendInquiry() {
    if (!user) { onShowAuth('planner'); return }
    if (userType === 'vendor') { showToast('Vendor accounts cannot send inquiries.'); return }
    setInquiryOpen(true)
  }

  return (
    <div id="page-detail">
      {/* Header */}
      <div className="dh">
        <button className="dh-back" onClick={() => navigate(isOwnListing ? '/dashboard' : '/vendors')}>{isOwnListing ? '← Back to Profile' : '← Back to Results'}</button>
        <div className="dh-row">
          <div className="dh-av">{v.icon}</div>
          <div className="dh-info">
            <h1>{v.name}</h1>
            <div className="dh-tags">
              <span className="dh-tag">{v.cat}</span>
              <span className="dh-tag">📍 {v.loc}</span>
            </div>
            <div className="dh-r">
              <span className="dh-rating">{'★'.repeat(Math.round(parseFloat(v.rating) || 0))}{'☆'.repeat(5 - Math.round(parseFloat(v.rating) || 0))} {v.rating}</span>
              <span className="dh-rev">({v.reviews} reviews)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-bar">
        {['overview', 'gallery', 'reviews', ...(userType !== 'vendor' ? ['contact'] : [])].map(tab => (
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
                  <div className="ov-meta-label">Service Area</div>
                  <div className="ov-meta-val">{(v.loc.split(',')[1] || v.loc).trim()} area</div>
                </div>
              </div>
            </div>
            {userType !== 'vendor' && (
              <div className="cc-card">
                <h3>Contact this Vendor</h3>
                <div className="cc-row">📍 <span>{v.loc}</span></div>
                <div className="cc-row">💌 Responds within 24 hours</div>
                <div className="cc-row">✓ Identity verified by Pallaki</div>
                <button className="inq-btn" onClick={sendInquiry}>Send Inquiry →</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gallery */}
      {activeTab === 'gallery' && (
        <div className="tc active">
          {v.portfolio_urls?.length > 0 || v.featured_urls?.length > 0 ? (
            <div>
              {v.portfolio_urls?.length > 0 && (
                <div>
                  <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1rem', color: 'var(--vx)', marginBottom: '1rem', fontWeight: 400 }}>Portfolio</p>
                  <div className="gal-grid" style={{ marginBottom: '2rem' }}>
                    {v.portfolio_urls.map((url, i) => (
                      <div key={i} className="gal-item" style={{ background: 'var(--cd)', padding: 0, overflow: 'hidden' }}>
                        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {v.featured_urls?.length > 0 && (
                <div>
                  <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1rem', color: 'var(--vx)', marginBottom: '1rem', fontWeight: 400 }}>Featured Work</p>
                  <div className="gal-grid">
                    {v.featured_urls.map((url, i) => (
                      <div key={i} className="gal-item" style={{ background: 'var(--cd)', padding: 0, overflow: 'hidden' }}>
                        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

      {activeTab === 'reviews' && (
        <div className="tc active">
          <div className="rv-sum">
            <div>
              <div className="big-r">{v.rating || '—'}</div>
              <div className="r-lbl">{reviews.length} reviews</div>
            </div>
            <div className="r-bars">
              {[5,4,3,2,1].map(s => {
                const count = reviews.filter(r => r.stars === s).length
                const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0
                return (
                  <div key={s} className="r-row">
                    {s}★
                    <div className="r-bg"><div className="r-fill" style={{ width: `${pct}%` }} /></div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="rv-cards">
            {reviews.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--tl)', fontStyle: 'italic', padding: '2rem' }}>No reviews yet.</p>
            ) : reviews.map(r => (
              <div key={r.id} className="rv-card">
                <div className="rv-top">
                  <div>
                    <div className="rv-name">{r.reviewer_name}</div>
                    <div className="rv-det">{r.event_type}</div>
                  </div>
                  <div style={{ color: 'var(--g)', fontSize: '.82rem' }}>{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</div>
                </div>
                <p className="rv-txt">{r.review_text}</p>
              </div>
            ))}
          </div>
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
                <h3>Send an Inquiry</h3>
                <div className="cc-row">📍 <span>{v.loc}</span></div>
                <div className="cc-row">💌 Responds within 24 hours</div>
                <div className="cc-row">✓ Identity verified by Pallaki</div>
                <button className="inq-btn" onClick={sendInquiry}>Send Inquiry →</button>
              </div>
              <div className="gr-plug">
                <span className="gr-logo">⭐</span>
                <div className="gr-text">
                  <div className="gr-t">Google Reviews Integration</div>
                  <div className="gr-s">Live reviews coming soon</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <InquiryModal
        open={inquiryOpen}
        onClose={() => setInquiryOpen(false)}
        vendor={v}
        onShowAuth={onShowAuth}
      />
    </div>
  )
}
