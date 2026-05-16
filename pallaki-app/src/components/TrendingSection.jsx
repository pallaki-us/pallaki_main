import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { IS_DEMO, IS_PROD } from '../lib/env'
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

const VISIBLE = 4
const GAP = 16

function renderStars(rating) {
  const n = Math.round(parseFloat(rating) || 0)
  return '★'.repeat(n) + '☆'.repeat(5 - n)
}

export default function TrendingSection() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeCat, setActiveCat] = useState('All')
  const [vendors, setVendors] = useState([])
  const [slide, setSlide] = useState(0)
  const [animated, setAnimated] = useState(true)
  const [cardPx, setCardPx] = useState(0)
  const wrapRef = useRef(null)
  const timerRef = useRef(null)
  const slideRef = useRef(0)
  slideRef.current = slide

  useEffect(() => { fetchTrending('All') }, [])

  // Measure card width whenever vendors or window size changes
  useEffect(() => {
    function measure() {
      if (!wrapRef.current) return
      const card = wrapRef.current.querySelector('.tv-card')
      if (card) setCardPx(card.getBoundingClientRect().width + GAP)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [vendors])

  // Auto-advance timer — only resets when vendors change
  useEffect(() => {
    clearInterval(timerRef.current)
    if (vendors.length <= VISIBLE) return
    timerRef.current = setInterval(() => {
      setAnimated(true)
      setSlide(slideRef.current + 1)
    }, 3500)
    return () => clearInterval(timerRef.current)
  }, [vendors])

  // When slide reaches the cloned zone, silently jump back to start
  useEffect(() => {
    if (vendors.length === 0 || slide < vendors.length) return
    const t = setTimeout(() => {
      setAnimated(false)
      setSlide(0)
    }, 500)
    return () => clearTimeout(t)
  }, [slide, vendors.length])

  // Re-enable animation after silent reset
  useEffect(() => {
    if (!animated) requestAnimationFrame(() => requestAnimationFrame(() => setAnimated(true)))
  }, [animated])

  async function fetchTrending(category) {
    setSlide(0)
    if (!supabase || IS_DEMO) {
      const demo = category === 'All'
        ? Object.values(CAT_VENDORS).flat()
        : (CAT_VENDORS[category] || [])
      setVendors(IS_PROD ? [] : demo)
      return
    }
    try {
      let query = supabase
        .from('vendors')
        .select('id, name, city, state, icon, bg, rating, review_count, category, avatar_url')
        .order('rating', { ascending: false })
        .limit(8)
      if (category !== 'All') query = query.eq('category', category)
      const { data, error } = await query
      if (error) throw error
      setVendors(data?.map(v => ({
        id: v.id,
        name: v.name,
        loc: `${v.city}, ${v.state}`,
        icon: v.icon,
        bg: v.bg || 'linear-gradient(135deg,#FDEAED,#F5C4CB)',
        rating: v.rating?.toFixed(1),
        reviews: v.review_count,
        avatar_url: v.avatar_url || null,
      })) || [])
    } catch {
      setVendors(CAT_VENDORS[category] || [])
    }
  }

  function selectCat(label) {
    setActiveCat(label)
    fetchTrending(label)
  }

  function prev() {
    clearInterval(timerRef.current)
    setAnimated(true)
    setSlide(s => Math.max(0, s - 1))
  }

  function next() {
    clearInterval(timerRef.current)
    setAnimated(true)
    setSlide(s => s + 1)
  }

  // Clone first VISIBLE cards at the end for seamless infinite loop
  const allCards = vendors.length > VISIBLE
    ? [...vendors, ...vendors.slice(0, VISIBLE)]
    : vendors

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

        <div className="tv-slideshow">
          {vendors.length > VISIBLE && (
            <button className="tv-arr" onClick={prev}>‹</button>
          )}
          <div className="tv-slideshow-wrap" ref={wrapRef}>
            <div
              className="tv-track"
              style={{
                transform: `translateX(-${slide * cardPx}px)`,
                transition: animated ? 'transform 0.5s ease' : 'none',
              }}
            >
              {allCards.map((v, i) => (
                <div
                  key={i}
                  className="tv-card"
                  onClick={() => user ? navigate(`/vendor/${v.id}`) : navigate('/planner/login')}
                >
                  <div className="tv-card-img" style={v.avatar_url ? {} : { background: v.bg }}>
                    {v.avatar_url
                      ? <img src={v.avatar_url} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: '2.8rem' }}>📷</span>}
                  </div>
                  <div className="tv-card-body">
                    <div className="tv-card-name">{v.name}</div>
                    <div className="tv-card-loc">📍 {v.loc}</div>
                    <div className="tv-card-rat">{renderStars(v.rating)} {v.rating} · {v.reviews} reviews</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {vendors.length > VISIBLE && (
            <button className="tv-arr" onClick={next}>›</button>
          )}
        </div>
      </div>
    </section>
  )
}
