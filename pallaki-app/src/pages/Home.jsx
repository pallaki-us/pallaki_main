import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { IS_DEMO, IS_PROD } from '../lib/env'
import AnimatedLogo from '../components/AnimatedLogo'
import TrendingSection from '../components/TrendingSection'
import HowItWorksSection from '../components/HowItWorksSection'
import ContactSection from '../components/ContactSection'
import ourStoryImg from '../assets/our story.jpg'

const FEATURED_CITIES = ['Bay Area', 'Los Angeles', 'New York', 'New Jersey', 'Seattle', 'Atlanta', 'Chicago', 'Dallas']

const EVENT_TYPES = [
  { icon: '💍', label: 'Wedding' },
  { icon: '💕', label: 'Pre-Wedding' },
  { icon: '🏡', label: 'House Warming' },
  { icon: '🎂', label: 'Birthday' },
  { icon: '🍼', label: 'Baby Shower' },
]

export default function Home() {
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
    fetchStats()
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
        supabase.from('vendors').select('city, category', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('user_type', 'planner'),
      ])
      if (vendorsRes.error) throw vendorsRes.error
      const vendorCount = vendorsRes.count || 0
      const cities = vendorsRes.data
        ? new Set(vendorsRes.data.map(v => v.city?.toLowerCase()).filter(Boolean)).size
        : 0
      const categories = vendorsRes.data
        ? new Set(vendorsRes.data.map(v => v.category).filter(Boolean)).size
        : 0
      const planners = plannersRes.count || 0
      setStats({ vendors: vendorCount, cities, categories: categories || 10, planners })
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  function checkCity(v) {
    setCity(v)
    setNoMatch(v.length > 2 && citySuggestions.length > 0 && !citySuggestions.some(c => c.toLowerCase().includes(v.toLowerCase())))
  }

  function doSearch() {
    if (!user) { navigate('/planner/login'); return }
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
            <h1 style={{ textAlign: 'center' }}>Craft your dream celebration</h1>
            <p className="hero-sub">Find the curated South Asian vendors who bring your unique story of life.</p>
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
                <option>Decor</option>
                <option>Music &amp; DJ</option>
                <option>Event Planners</option>
                <option>Party Rentals</option>
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
              {FEATURED_CITIES.map(c => (
                <span key={c} className="tag" onClick={() => { setCity(c); setNoMatch(false) }}>📍 {c}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <TrendingSection />

      <div className="sec-divider"><span>◆ ◇ ◆</span></div>

      <HowItWorksSection />

      {/* ── OUR STORY ── */}
      <section className="about-section" id="our-story">
        <h2 className="how-title" style={{ marginBottom: '2.5rem' }}>Our Story</h2>
        <div className="about-inner">
          <div className="about-photo" style={{ marginBottom: '2rem' }}>
            <img src={ourStoryImg} alt="Shruti and Vamsi" />
          </div>
          <div className="about-text">
            <p>We're Shruti and Vamsi, the founders of Pallaki. Like many of you, our journey began with a vision for a beautiful wedding—and a spreadsheet that quickly got out of hand.</p>
            <p>When we planned our own wedding at the BAPS Swaminarayan Temple in Chino Hills, we didn't struggle to find talent; we struggled to find it easily. Our days were spent endlessly scrolling through Instagram, jumping between portfolios, and waiting on DMs. We realized there was a missing link: a central space where culture, tradition, and convenience met.</p>
            <p>We created Pallaki to be the platform we wish we'd had. We believe that finding a vendor who understands your traditions shouldn't require a dozen tabs and a week of research. We've brought everything together in one place so you can spend less time searching and more time celebrating.</p>
            <div className="stats-mini" style={{ marginTop: '2rem' }}>
              {[
                [stats.vendors > 0 ? `${stats.vendors}+` : '—', 'Verified Vendors'],
                [stats.cities > 0 ? `${stats.cities}` : '—', 'Cities Covered'],
                [stats.categories > 0 ? `${stats.categories}` : '—', 'Categories'],
                [stats.planners > 0 ? `${stats.planners * 2}+` : '—', 'Happy Families'],
              ].map(([n, l]) => (
                <div key={l} className="smi">
                  <div className="smi-n">{n}</div>
                  <div className="smi-l">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

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
          <div className="fv-right">
            <div className="fv-right-pattern" />
            <div className="fv-quotes">
              {[
                { icon: '💍', quote: "Finding vendors who truly understood our traditions was the hardest part. Pallaki made it effortless.", name: "Priya & Rohan", event: "Wedding · Dallas, TX" },
                { icon: '🌸', quote: "Every vendor we reached out to through Pallaki was professional and culturally aware. Planning felt less overwhelming than we expected.", name: "Anita & Vikram", event: "Wedding · Chicago, IL" },
                { icon: '📸', quote: "Pallaki brought us clients who understand the importance of what we do. The quality of inquiries is unlike anything else we've tried.", name: "Meera Nair Photography", event: "Photography Vendor · Atlanta, GA" },
              ].map((t, i) => (
                <div key={i} className={`fv-quote${i % 2 === 1 ? ' alt' : ''}`}>
                  <div className="fv-quote-stars">★★★★★</div>
                  <p className="fv-quote-text">"{t.quote}"</p>
                  <div className="fv-quote-author">
                    <span className="fv-quote-av">{t.icon}</span>
                    <div>
                      <div className="fv-quote-name">{t.name}</div>
                      <div className="fv-quote-event">{t.event}</div>
                    </div>
                  </div>
                </div>
              ))}
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
            <p className="ftag">Where South Asian traditions meet American celebrations.</p>
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
            <a style={{ cursor: 'pointer' }} onClick={() => navigate('/vendor/signup')}>For Vendors</a>
            <a style={{ cursor: 'pointer' }} onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>How It Works</a>
            <a style={{ cursor: 'pointer' }} onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>Contact</a>
          </div>
        </div>
        <div className="fb">
          <span>© 2026 Pallaki. All rights reserved.</span>
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
