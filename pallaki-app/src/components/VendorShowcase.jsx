import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { VENDORS } from '../data/vendors'
import { IS_PROD } from '../lib/env'

export default function VendorShowcase() {
  const [vendors, setVendors] = useState([])
  const [current, setCurrent] = useState(0)
  const [fade, setFade] = useState(true)

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

    }
    fetchVendors()
  }, [])

  // Cycle vendors every 5s
  useEffect(() => {
    if (vendors.length < 2) return
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => { setCurrent(i => (i + 1) % vendors.length); setFade(true) }, 350)
    }, 5000)
    return () => clearInterval(interval)
  }, [vendors])

  if (!vendors.length) return null

  const v = vendors[current]
  const loc = v.loc || (v.city && v.state ? `${v.city}, ${v.state}` : v.city || '')
  const icon = v.icon || '📸'
  const cat = v.category || v.cat

  return (
    <div className="fv-right">
      <div className="fv-right-pattern" />

      {/* Dot navigation */}
      <div style={{ display: 'flex', gap: 5, padding: '1rem 1.8rem .5rem', justifyContent: 'flex-end' }}>
        {vendors.map((_, i) => (
          <div key={i}
            onClick={() => { setFade(false); setTimeout(() => { setCurrent(i); setFade(true) }, 200) }}
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
          </div>
        </div>

      </div>
    </div>
  )
}
