import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { EVENT_CATS } from '../data/vendors'
import { useVendors } from '../lib/useVendors'
import { useAuth } from '../lib/AuthContext'
import { trackSearch } from '../lib/analytics'

export default function Listing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initCat = searchParams.get('cat') || 'All'
  const initCity = searchParams.get('city') || ''

  const [activeCat, setActiveCat] = useState(initCat)
  const [topRated, setTopRated] = useState(false)
  const [otherCity, setOtherCity] = useState('')
  const [page, setPage] = useState(1)

  const city = otherCity || initCity
  const { vendors, loading, total } = useVendors(activeCat, city, page, topRated)
  const totalPages = Math.ceil(total / 9)
  const tabs = EVENT_CATS['Wedding']

  function switchCat(cat) { setActiveCat(cat); setPage(1); trackSearch('', cat, city) }

  function handleVendorClick(id) {
    if (!user) { navigate('/planner/login'); return }
    navigate(`/vendor/${id}`)
  }

  return (
    <div id="page-listing">
      {/* Header */}
      <div className="lh">
        <button className="lh-back" onClick={() => navigate('/')}>← Back to Home</button>
        <h1 className="lh-title">{activeCat === 'All' ? 'All Vendors' : `${activeCat} Vendors`}</h1>
        <p className="lh-sub">{city ? `Showing vendors in ${city}` : 'Browse our curated vendor network'}</p>
      </div>

      {/* Category tabs */}
      <div className="cat-tabs">
        {tabs.map(t => (
          <button
            key={t}
            className={`ct-tab${activeCat === t ? ' active' : ''}`}
            onClick={() => switchCat(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="l-filters">
        <span style={{ fontSize: '.74rem', color: 'var(--tl)', fontWeight: 500 }}>Filter:</span>
        <div className={`fchip${activeCat === 'All' && !topRated ? ' act' : ''}`} onClick={() => { switchCat('All'); setTopRated(false) }}>All</div>
        <div className={`fchip${topRated ? ' act' : ''}`} onClick={() => { setTopRated(t => !t); setPage(1) }}>Top Rated</div>
        {activeCat !== 'All' && (
          <div className="fchip act" style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
            {activeCat}
            <span style={{ cursor: 'pointer', opacity: .7 }} onClick={() => switchCat('All')}>×</span>
          </div>
        )}
        <div className="other-loc-wrap">
          <span style={{ fontSize: '.74rem', color: 'var(--tl)' }}>🌍</span>
          <input
            type="text"
            placeholder="Search other city…"
            value={otherCity}
            onChange={e => { setOtherCity(e.target.value); setPage(1) }}
            style={{ border: 'none', outline: 'none', fontFamily: "'Cormorant Garamond',serif", fontSize: '.74rem', color: 'var(--td)', background: 'transparent', width: 130 }}
          />
          {otherCity && (
            <button onClick={() => setOtherCity('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tl)', fontSize: '.9rem', padding: 0 }}>×</button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="lb">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--tl)', fontFamily: "'Cormorant Garamond',serif", fontSize: '1.2rem', fontStyle: 'italic' }}>
            Loading vendors…
          </div>
        ) : vendors.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌸</div>
            <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.4rem', color: 'var(--vx)', marginBottom: '.6rem' }}>We're working on it!</h3>
            <p style={{ fontSize: '.9rem', color: 'var(--tl)', maxWidth: 360, margin: '0 auto' }}>No vendors match this filter yet. Try a different filter!</p>
            <button className="btn-p" style={{ marginTop: '1.5rem' }} onClick={() => { switchCat('All'); setTopRated(false) }}>Show All Vendors</button>
          </div>
        ) : (
          <div className="lg">
            {vendors.map(v => (
              <div key={v.id} className="vc" onClick={() => handleVendorClick(v.id)}>
                <div className="vc-img" style={{ background: `linear-gradient(135deg,${v.bg})` }}>
                  {v.icon}
                  {v.badge === 'featured' && <div className="vcbdg bdg-f">Featured</div>}
                  {v.badge === 'top' && <div className="vcbdg bdg-t">Top Rated</div>}
                </div>
                <div className="vc-body">
                  <div className="vc-meta">
                    <span className="vc-cat">{v.cat}</span>
                    <div className="vc-rat">
                      <span className="stars">{'★'.repeat(Math.round(parseFloat(v.rating) || 0))}{'☆'.repeat(5 - Math.round(parseFloat(v.rating) || 0))}</span> {v.rating} ({v.reviews})
                    </div>
                  </div>
                  <div className="vc-name">{v.name}</div>
                  <div className="vc-loc">📍 {v.loc}</div>
                  <p className="vc-desc">{v.desc}</p>
                  <div className="vc-foot">
                    <button className="vc-btn">View Profile</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            {page > 1 && <div className="pg-btn" onClick={() => setPage(p => p - 1)}>←</div>}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <div key={n} className={`pg-btn${n === page ? ' act' : ''}`} onClick={() => setPage(n)}>{n}</div>
            ))}
            {page < totalPages && <div className="pg-btn" onClick={() => setPage(p => p + 1)}>→</div>}
          </div>
        )}
      </div>
    </div>
  )
}
