import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { showToast } from '../lib/toast'
import ImageUpload from '../components/ImageUpload'

const STEPS = ['Business Basics', 'Your Story', 'Photos']

const CATEGORIES = ['Photography', 'Videography', 'Mehndi Artist', 'Bridal Makeup', 'Catering', 'Mandap & Decor', 'Music & DJ', 'Priests & Pandits', 'Bridal Lehenga', 'Bridal Jewellery', 'Wedding Venue']
const STATES = ['California', 'Georgia', 'Illinois', 'Maryland', 'New Jersey', 'New York', 'Texas', 'Virginia', 'Washington', 'Florida', 'Pennsylvania', 'Michigan', 'Ohio']
const SERVICES = ['Weddings', 'Engagements', 'Mehndi Night', 'Sangeet', 'Pre-Wedding', 'Birthdays', 'Baby Showers', 'House Warming']

export default function VendorOnboarding() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  // Pre-populate business name from signup
  useEffect(() => {
    if (!user || !supabase) return
    supabase.from('vendors').select('name').eq('profile_id', user.id).maybeSingle()
      .then(({ data }) => { if (data?.name) setBizName(data.name) })
  }, [user])

  // Step 1
  const [bizName, setBizName] = useState('')
  const [category, setCategory] = useState('Photography')
  const [city, setCity] = useState('')
  const [state, setState] = useState('New Jersey')
  const [phone, setPhone] = useState('')

  // Step 2
  const [description, setDescription] = useState('')
  const [services, setServices] = useState(['Weddings'])
  const [website, setWebsite] = useState('')
  const [instagram, setInstagram] = useState('')

  // Step 3
  const [portfolioUrls, setPortfolioUrls] = useState([])

  function toggleService(s) {
    setServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  function validateStep() {
    if (step === 0) {
      if (!bizName.trim()) { showToast('Please enter your business name.'); return false }
      if (!city.trim()) { showToast('Please enter your city.'); return false }
      return true
    }
    if (step === 1) {
      if (!description.trim()) { showToast('Please add a short description.'); return false }
      if (services.length === 0) { showToast('Please select at least one service.'); return false }
      return true
    }
    return true
  }

  function nextStep() {
    if (!validateStep()) return
    setStep(s => s + 1)
  }

  async function handleSubmit() {
    if (!user || !supabase) { navigate('/vendor/login'); return }
    setSaving(true)

    const { error } = await supabase.from('vendors').upsert({
      profile_id: user.id,
      name: bizName,
      category,
      city,
      state,
      description,
      services,
      portfolio_urls: portfolioUrls,
      is_verified: false,
      badge: '',
      icon: '📸',
      bg: '#FDEAED,#F5C4CB',
      events_covered: '0+',
    }, { onConflict: 'profile_id' })

    setSaving(false)
    if (error) { showToast('Error saving profile: ' + error.message); return }
    setDone(true)
  }

  if (done) return (
    <div style={{ minHeight: '100vh', background: 'var(--cr)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🌸</div>
        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '2rem', color: 'var(--vx)', marginBottom: '.75rem', fontWeight: 400 }}>
          You're on your way!
        </h2>
        <p style={{ fontSize: '.95rem', color: 'var(--tm)', lineHeight: 1.8, marginBottom: '.5rem', fontWeight: 300 }}>
          Your listing has been submitted for review. We'll verify your profile within 24–48 hours and notify you by email once you're live on Pallaki.
        </p>
        <p style={{ fontSize: '.88rem', color: 'var(--tl)', marginBottom: '2rem', fontWeight: 300 }}>
          In the meantime, you can update your profile and add more photos from your dashboard.
        </p>
        <button className="btn-p" onClick={() => navigate('/dashboard')}>Go to My Dashboard →</button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cr)', paddingTop: 64 }}>
      {/* Progress header */}
      <div style={{ background: 'linear-gradient(135deg,var(--vx),#3D1D2A)', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.1rem', color: '#fff', fontWeight: 400 }}>
              Set Up Your Listing
            </div>
            <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.5)' }}>Step {step + 1} of {STEPS.length}</div>
          </div>
          {/* Step dots */}
          <div style={{ display: 'flex', gap: '.5rem' }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ flex: 1 }}>
                <div style={{ height: 3, borderRadius: 2, background: i <= step ? 'var(--gl)' : 'rgba(255,255,255,.2)', transition: 'background .3s' }} />
                <div style={{ fontSize: '.62rem', color: i <= step ? 'var(--gl)' : 'rgba(255,255,255,.35)', marginTop: '.3rem', letterSpacing: '.06em', textTransform: 'uppercase' }}>{s}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        {/* ── STEP 1: Business Basics ── */}
        {step === 0 && (
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.6rem', color: 'var(--vx)', marginBottom: '.4rem', fontWeight: 400 }}>Tell us about your business</h2>
            <p style={{ fontSize: '.88rem', color: 'var(--tl)', marginBottom: '2rem', fontWeight: 300 }}>This is what families will see first when they find you on Pallaki.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div className="df"><label>Business Name *</label><input value={bizName} onChange={e => setBizName(e.target.value)} placeholder="e.g. Riya Kapoor Photography" /></div>
              <div className="df"><label>Category *</label>
                <select value={category} onChange={e => setCategory(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="df"><label>City *</label><input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Edison" /></div>
                <div className="df"><label>State *</label>
                  <select value={state} onChange={e => setState(e.target.value)}>
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="df"><label>Phone Number</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" /></div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Your Story ── */}
        {step === 1 && (
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.6rem', color: 'var(--vx)', marginBottom: '.4rem', fontWeight: 400 }}>Tell your story</h2>
            <p style={{ fontSize: '.88rem', color: 'var(--tl)', marginBottom: '2rem', fontWeight: 300 }}>Help families understand what makes you special.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div className="df">
                <label>About Your Business *</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value.slice(0, 500))}
                  placeholder="Describe your services, experience, and what makes you unique for South Asian events…"
                  style={{ resize: 'vertical', minHeight: 120 }}
                />
                <div style={{ fontSize: '.68rem', color: 'var(--tl)', textAlign: 'right' }}>{description.length}/500</div>
              </div>
              <div className="df">
                <label>Services Offered *</label>
                <div className="multi-sel" style={{ paddingTop: '.4rem' }}>
                  {SERVICES.map(s => (
                    <div key={s} className={`ms-chip${services.includes(s) ? ' sel' : ''}`} onClick={() => toggleService(s)}>{s}</div>
                  ))}
                </div>
              </div>
              <div className="df"><label>Website</label><input type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yourwebsite.com" /></div>
              <div className="df"><label>Instagram</label><input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@yourbusiness" /></div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Photos ── */}
        {step === 2 && (
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.6rem', color: 'var(--vx)', marginBottom: '.4rem', fontWeight: 400 }}>Show your work</h2>
            <p style={{ fontSize: '.88rem', color: 'var(--tl)', marginBottom: '2rem', fontWeight: 300 }}>Upload your best photos. Listings with photos get 3x more inquiries.</p>
            <div style={{ background: 'var(--wh)', border: '1px solid var(--br)', borderRadius: 14, padding: '1.5rem' }}>
              <ImageUpload
                folder="portfolio"
                maxFiles={8}
                existingUrls={portfolioUrls}
                onUploadComplete={urls => setPortfolioUrls(urls)}
              />
            </div>
            <p style={{ fontSize: '.78rem', color: 'var(--tl)', marginTop: '1rem', lineHeight: 1.6 }}>
              You can add more photos later from your dashboard. We recommend at least 3 photos to get started.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2.5rem' }}>
          {step > 0 ? (
            <button className="btn-o" onClick={() => setStep(s => s - 1)}>← Back</button>
          ) : <div />}
          {step < STEPS.length - 1 ? (
            <button className="btn-p" onClick={nextStep}>Continue →</button>
          ) : (
            <button className="btn-p" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Submitting…' : 'Submit for Review →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
