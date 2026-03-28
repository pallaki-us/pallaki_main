import { useState, useMemo } from 'react'
import { EVENT_CATS } from '../data/vendors'
import { useVendors } from '../lib/useVendors'
import { useAuth } from '../lib/AuthContext'

const ITEMS_PER_PAGE = 9

export default function Listing({ initCat = 'All', initCity = '', onShowDetail, onGoHome }) {
  const { user } = useAuth()
  const { vendors: allVendors, loading } = useVendors('All')
  const [activeCat, setActiveCat] = useState(initCat)
  const [filter, setFilter] = useState('all')
  const [otherCity, setOtherCity] = useState('')
  const [page, setPage] = useState(1)

  const tabs = EVENT_CATS['Wedding'] // show all cats regardless of event type

  const filtered = useMemo(() => {
    let list = activeCat === 'All'
      ? allVendors
      : allVendors.filter(v => v.cat === activeCat || v.services.some(s => s.toLowerCase().includes(activeCat.toLowerCase())))

    if (filter === 'top') list = list.filter(v => v.badge === 'top')
    else if (filter === 'my-loc' && initCity) {
      const lc = initCity.toLowerCase()
      list = list.filter(v => v.loc.toLowerCase().includes(lc))
    } else if (filter === 'other' && otherCity) {
      const lc = otherCity.toLowerCase()
      list = list.filter(v => v.loc.toLowerCase().includes(lc))
    }
    return list
  }, [activeCat, filter, otherCity, initCity, allVendors])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const pageItems = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  function switchCat(cat) { setActiveCat(cat); setPage(1) }
  function switchFilter(f) { setFilter(f); setPage(1) }

  return (
    <div id="page-listing">
      {/* Header */}
      <div className="lh">
        <button className="lh-back" onClick={onGoHome}>← Back to Home</button>
        <h1 className="lh-title">{activeCat === 'All' ? 'All Vendors' : `${activeCat} Vendors`}</h1>
        <p className="lh-sub">{initCity ? `Showing vendors in ${initCity}` : 'Browse our curated vendor network'}</p>
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
        <div className={`fchip${filter === 'all' ? ' act' : ''}`} onClick={() => switchFilter('all')}>All</div>
        <div className={`fchip${filter === 'top' ? ' act' : ''}`} onClick={() => switchFilter('top')}>Top Rated</div>
        {initCity && (
          <div className={`fchip${filter === 'my-loc' ? ' act' : ''}`} onClick={() => switchFilter('my-loc')}>
            📍 {initCity}
          </div>
        )}
        <div className="other-loc-wrap">
          <span style={{ fontSize: '.74rem', color: 'var(--tl)' }}>🌍</span>
          <input
            type="text"
            placeholder="Search other city…"
            value={otherCity}
            onChange={e => { setOtherCity(e.target.value); if (e.target.value) switchFilter('other'); else switchFilter('all') }}
            style={{ border: 'none', outline: 'none', fontFamily: "'DM Sans',sans-serif", fontSize: '.74rem', color: 'var(--td)', background: 'transparent', width: 130 }}
          />
          {otherCity && (
            <button onClick={() => { setOtherCity(''); switchFilter('all') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tl)', fontSize: '.9rem', padding: 0 }}>×</button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="lb">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--tl)', fontFamily: "'Cormorant Garamond',serif", fontSize: '1.2rem', fontStyle: 'italic' }}>
            Loading vendors…
          </div>
        ) : pageItems.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌸</div>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.4rem', color: 'var(--vx)', marginBottom: '.6rem' }}>We're working on it!</h3>
            <p style={{ fontSize: '.9rem', color: 'var(--tl)', maxWidth: 360, margin: '0 auto' }}>No vendors match this filter yet. Try a different filter!</p>
            <button className="btn-p" style={{ marginTop: '1.5rem' }} onClick={() => switchFilter('all')}>Show All Vendors</button>
          </div>
        ) : (          <div className="lg">
            {pageItems.map(v => (
              <div key={v.id} className="vc" onClick={() => onShowDetail(v.id)}>
                <div className="vc-img" style={{ background: `linear-gradient(135deg,${v.bg})` }}>
                  {v.icon}
                  {v.badge === 'featured' && <div className="vcbdg bdg-f">Featured</div>}
                  {v.badge === 'top' && <div className="vcbdg bdg-t">Top Rated</div>}
                </div>
                <div className="vc-body">
                  <div className="vc-meta">
                    <span className="vc-cat">{v.cat}</span>
                    <div className="vc-rat"><span className="stars">★★★★★</span> {v.rating} ({v.reviews})</div>
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
