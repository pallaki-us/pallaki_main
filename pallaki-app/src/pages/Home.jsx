import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import VendorShowcase from '../components/VendorShowcase'
import AnimatedLogo from '../components/AnimatedLogo'

const EVENT_TYPES = [
  { icon: '💍', label: 'Wedding' },
  { icon: '💕', label: 'Pre-Wedding' },
  { icon: '🏡', label: 'House Warming' },
  { icon: '🎂', label: 'Birthday' },
  { icon: '🍼', label: 'Baby Shower' },
]

const CAT_CHIPS = [
  { icon: '📸', label: 'Photography' },
  { icon: '🪷', label: 'Mehndi Artists' },
  { icon: '💄', label: 'Bridal Makeup' },
  { icon: '🍛', label: 'Catering' },
  { icon: '🌸', label: 'Mandap & Decor' },
  { icon: '🎵', label: 'Music & DJ' },
  { icon: '🪔', label: 'Priests & Pandits' },
]

export default function Home({ onSearch, onShowAuth, onShowDetail, onShowListing, onShowPrivacy, onShowTerms }) {
  const { user } = useAuth()
  const [selEvent, setSelEvent] = useState('Wedding')
  const [city, setCity] = useState('')
  const [cat, setCat] = useState('')
  const [noMatch, setNoMatch] = useState(false)
  const [activeCat, setActiveCat] = useState('Photography')
  const [trendingVendors, setTrendingVendors] = useState([])
  const [stats, setStats] = useState({ vendors: 0, cities: 0, categories: 10, planners: 0 })
  const [citySuggestions, setCitySuggestions] = useState([])
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const [contactStatus, setContactStatus] = useState(null)

  const IS_PROD = import.meta.env.VITE_ENV === 'prod'

  useEffect(() => {
    fetchTrending('Photography')
    fetchCities()
    if (IS_PROD) fetchStats()
  }, [])

  async function fetchCities() {
    if (!supabase) return
    const { data } = await supabase
      .from('vendors')
      .select('city')
    if (data) {
      const unique = [...new Set(data.map(v => v.city).filter(Boolean))]
        .sort()
      setCitySuggestions(unique)
    }
  }

  async function fetchStats() {
    if (!supabase) return
    const [vendorsRes, plannersRes] = await Promise.all([
      supabase.from('vendors').select('city', { count: 'exact' }),
      supabase.from('planner_profiles').select('id', { count: 'exact' }),
    ])
    const vendorCount = vendorsRes.count || 0
    const cities = vendorsRes.data
      ? new Set(vendorsRes.data.map(v => v.city?.toLowerCase()).filter(Boolean)).size
      : 0
    setStats({ vendors: vendorCount, cities, categories: 10, planners: plannersRes.count || 0 })
  }

  async function fetchTrending(category) {
    if (!supabase) { setTrendingVendors([]); return }
    const { data } = await supabase
      .from('vendors')
      .select('id, name, city, state, icon, bg, rating, review_count, category')
      .eq('category', category)
      .order('rating', { ascending: false })
      .limit(5)
    setTrendingVendors(data?.map(v => ({
      id: v.id,
      name: v.name,
      loc: `${v.city}, ${v.state}`,
      icon: v.icon,
      bg: v.bg || 'linear-gradient(135deg,#FDEAED,#F5C4CB)',
      rating: v.rating?.toFixed(1),
      reviews: v.review_count,
    })) || [])
  }

  function selectCat(label) {
    setActiveCat(label)
    fetchTrending(label)
  }

  function checkCity(v) {
    setCity(v)
    setNoMatch(v.length > 2 && citySuggestions.length > 0 && !citySuggestions.some(c => c.toLowerCase().includes(v.toLowerCase())))
  }

  async function submitContact(e) {
    e.preventDefault()
    if (!contactForm.name || !contactForm.email || !contactForm.message) return
    setContactStatus('sending')
    try {
      if (supabase) {
        const { error } = await supabase
          .from('contact_messages')
          .insert({ name: contactForm.name, email: contactForm.email, message: contactForm.message })
        if (error) throw error
      }
      setContactStatus('sent')
      setContactForm({ name: '', email: '', message: '' })
    } catch {
      setContactStatus('error')
    }
  }

  function doSearch() {
    if (!user) { onShowAuth('planner'); return }
    onSearch(cat || 'All', city)
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

      {/* ── TRENDING ── */}
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
            <span className="tv-view-all" onClick={() => onShowListing(activeCat, '')}>View All →</span>
          </div>
          <div className="tv-track-wrap">
            <button className="tv-arr" onClick={() => document.getElementById('tv-track').scrollBy(-220, 0)}>‹</button>
            <div className="tv-track" id="tv-track">
              {trendingVendors.map((v, i) => (
                <div key={i} className="tv-card" onClick={() => user ? onShowDetail(v.id) : onShowAuth('planner')}>
                  <div className="tv-card-img" style={{ background: v.bg }}>
                    <div className="tv-card-rank">#{i + 1}</div>
                    {v.icon}
                  </div>
                  <div className="tv-card-body">
                    <div className="tv-card-name">{v.name}</div>
                    <div className="tv-card-loc">📍 {v.loc}</div>
                    <div className="tv-card-rat">★★★★★ {v.rating} · {v.reviews} reviews</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="tv-arr" onClick={() => document.getElementById('tv-track').scrollBy(220, 0)}>›</button>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="how-section" id="how-it-works">
        <div className="how-inner">
          <h2 className="how-title">How Pallaki Works</h2>
          <div className="how-timeline">
            {[
              { n: '1', title: 'Browse Vendors', desc: 'Search by category and city to find trusted South Asian event vendors near you.' },
              { n: '2', title: 'Create Your Profile', desc: 'Sign up and share your event details so vendors understand exactly what you need.' },
              { n: '3', title: 'Send an Inquiry', desc: 'Message vendors directly and discuss your event on your own terms.' },
              { n: '4', title: 'Celebrate', desc: 'Book your perfect team and let Pallaki help you create memories that last forever.' },
            ].map(step => (
              <div key={step.n} className="how-item">
                <div className="how-dot">{step.n}</div>
                <div className="how-content">
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
          <VendorShowcase />
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section className="ct-section" id="contact">
        <div className="ct-inner">
          <h2 className="how-title">Get in Touch</h2>
          <p className="ct-intro">We'd love to hear from you.</p>
          <p className="ct-intro ct-sub">Have questions, feedback, or want to partner with us? Drop us a note and we'll get back to you within 24 hours.</p>
          {contactStatus === 'sent' ? (
            <div className="contact-success">
              <span className="contact-success-icon">🌸</span>
              <h3>Thank you for reaching out!</h3>
              <p>We've received your message and will get back to you as soon as we can.</p>
              <button className="btn-sub" style={{ marginTop: '1.2rem' }} onClick={() => setContactStatus(null)}>Send Another Message</button>
            </div>
          ) : (
            <form onSubmit={submitContact}>
              <div className="fg">
                <div className="ff">
                  <label>Name</label>
                  <input type="text" placeholder="Your name" value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="ff">
                  <label>Email</label>
                  <input type="email" placeholder="you@email.com" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} required />
                </div>
                <div className="ff full">
                  <label>Message</label>
                  <textarea placeholder="Tell us how we can help…" value={contactForm.message} onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))} required />
                </div>
              </div>
              {contactStatus === 'error' && (
                <p style={{ color: '#c0392b', fontSize: '.84rem', marginTop: '.75rem' }}>Something went wrong. Please try again.</p>
              )}
              <button className="btn-sub" type="submit" disabled={contactStatus === 'sending'}>
                {contactStatus === 'sending' ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </section>

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
              <a key={c} onClick={() => onShowListing(c, '')}>{c}</a>
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
            <a style={{cursor:'pointer'}} onClick={() => document.getElementById('our-story')?.scrollIntoView({behavior:'smooth'})}>About Us</a>
            <a style={{cursor:'pointer'}} onClick={() => onShowAuth('vendor', true)}>For Vendors</a>
            <a style={{cursor:'pointer'}} onClick={() => document.getElementById('how-it-works')?.scrollIntoView({behavior:'smooth'})}>How It Works</a>
            <a style={{cursor:'pointer'}} onClick={() => document.getElementById('contact')?.scrollIntoView({behavior:'smooth'})}>Contact</a>
          </div>
        </div>
        <div className="fb">
          <span>© 2025 Pallaki. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '1.2rem' }}>
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={onShowPrivacy}>Privacy Policy</span>
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={onShowTerms}>Terms & Conditions</span>
          </div>
          <span>Made with 🌸 for South Asian families in America</span>
        </div>
      </footer>
    </div>
  )
}
