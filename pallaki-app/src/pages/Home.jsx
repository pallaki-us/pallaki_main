import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { IS_DEMO, IS_PROD } from '../lib/env'
import AnimatedLogo from '../components/AnimatedLogo'
import TrendingSection from '../components/TrendingSection'
import HowItWorksSection from '../components/HowItWorksSection'
import TestimonialsSection from '../components/TestimonialsSection'
import ContactSection from '../components/ContactSection'
import ourStoryImg from '../assets/our story.jpg'

const DEMO_CITIES = ['Dallas', 'Chicago', 'Atlanta', 'Houston', 'Los Angeles', 'New York', 'San Jose', 'Seattle', 'Austin', 'New Jersey']

const EVENT_TYPES = [
  { icon: '💍', label: 'Wedding' },
  { icon: '💕', label: 'Pre-Wedding' },
  { icon: '🏡', label: 'House Warming' },
  { icon: '🎂', label: 'Birthday' },
  { icon: '🍼', label: 'Baby Shower' },
]

export default function Home({ onShowAuth }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selEvent, setSelEvent] = useState('Wedding')
  const [city, setCity] = useState('')
  const [cat, setCat] = useState('')
  const [noMatch, setNoMatch] = useState(false)
  const [citySuggestions, setCitySuggestions] = useState([])
  const [stats, setStats] = useState({ vendors: 0, cities: 0, categories: 10, planners: 0 })

  useEffect(() => {
    fetchCities()
    if (IS_PROD) fetchStats()
  }, [])

  async function fetchCities() {
    if (!supabase || IS_DEMO) return
    try {
      const { data, error } = await supabase.from('vendors').select('city')
      if (error) throw error
      const unique = [...new Set(data.map(v => v.city).filter(Boolean))].sort()
      setCitySuggestions(unique)
    } catch (err) {
      console.error('Failed to fetch cities:', err)
    }
  }

  async function fetchStats() {
    if (!supabase) return
    try {
      const [vendorsRes, plannersRes] = await Promise.all([
        supabase.from('vendors').select('city', { count: 'exact' }),
        supabase.from('planner_profiles').select('id', { count: 'exact' }),
      ])
      if (vendorsRes.error) throw vendorsRes.error
      const vendorCount = vendorsRes.count || 0
      const cities = vendorsRes.data
        ? new Set(vendorsRes.data.map(v => v.city?.toLowerCase()).filter(Boolean)).size
        : 0
      setStats({ vendors: vendorCount, cities, categories: 10, planners: plannersRes.count || 0 })
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  function checkCity(v) {
    setCity(v)
    setNoMatch(v.length > 2 && citySuggestions.length > 0 && !citySuggestions.some(c => c.toLowerCase().includes(v.toLowerCase())))
  }

  function doSearch() {
    if (!user) { onShowAuth('planner'); return }
    const params = new URLSearchParams()
    if (cat) params.set('cat', cat)
    if (city) params.set('city', city)
    navigate(`/vendors${params.toString() ? '?' + params.toString() : ''}`)
  }

  return (
    <div>
      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-pat" />
        <div className="hero-c">
          <div className="hero-title-box">
            <span className="htb-corner tl">❧</span>
            <span className="htb-corner tr">❧</span>
            <span className="htb-corner bl">❧</span>
            <span className="htb-corner br">❧</span>
            <div className="htb-edge top">
              <div className="htb-edge-bg">
                <div className="htb-edge-dot" />
                <span className="htb-edge-gem">◆ ◇ ◆ ◇ ◆</span>
                <div className="htb-edge-dot" />
              </div>
            </div>
            <div className="htb-edge bot">
              <div className="htb-edge-bg">
                <div className="htb-edge-dot" />
                <span className="htb-edge-gem">◇ ◆ ◇ ◆ ◇</span>
                <div className="htb-edge-dot" />
              </div>
            </div>
            <div className="htb-side left">
              <div className="htb-side-dot" /><div className="htb-side-dot big" /><div className="htb-side-dot" />
            </div>
            <div className="htb-side right">
              <div className="htb-side-dot" /><div className="htb-side-dot big" /><div className="htb-side-dot" />
            </div>
            <h1 style={{ textAlign: 'center' }}>Rooted in Tradition,<br />Celebrated Everywhere.</h1>
            <p className="hero-sub">Find South Asian wedding vendors who understand your story.</p>
          </div>

          <span className="ev-label">Looking vendors for</span>
          <div className="ev-row">
            {EVENT_TYPES.map(e => (
              <div
                key={e.label}
                className={`ev-card${selEvent === e.label ? ' sel' : ''}`}
                onClick={() => setSelEvent(e.label)}
              >
                <span className="ei">{e.icon}</span>
                <span className="en">{e.label}</span>
              </div>
            ))}
          </div>

          <div className="srch-wrap">
            <div className="srch-bar">
              <select value={cat} onChange={e => setCat(e.target.value)}>
                <option value="">All Categories</option>
                <option>Photography</option>
                <option>Mehndi Artists</option>
                <option>Bridal Makeup</option>
                <option>Catering</option>
                <option>Mandap &amp; Decor</option>
                <option>Music &amp; DJ</option>
                <option>Priests &amp; Pandits</option>
                <option>Bridal Lehenga</option>
                <option>Bridal Jewellery</option>
                <option>Wedding Venue</option>
              </select>
              <input
                type="text"
                placeholder="City or zip code…"
                value={city}
                onChange={e => checkCity(e.target.value)}
              />
              <button className="srch-btn" onClick={doSearch}>Search</button>
            </div>
            {noMatch && (
              <div className="no-match show">😕 No vendors in that area yet — check nearby cities!</div>
            )}
            <div className="pop-tags">
              {citySuggestions.slice(0, 7).map(c => (
                <span key={c} className="tag" onClick={() => { setCity(c); setNoMatch(false) }}>📍 {c}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <TrendingSection onShowAuth={onShowAuth} />

      {/* ── FEATURED CITIES ── */}
      <section className="cities-section">
        <div className="cities-inner">
          <span className="cities-label">Vendors available across</span>
          <div className="cities-row">
            {(citySuggestions.length > 0 ? citySuggestions : DEMO_CITIES).map(c => (
              <span key={c} className="city-chip" onClick={() => { if (!user) { onShowAuth('planner'); return } navigate(`/vendors?city=${encodeURIComponent(c)}`) }}>📍 {c}</span>
            ))}
          </div>
        </div>
      </section>

      <div className="sec-divider"><span>◆ ◇ ◆</span></div>

      <HowItWorksSection />

      {/* ── OUR STORY ── */}
      <section className="about-section" id="our-story">
        <h2 className="how-title" style={{ marginBottom: '2.5rem' }}>Our Story</h2>
        <div className="about-inner">
          <div className="about-text">
            <p>Hi, we're Shruti and Vamsi — the founders of Pallaki — and a couple who have been through this journey ourselves.</p>
            <p>When we started planning our wedding in the U.S., one of the biggest challenges we faced wasn't finding vendors — it was finding them easily. Most of our search happened through endless scrolling on Instagram, jumping between pages, sending DMs, and waiting for responses. Everything felt scattered, and there was no single place to explore options in a structured way.</p>
            <p>At the same time, we realized how valuable it was to work with vendors who understood our traditions and expectations without needing detailed explanations. That sense of familiarity made the experience so much smoother.</p>
            <p>We were fortunate to have a beautiful wedding at the BAPS Swaminarayan Temple Chino Hills — a day filled with love and memories we'll always cherish. But getting there involved more effort than it should have.</p>
            <p>That's why we created Pallaki. A one-stop platform designed to make vendor discovery simple and streamlined. Instead of spending hours searching across different platforms, couples can find everything they need in one place.</p>
            <p>Our goal is simple — to remove the hassle, bring everything together, and make wedding planning a more seamless experience. Welcome — this space was built for you.</p>
            <div className="stats-mini" style={{ marginTop: '2rem' }}>
              {[
                [IS_PROD ? (stats.vendors > 0 ? `${stats.vendors}+` : '—') : '100+', 'Verified Vendors'],
                [IS_PROD ? (stats.cities > 0 ? `${stats.cities}` : '—') : '9', 'Cities Covered'],
                [stats.categories, 'Categories'],
                [IS_PROD ? (stats.planners > 0 ? `${stats.planners}+` : '—') : '200+', 'Happy Families'],
              ].map(([n, l]) => (
                <div key={l} className="smi">
                  <div className="smi-n">{n}</div>
                  <div className="smi-l">{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="about-photo">
            <img src={ourStoryImg} alt="Shruti and Vamsi" />
          </div>
        </div>
      </section>

      <TestimonialsSection />

      <div className="sec-divider"><span>◆ ◇ ◆</span></div>

      {/* ── FOR VENDORS ── */}
      <section className="fv-section">
        <div className="fv-inner">
          <div className="fv-left">
            <span className="sec-lbl">For Vendors</span>
            <h2 className="fv-title">Grow Your Business<br />with <em>Pallaki</em></h2>
            <p className="fv-desc">Join the largest South Asian event vendor network in America — where thousands of families come to find exactly who they're looking for.</p>
            <div className="fv-benefits">
              {[
                ['🎯', 'Get found by the right clients', '— Families searching for your exact service, in your city, right now.'],
                ['📸', 'Showcase your best work', '— Build a stunning portfolio with photos, videos, and verified reviews.'],
                ['💬', 'Inquiries come to you', '— Direct messages from real event planners, all in one dashboard.'],
                ['📈', 'Watch your business grow', '— Track views, leads, and bookings with live analytics.'],
              ].map(([icon, bold, rest]) => (
                <div key={bold} className="fv-b">
                  <span className="fv-b-icon">{icon}</span>
                  <span className="fv-b-text"><strong>{bold}</strong> {rest}</span>
                </div>
              ))}
            </div>
            <div className="fv-trust">
              <div className="fv-trust-av">
                {['R', 'A', 'S', 'M'].map(l => <span key={l}>{l}</span>)}
              </div>
              <p className="fv-trust-txt"><strong>{IS_PROD ? (stats.vendors > 0 ? `${stats.vendors}+` : 'Growing') : '100+'} vendors</strong> already growing on Pallaki</p>
            </div>
          </div>
        </div>
      </section>

      <ContactSection />

      {/* ── FOOTER ── */}
      <footer>
        <div className="fi">
          <div>
            <div className="flogo"><AnimatedLogo size="1.65rem" color="var(--gl)" /></div>
            <p className="ftag">Where Indian traditions meet American celebrations.</p>
          </div>
          <div className="fc">
            <h4>Discover</h4>
            {['Photography', 'Mehndi Artists', 'Bridal Makeup', 'Catering'].map(c => (
              <a key={c} onClick={() => navigate(`/vendors?cat=${encodeURIComponent(c)}`)}>{c}</a>
            ))}
          </div>
          <div className="fc">
            <h4>Events</h4>
            {['Weddings', 'Engagements', 'Baby Showers', 'Birthdays'].map(e => (
              <a key={e}>{e}</a>
            ))}
          </div>
          <div className="fc">
            <h4>Company</h4>
            <a style={{ cursor: 'pointer' }} onClick={() => document.getElementById('our-story')?.scrollIntoView({ behavior: 'smooth' })}>About Us</a>
            <a style={{ cursor: 'pointer' }} onClick={() => onShowAuth('vendor', true)}>For Vendors</a>
            <a style={{ cursor: 'pointer' }} onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>How It Works</a>
            <a style={{ cursor: 'pointer' }} onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>Contact</a>
          </div>
        </div>
        <div className="fb">
          <span>© 2025 Pallaki. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '1.2rem' }}>
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/privacy')}>Privacy Policy</span>
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/terms')}>Terms & Conditions</span>
          </div>
          <span>Made with 🌸 for South Asian families in America</span>
        </div>
      </footer>
    </div>
  )
}
