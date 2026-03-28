import { useState } from 'react'
import { CAT_VENDORS } from '../data/vendors'
import { useAuth } from '../lib/AuthContext'

const CITIES = ['new york', 'new jersey', 'chicago', 'houston', 'los angeles', 'atlanta', 'dallas', 'san jose', 'fremont', 'edison']

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

export default function Home({ onSearch, onShowAuth, onShowDetail, onShowListing }) {
  const { user } = useAuth()
  const [selEvent, setSelEvent] = useState('Wedding')
  const [city, setCity] = useState('')
  const [cat, setCat] = useState('')
  const [noMatch, setNoMatch] = useState(false)
  const [activeCat, setActiveCat] = useState('Photography')

  function checkCity(v) {
    setCity(v)
    setNoMatch(v.length > 2 && !CITIES.some(c => c.includes(v.toLowerCase())))
  }

  function doSearch() {
    if (!user) { onShowAuth('planner'); return }
    onSearch(cat || 'All', city)
  }

  function selectCat(label) {
    setActiveCat(label)
  }

  const trendingVendors = CAT_VENDORS[activeCat] || []

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
            <h1>India's Traditions, <em>American Stage.</em></h1>
            <p className="hero-sub">Discover trusted South Asian event vendors, wherever you celebrate.</p>
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
              {['New York', 'New Jersey', 'Chicago', 'Houston', 'Los Angeles', 'Atlanta', 'Dallas'].map(c => (
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
      <section className="how-section">
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
      <section className="about-section">
        <h2 className="how-title" style={{ marginBottom: '2.5rem' }}>Our Story</h2>
        <div className="about-inner">
          <div className="about-text">
            <div className="aq">
              <p>"Finding South Asian vendors who truly understand our traditions shouldn't be so hard. Pallaki exists to change that."</p>
              <cite>— The Pallaki Team</cite>
            </div>
            <p>We are South Asians who've lived the struggle — spending months searching for the right mehndi artist, the right photographer who knows how to capture the pheras, the right caterer who knows what biryani should taste like at a Telugu/Hyderabadi wedding.</p>
            <p>Pallaki is not just a directory. It's a curated community of vendors who love what they do and understand the beauty of South Asian celebrations.</p>
            <div className="stats-mini" style={{ marginTop: '2rem' }}>
              {[['100+', 'Verified Vendors'], ['9', 'Cities Covered'], ['10', 'Categories'], ['200+', 'Happy Families']].map(([n, l]) => (
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
            <div className="fv-cta-row">
              <button className="btn-p" onClick={() => onShowAuth('vendor')}>List Your Business — It's Free</button>
              <button className="btn-s" onClick={() => onShowAuth('vendor')}>See How It Works</button>
            </div>
            <div className="fv-trust">
              <div className="fv-trust-av">
                {['R', 'A', 'S', 'M'].map(l => <span key={l}>{l}</span>)}
              </div>
              <p className="fv-trust-txt"><strong>100+ vendors</strong> already growing on Pallaki</p>
            </div>
          </div>
          <div className="fv-right">
            <div className="fv-right-pattern" />
            <div className="fvd-dh">
              <div className="fvd-dh-row">
                <div className="fvd-dh-av">📸</div>
                <div className="fvd-dh-info">
                  <div className="fvd-dh-name">Riya Kapoor Photography</div>
                  <div className="fvd-dh-tags">
                    <span className="fvd-dh-tag">Wedding Photography</span>
                    <span className="fvd-dh-tag">New York, NY</span>
                    <span className="fvd-dh-tag fvd-dh-tag-gold">✓ Verified</span>
                  </div>
                  <div className="fvd-dh-rating">★★★★★ 4.9 · <span className="fvd-dh-rev">87 reviews</span></div>
                </div>
                <div className="fvd-live"><div className="fvd-live-dot" />Live</div>
              </div>
            </div>
            <div className="fvd-tabs">
              <span className="fvd-tab-item">Overview</span>
              <span className="fvd-tab-item act">Analytics</span>
              <span className="fvd-tab-item">Inquiries</span>
              <span className="fvd-tab-item">Reviews</span>
            </div>
            <div className="fvd-body">
              <div className="fvd-kpi-row">
                {[['1,284','Profile Views','↑ 23%'],['64','Inquiries','↑ 18%'],['11.2%','Inquiry Rate','↑ 4.1%'],['12','Bookings','↑ 4 new']].map(([n,l,d]) => (
                  <div key={l} className="fvd-kpi">
                    <span className="fvd-kpi-n">{n}</span>
                    <span className="fvd-kpi-l">{l}</span>
                    <span className="fvd-kpi-d up">{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section className="ct-section">
        <div className="ct-inner">
          <h2 className="how-title">Get in Touch</h2>
          <p className="ct-intro">We'd love to hear from you.</p>
          <p className="ct-intro ct-sub">Have questions, feedback, or want to partner with us? Drop us a note and we'll get back to you within 24 hours.</p>
          <div className="fg">
            <div className="ff"><label>Name</label><input type="text" placeholder="Your name" /></div>
            <div className="ff"><label>Email</label><input type="email" placeholder="you@email.com" /></div>
            <div className="ff full"><label>Message</label><textarea placeholder="Tell us how we can help…" /></div>
          </div>
          <button className="btn-sub">Send Message</button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <div className="fi">
          <div>
            <div className="flogo">पल्लकी</div>
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
            <a>About Us</a>
            <a onClick={() => onShowAuth('vendor')}>For Vendors</a>
            <a>How It Works</a>
            <a>Contact</a>
          </div>
        </div>
        <div className="fb">
          <span>© 2025 Pallaki. All rights reserved.</span>
          <span>Made with 🌸 for South Asian families in America</span>
        </div>
      </footer>
    </div>
  )
}
