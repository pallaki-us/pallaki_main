import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { IS_DEMO } from '../lib/env'
import { CAT_VENDORS } from '../data/vendors'

const CAT_CHIPS = [
  { icon: '📸', label: 'Photography' },
  { icon: '🪷', label: 'Mehndi Artists' },
  { icon: '💄', label: 'Bridal Makeup' },
  { icon: '🍛', label: 'Catering' },
  { icon: '🌸', label: 'Decor' },
  { icon: '🎵', label: 'Music & DJ' },
  { icon: '📋', label: 'Event Planners' },
  { icon: '🎪', label: 'Party Rentals' },
]

function renderStars(rating) {
  const n = Math.round(parseFloat(rating) || 0)
  return '★'.repeat(n) + '☆'.repeat(5 - n)
}

export default function TrendingSection() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeCat, setActiveCat] = useState('Photography')
  const [vendors, setVendors] = useState([])

  useEffect(() => { fetchTrending('Photography') }, [])

  async function fetchTrending(category) {
    if (!supabase || IS_DEMO) {
      setVendors(CAT_VENDORS[category] || [])
      return
    }
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name, city, state, icon, bg, rating, review_count, category')
        .eq('category', category)
        .order('rating', { ascending: false })
        .limit(5)
      if (error) throw error
      setVendors(data?.map(v => ({
        id: v.id,
        name: v.name,
        loc: `${v.city}, ${v.state}`,
        icon: v.icon,
        bg: v.bg || 'linear-gradient(135deg,#FDEAED,#F5C4CB)',
        rating: v.rating?.toFixed(1),
        reviews: v.review_count,
      })) || [])
    } catch (err) {
      console.error('Failed to fetch trending vendors:', err)
      setVendors(CAT_VENDORS[category] || [])
    }
  }

  function selectCat(label) {
    setActiveCat(label)
    fetchTrending(label)
  }

  function prevCat() {
    const i = CAT_CHIPS.findIndex(c => c.label === activeCat)
    selectCat(CAT_CHIPS[(i - 1 + CAT_CHIPS.length) % CAT_CHIPS.length].label)
  }

  function nextCat() {
    const i = CAT_CHIPS.findIndex(c => c.label === activeCat)
    selectCat(CAT_CHIPS[(i + 1) % CAT_CHIPS.length].label)
  }

  return (
    <section className="trending-section">
      <div className="trending-inner">
        <div className="trending-header">
          <h2 className="trending-title">Trending on Pallaki</h2>
        </div>
        <div className="loved-scroll">
          {CAT_CHIPS.map(c => (
            <div
              key={c.label}
              className={`loved-chip${activeCat === c.label ? ' active' : ''}`}
              onClick={() => selectCat(c.label)}
            >
              <div className="loved-circle">{c.icon}</div>
              <span className="loved-name">{c.label}</span>
            </div>
          ))}
        </div>
        <div className="tv-header">
          <span className="tv-label">{activeCat} · Most Searched</span>
          <span className="tv-view-all" onClick={() => navigate(`/vendors?cat=${encodeURIComponent(activeCat)}`)}>View All →</span>
        </div>
        <div className="tv-track-wrap">
          <button className="tv-arr" onClick={prevCat}>‹</button>
          <div className="tv-track" id="tv-track">
            {vendors.map((v, i) => (
              <div key={v.id ?? i} className="tv-card" onClick={() => user ? navigate(`/vendor/${v.id}`) : navigate('/planner/login')}>
                <div className="tv-card-img" style={{ background: v.bg }}>
                  <div className="tv-card-rank">#{i + 1}</div>
                  {v.icon}
                </div>
                <div className="tv-card-body">
                  <div className="tv-card-name">{v.name}</div>
                  <div className="tv-card-loc">📍 {v.loc}</div>
                  <div className="tv-card-rat">{renderStars(v.rating)} {v.rating} · {v.reviews} reviews</div>
                </div>
              </div>
            ))}
          </div>
          <button className="tv-arr" onClick={nextCat}>›</button>
        </div>
      </div>
    </section>
  )
}
