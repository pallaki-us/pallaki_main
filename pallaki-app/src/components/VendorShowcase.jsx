import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { VENDORS } from '../data/vendors'

const IS_PROD = import.meta.env.VITE_ENV === 'prod'

export default function VendorShowcase() {
  const [vendors, setVendors] = useState([])
  const [current, setCurrent] = useState(0)
  const [fade, setFade] = useState(true)
  const [reviewIdx, setReviewIdx] = useState(0)
  const [reviewFade, setReviewFade] = useState(true)
  const [reviewsMap, setReviewsMap] = useState({}) // vendorId -> reviews[]

  useEffect(() => {
    async function fetchVendors() {
      if (!supabase) {
        if (!IS_PROD) setVendors(VENDORS.slice(0, 6))
        return
      }
      const { data } = await supabase
        .from('vendors')
        .select('id, name, category, city, state, icon, bg, rating, review_count, is_verified')
        .eq('is_verified', true)
        .order('rating', { ascending: false })
        .limit(8)
      const list = IS_PROD ? (data || []) : (data?.length ? data : VENDORS.slice(0, 6))
      setVendors(list)

      // Fetch reviews for all these vendors
      if (supabase && list.length) {
        const ids = list.map(v => v.id).filter(Boolean)
        if (ids.length) {
          const { data: revData } = await supabase
            .from('reviews')
            .select('vendor_id, reviewer_name, event_type, body, rating, review_text, stars')
            .in('vendor_id', ids)
            .order('created_at', { ascending: false })
          if (revData) {
            const map = {}
            revData.forEach(r => {
              if (!map[r.vendor_id]) map[r.vendor_id] = []
              map[r.vendor_id].push({
                name: r.reviewer_name || 'Anonymous',
                event: r.event_type,
                text: r.review_text || r.body,
                stars: r.stars || r.rating,
              })
            })
            setReviewsMap(map)
          }
        }
      }
    }
    fetchVendors()
  }, [])

  // Cycle vendors every 5s
  useEffect(() => {
    if (vendors.length < 2) return
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => { setCurrent(i => (i + 1) % vendors.length); setReviewIdx(0); setFade(true) }, 350)
    }, 5000)
    return () => clearInterval(interval)
  }, [vendors])

  // Cycle reviews within a vendor every 3s
  useEffect(() => {
    if (!vendors.length) return
    const v = vendors[current]
    const reviews = reviewsMap[v?.id] || []
    if (reviews.length < 2) return
    const interval = setInterval(() => {
      setReviewFade(false)
      setTimeout(() => { setReviewIdx(i => (i + 1) % reviews.length); setReviewFade(true) }, 300)
    }, 3000)
    return () => clearInterval(interval)
  }, [current, vendors, reviewsMap])

  if (!vendors.length) return null

  const v = vendors[current]
  const loc = v.loc || (v.city && v.state ? `${v.city}, ${v.state}` : v.city || '')
  const icon = v.icon || '📸'
  const rating = v.rating?.toFixed ? v.rating.toFixed(1) : v.rating
  const reviewCount = v.review_count ?? v.reviews ?? 0
  const cat = v.category || v.cat
  const reviews = reviewsMap[v?.id] || []
  const activeReview = reviews[reviewIdx]

  return (
    <div className="fv-right">
      <div className="fv-right-pattern" />

      {/* Dot navigation */}
      <div style={{ display: 'flex', gap: 5, padding: '1rem 1.8rem .5rem', justifyContent: 'flex-end' }}>
        {vendors.map((_, i) => (
          <div key={i}
            onClick={() => { setFade(false); setTimeout(() => { setCurrent(i); setReviewIdx(0); setFade(true) }, 200) }}
            style={{ width: i === current ? 18 : 6, height: 6, borderRadius: 3, background: i === current ? 'var(--gl)' : 'rgba(255,255,255,.2)', transition: 'all .3s', cursor: 'pointer' }}
          />
        ))}
      </div>

      <div style={{ transition: 'opacity .35s', opacity: fade ? 1 : 0, flex: 1, display: 'flex', flexDirection: 'column', padding: '0 1.8rem 1.8rem' }}>

        {/* Vendor card */}
        <div style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 14, padding: '1rem 1.1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>{icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.05rem', color: '#fff', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.name}</div>
              <div style={{ display: 'flex', gap: '.4rem', marginTop: '.25rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '.6rem', background: 'rgba(196,132,140,.3)', color: 'rgba(254,249,247,.8)', padding: '.15rem .5rem', borderRadius: 20 }}>{cat}</span>
                <span style={{ fontSize: '.6rem', background: 'rgba(255,255,255,.08)', color: 'rgba(254,249,247,.6)', padding: '.15rem .5rem', borderRadius: 20 }}>📍 {loc}</span>
                {v.is_verified && <span style={{ fontSize: '.6rem', background: 'rgba(196,154,60,.2)', color: 'var(--gl)', padding: '.15rem .5rem', borderRadius: 20 }}>✓ Verified</span>}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.2rem', color: 'var(--gl)', fontStyle: 'italic' }}>{rating || '—'}</div>
              <div style={{ fontSize: '.55rem', color: 'rgba(254,249,247,.4)', marginTop: 1 }}>{reviewCount} reviews</div>
            </div>
          </div>
          <div style={{ marginTop: '.75rem', display: 'flex', gap: '.3rem' }}>
            {[1,2,3,4,5].map(s => (
              <span key={s} style={{ color: s <= Math.round(rating || 0) ? 'var(--gl)' : 'rgba(255,255,255,.15)', fontSize: '.85rem' }}>★</span>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
          <div style={{ fontSize: '.58rem', color: 'rgba(254,249,247,.4)', textTransform: 'uppercase', letterSpacing: '.1em' }}>What families are saying</div>

          {activeReview ? (
            <div style={{ transition: 'opacity .3s', opacity: reviewFade ? 1 : 0 }}>
              <div style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '.9rem 1rem' }}>
                <div style={{ display: 'flex', gap: '.3rem', marginBottom: '.5rem' }}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} style={{ color: s <= activeReview.stars ? 'var(--gl)' : 'rgba(255,255,255,.15)', fontSize: '.75rem' }}>★</span>
                  ))}
                </div>
                <p style={{ fontSize: '.78rem', color: 'rgba(254,249,247,.75)', lineHeight: 1.65, fontStyle: 'italic', marginBottom: '.6rem' }}>"{activeReview.text}"</p>
                <div style={{ fontSize: '.65rem', color: 'rgba(254,249,247,.45)', fontWeight: 500 }}>{activeReview.name} · <span style={{ fontWeight: 300 }}>{activeReview.event}</span></div>
              </div>
              {reviews.length > 1 && (
                <div style={{ display: 'flex', gap: 4, marginTop: '.5rem', justifyContent: 'center' }}>
                  {reviews.map((_, i) => (
                    <div key={i} style={{ width: i === reviewIdx ? 14 : 5, height: 5, borderRadius: 3, background: i === reviewIdx ? 'var(--gl)' : 'rgba(255,255,255,.2)', transition: 'all .3s' }} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '1.5rem 1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '.5rem' }}>🌸</div>
              <p style={{ fontSize: '.75rem', color: 'rgba(254,249,247,.4)', fontStyle: 'italic' }}>Reviews coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
