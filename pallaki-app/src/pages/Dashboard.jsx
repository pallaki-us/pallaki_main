import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { showToast } from '../lib/toast'
import ImageUpload from '../components/ImageUpload'
import { useVendorProfile } from '../lib/useVendorProfile'
import { useVendorInquiries } from '../lib/useInquiries'
import { useVendorAnalytics } from '../lib/useVendorAnalytics'
import { supabase } from '../lib/supabase'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const SERVICES = ['Weddings','Engagements','Mehndi Night','Sangeet','Pre-Wedding','Birthdays']

export default function Dashboard({ activePage, onShowVendorListing }) {
  const { user, signOut } = useAuth()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }
  const navigate = useNavigate()
  const { profile, saving, saveProfile, fetchProfile } = useVendorProfile()
  const { inquiries, updateStatus, saveReply, archiveInquiry } = useVendorInquiries(profile?.id)
  const [period, setPeriod] = useState(365)
  const { data: anData } = useVendorAnalytics(profile?.id, period)
  const [selServices, setSelServices] = useState(['Weddings','Engagements'])
  const [avatarUrl, setAvatarUrl] = useState('')
  const avatarInputRef = useRef()

  // Form state
  const [bizName, setBizName] = useState('')
  const [category, setCategory] = useState('Photography')
  const [city, setCity] = useState('')
  const [state, setState] = useState('New York')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [description, setDescription] = useState('')

  const [languages, setLanguages] = useState([])
  const [serviceAreas, setServiceAreas] = useState([])
  const [newArea, setNewArea] = useState('')

  const LANGUAGES = ['English','Hindi','Punjabi','Telugu','Tamil','Kannada','Malayalam','Gujarati','Marathi','Bengali','Urdu']

  function toggleLanguage(lang) {
    setLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang])
  }

  // Populate form when profile loads
  useEffect(() => {
    if (!profile) return
    setBizName(profile.name || '')
    setCategory(profile.category || 'Photography')
    setCity(profile.city || '')
    setState(profile.state || 'New York')
    setPhone(profile.phone || '')
    setWebsite(profile.website || '')
    setDescription(profile.description || '')
    setSelServices(profile.services || ['Weddings','Engagements'])
    setAvatarUrl(profile.avatar_url || '')
    setLanguages(profile.languages || [])
    setServiceAreas(profile.service_areas || [])
  }, [profile])

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
      showToast('Only JPG, PNG or WebP allowed.'); return
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Max 2MB for profile photo.'); return
    }
    const { supabase } = await import('../lib/supabase')
    if (!supabase) return
    const BUCKET = import.meta.env.VITE_STORAGE_BUCKET || 'pallaki-media-staging'
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false })
    if (error) { showToast('Upload failed: ' + error.message); return }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    const url = data.publicUrl + '?t=' + Date.now()
    setAvatarUrl(url)
    const { error: saveError } = await supabase
      .from('vendors')
      .update({ avatar_url: url })
      .eq('profile_id', user.id)
    if (saveError) showToast('Photo uploaded but failed to save: ' + saveError.message)
    else showToast('Profile photo updated ✨')
  }

  async function handleSave() {
    const { error } = await saveProfile({
      name: bizName,
      category,
      city,
      state,
      phone,
      website,
      description,
      services: selServices,

      languages,
      service_areas: serviceAreas,
    })
    if (error) showToast('Error saving: ' + error.message)
    else showToast('Profile saved! ✨')
  }
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  // Draw chart when analytics tab is active or real data arrives
  useEffect(() => {
    if (activePage !== 'analytics') return
    if (!chartRef.current) return

    const monthlyViews = anData?.monthlyViews || Array(12).fill(0)
    const monthlyInquiries = anData?.monthlyInquiries || Array(12).fill(0)

    const draw = () => {
      if (!window.Chart) return
      if (chartInstance.current) chartInstance.current.destroy()
      chartInstance.current = new window.Chart(chartRef.current, {
        type: 'line',
        data: {
          labels: MONTHS,
          datasets: [
            { label: 'Inquiries', data: monthlyInquiries, borderColor: '#C4848C', backgroundColor: 'rgba(196,132,140,0.08)', tension: .4, pointBackgroundColor: '#C4848C', pointRadius: 3 },
            { label: 'Profile Views', data: monthlyViews, borderColor: '#C49A3C', backgroundColor: 'rgba(196,154,60,0.08)', tension: .4, pointBackgroundColor: '#C49A3C', pointRadius: 3 },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { font: { family: 'Cormorant Garamond', size: 11 }, boxWidth: 12 } } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { family: 'Cormorant Garamond', size: 10 } } }, x: { grid: { display: false }, ticks: { font: { family: 'Cormorant Garamond', size: 10 } } } } },
      })
    }

    if (window.Chart) { draw() }
    else {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js'
      s.onload = draw
      document.head.appendChild(s)
    }

    return () => { if (chartInstance.current) chartInstance.current.destroy() }
  }, [activePage, period, anData])

  function toggleService(s) {
    setSelServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  const name = user?.user_metadata?.name || 'Vendor'

  // Onboarding not complete — redirect
  if (profile && !profile.category) {
    navigate('/onboarding', { replace: true })
    return null
  }

  // Pending approval state
  if (profile && !profile.is_verified) return (
    <div style={{ paddingTop: 64, minHeight: '100vh', background: 'var(--cr)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>⏳</div>
        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.8rem', color: 'var(--vx)', marginBottom: '.75rem', fontWeight: 400 }}>
          Your profile is under review
        </h2>
        <p style={{ fontSize: '.95rem', color: 'var(--tm)', lineHeight: 1.8, marginBottom: '.5rem', fontWeight: 300 }}>
          We're verifying your listing for <strong>{profile.name}</strong>. This usually takes 24–48 hours.
        </p>
        <p style={{ fontSize: '.85rem', color: 'var(--tl)', lineHeight: 1.7, marginBottom: '2rem', fontWeight: 300 }}>
          You'll receive an email once your profile is live on Pallaki.
        </p>
        <button className="btn-o" onClick={handleSignOut}>Sign Out</button>
      </div>
    </div>
  )

  return (
    <div style={{ paddingTop: 64, minHeight: '100vh', background: 'var(--cd)' }}>

      {/* ── DASHBOARD PAGE ── */}
      {activePage === 'dashboard' && (
        <>
          <div className="dash-header">
            <div><div className="dash-title">My Vendor Profile</div></div>
            <div className="dash-actions">
              <button className="dash-btn dash-btn-out" onClick={() => navigate('/')}>🌐 Browse Website</button>
              <button className="dash-btn dash-btn-out" onClick={() => navigate('/analytics')}>View Analytics</button>
              <button className="dash-btn dash-btn-gold" onClick={() => profile?.id ? onShowVendorListing() : showToast('Save your profile first!')}>Preview Listing</button>
            </div>
          </div>

          <div className="dash-body">
            {/* Business Info */}
            <div className="dash-card">
              <div className="dash-card-head">
                <h3>Business Information</h3>
                <button className="dash-btn dash-btn-out" style={{ color: 'var(--v)', borderColor: 'var(--br)' }} onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
              <div className="dash-card-body">
                <div className="profile-img-row">
                  <div className="profile-img-circle" onClick={() => avatarInputRef.current.click()} title="Click to upload photo" style={{ cursor: 'pointer' }}>
                    {avatarUrl
                      ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      : <span style={{ fontSize: '2.5rem' }}>📸</span>
                    }
                  </div>
                  <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleAvatarUpload} />
                  <div>
                    <p style={{ fontSize: '.86rem', color: 'var(--tm)' }}>Your business profile photo — visible to families browsing Pallaki.</p>
                    <p style={{ fontSize: '.76rem', color: 'var(--tl)', marginTop: 4 }}>Click the photo to upload. JPG, PNG or WebP · Max 2MB.</p>
                  </div>
                </div>
                <div className="details-form" style={{ marginTop: '1.5rem' }}>
                  <div className="df"><label>Business Name</label><input type="text" value={bizName} onChange={e => setBizName(e.target.value)} placeholder="e.g. Riya Kapoor Photography" /></div>
                  <div className="df"><label>Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value)}>
                      {['Photography','Videography','Mehndi Artist','Bridal Makeup','Catering','Mandap & Decor','Music & DJ','Priests & Pandits'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="df"><label>City</label><input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="New York" /></div>
                  <div className="df"><label>State</label>
                    <select value={state} onChange={e => setState(e.target.value)}>
                      {['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="df"><label>Phone</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" /></div>
                  <div className="df"><label>Website / Instagram</label><input type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="instagram.com/yourbusiness" /></div>
                  <div className="df full"><label>Business Description</label><textarea style={{ resize: 'vertical', minHeight: 100 }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell families what makes your services special…" /></div>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--tl)', fontWeight: 500, marginBottom: '.6rem' }}>Services Offered</p>
                  <div className="multi-sel">
                    {SERVICES.map(s => (
                      <div key={s} className={`ms-chip${selServices.includes(s) ? ' sel' : ''}`} onClick={() => toggleService(s)}>{s}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Languages & Service Areas */}
            <div className="dash-card">
              <div className="dash-card-head">
                <h3>🌐 Languages & Service Areas</h3>
                <button className="dash-btn dash-btn-out" style={{ color: 'var(--v)', borderColor: 'var(--br)' }} onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
              <div className="dash-card-body">
                <div style={{ marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--tl)', fontWeight: 500, marginBottom: '.6rem' }}>Languages Spoken</p>
                  <div className="multi-sel">
                    {LANGUAGES.map(l => (
                      <div key={l} className={`ms-chip${languages.includes(l) ? ' sel' : ''}`} onClick={() => toggleLanguage(l)}>{l}</div>
                    ))}
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--tl)', fontWeight: 500, marginBottom: '.6rem' }}>Service Areas</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', marginBottom: '.75rem' }}>
                    {serviceAreas.map((area, i) => (
                      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', padding: '.28rem .75rem', background: 'var(--vf)', border: '1px solid var(--br)', borderRadius: 100, fontSize: '.78rem', color: 'var(--tm)' }}>
                        📍 {area}
                        <span onClick={() => setServiceAreas(p => p.filter((_, j) => j !== i))} style={{ cursor: 'pointer', color: 'var(--tl)', fontSize: '.8rem', lineHeight: 1 }}>×</span>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    <input
                      value={newArea}
                      onChange={e => setNewArea(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && newArea.trim()) { setServiceAreas(p => [...p, newArea.trim()]); setNewArea('') } }}
                      placeholder="e.g. Edison, NJ"
                      style={{ flex: 1, padding: '.65rem .9rem', border: '1.5px solid var(--br)', borderRadius: 10, fontFamily: "'Cormorant Garamond',serif", fontSize: '.88rem', outline: 'none', background: 'var(--cr)' }}
                    />
                    <button className="dash-btn dash-btn-out" style={{ flexShrink: 0 }}
                      onClick={() => { if (newArea.trim()) { setServiceAreas(p => [...p, newArea.trim()]); setNewArea('') } }}>
                      + Add
                    </button>
                  </div>
                  <p style={{ fontSize: '.68rem', color: 'var(--tl)', marginTop: '.4rem' }}>Press Enter or click Add. Remember to Save Changes.</p>
                </div>
              </div>
            </div>

            {/* Photo Gallery */}
            <div className="dash-card">
              <div className="dash-card-head"><h3>Photo Gallery</h3></div>
              <div className="dash-card-body">
                <div className="upload-matrix">
                  <div className="upload-row">
                    <div className="upload-row-head">
                      <h4>🌸 Portfolio Photos</h4>
                    </div>
                    <div style={{ padding: '.85rem 1rem' }}>
                      <ImageUpload
                        folder="portfolio"
                        maxFiles={12}
                        existingUrls={profile?.portfolio_urls || []}
                        onUploadComplete={async urls => {
                          const { error } = await supabase.rpc('update_vendor_photos', { p_field: 'portfolio_urls', p_urls: urls })
                          if (error) showToast('Error saving photos: ' + error.message)
                          else { showToast(`Portfolio updated — ${urls.length} photos`); await fetchProfile() }
                        }}
                      />
                    </div>
                  </div>
                  <div className="upload-row">
                    <div className="upload-row-head">
                      <h4>🎬 Featured Work</h4>
                    </div>
                    <div style={{ padding: '.85rem 1rem' }}>
                      <ImageUpload
                        folder="featured"
                        maxFiles={4}
                        existingUrls={profile?.featured_urls || []}
                        onUploadComplete={async urls => {
                          const { error } = await supabase.rpc('update_vendor_photos', { p_field: 'featured_urls', p_urls: urls })
                          if (error) showToast('Error saving photos: ' + error.message)
                          else { showToast(`Featured work updated — ${urls.length} photos`); await fetchProfile() }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </>
      )}

      {/* ── ANALYTICS PAGE ── */}
      {activePage === 'analytics' && (
        <>
          <div className="an-header">
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' }}>
              <button className="dash-btn dash-btn-out" onClick={() => navigate('/dashboard')} style={{ color: 'rgba(255,255,255,.8)', fontSize: '.75rem' }}>← Back to Profile</button>
              <div style={{ display: 'flex', gap: '.4rem', background: 'rgba(0,0,0,.2)', borderRadius: 20, padding: '.25rem' }}>
                {[30, 180, 365].map(p => (
                  <button key={p} className={`an-period-tab${period === p ? ' an-period-tab-act' : ''}`} onClick={() => setPeriod(p)}>
                    {p === 30 ? 'Last 30 Days' : p === 180 ? 'Last 6 Months' : 'Last 12 Months'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem', marginTop: '.75rem' }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(220,186,90,.2)', border: '1.5px solid rgba(220,186,90,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🌸</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
                  <div className="an-title">Hi, {name} 👋</div>
                  <span className="an-badge">PREMIUM</span>
                </div>
                <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.55)', marginTop: '.2rem' }}>Vendor Dashboard · Analytics</div>
              </div>
            </div>
          </div>

          <div className="an-body">
            {/* KPIs */}
            <div className="stat-row" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
              {[
                { id: 'views', n: (anData?.views ?? '—').toLocaleString?.() ?? '—', l: 'Profile Views' },
                { id: 'inq',   n: anData?.inquiries ?? '—',                          l: 'Inquiries' },
              ].map(k => (
                <div key={k.id} className="stat-c">
                  <div className="sn">{k.n}</div>
                  <div className="sl">{k.l}</div>
                </div>
              ))}
            </div>

            {/* Line chart */}
            <div className="an-card">
              <div className="an-card-head">
                <h3>📈 Profile Views & Inquiries</h3>
                <span style={{ fontSize: '.7rem', color: 'var(--tl)' }}>Updated daily</span>
              </div>
              <div className="an-card-body">
                <div className="chart-wrap">
                  <canvas ref={chartRef} />
                </div>
              </div>
            </div>

            {/* Conversion funnel */}
            <div className="an-card">
              <div className="an-card-head"><h3>🔄 Conversion Funnel</h3></div>
              <div className="an-card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                  {(() => {
                    const views = anData?.views ?? 0
                    const inqs = anData?.inquiries ?? 0
                    const inqPct = views > 0 ? Math.min(100, Math.round((inqs / views) * 100)) : 0
                    return [
                      { label: 'Profile Views', n: views.toLocaleString(), pct: '100%', color: 'var(--v)' },
                      { label: 'Inquiries Sent', n: inqs, pct: `${inqPct}%`, color: 'var(--v)' },
                    ].map(row => (
                      <div key={row.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', color: 'var(--tm)', marginBottom: '.4rem' }}>
                          <span>{row.label}</span>
                          <span style={{ fontWeight: 600, color: 'var(--vx)' }}>{row.n}</span>
                        </div>
                        <div style={{ height: 10, background: 'rgba(196,132,140,.1)', borderRadius: 6, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: row.pct, background: `linear-gradient(90deg,${row.color},var(--vl))`, borderRadius: 6 }} />
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              </div>
            </div>

            {/* Inquiries — grouped by planner */}
            <div className="an-card">
              <div className="an-card-head">
                <h3>💌 Inquiries</h3>
                {inquiries.filter(i => i.status === 'pending').length > 0 && (
                  <span style={{ fontSize: '.7rem', color: 'var(--v)', fontWeight: 500 }}>
                    {inquiries.filter(i => i.status === 'pending').length} new
                  </span>
                )}
              </div>
              <div className="an-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                {inquiries.length === 0 ? (
                  <p style={{ fontSize: '.88rem', color: 'var(--tl)', textAlign: 'center', padding: '2rem', fontStyle: 'italic' }}>
                    No inquiries yet — your listing is live and families can find you!
                  </p>
                ) : (() => {
                  // Group by planner_id, preserve order of first inquiry
                  const groups = {}
                  const order = []
                  inquiries.forEach(inq => {
                    const pid = inq.planner_id
                    if (!groups[pid]) { groups[pid] = { profile: inq.profiles, items: [] }; order.push(pid) }
                    groups[pid].items.push(inq)
                  })
                  return order.map(pid => {
                    const { profile, items } = groups[pid]
                    const hasNew = items.some(i => i.status === 'pending')
                    return (
                      <div key={pid} style={{ padding: '1rem', background: hasNew ? 'var(--vf)' : 'var(--wh)', border: `1px solid ${hasNew ? 'rgba(196,132,140,.3)' : 'var(--br)'}`, borderRadius: 12 }}>
                        {/* Planner header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.75rem', marginBottom: '.75rem' }}>
                          <div style={{ fontSize: '.9rem', fontWeight: 600, color: 'var(--vx)' }}>
                            {items[0]?.intake_data?.contactName || profile?.name || profile?.email || items[0]?.intake_data?.contactEmail || 'Planner'}
                          </div>
                          {hasNew && <span style={{ fontSize: '.68rem', color: 'var(--v)', fontWeight: 600, flexShrink: 0 }}>New</span>}
                        </div>

                        {/* All submissions from this planner */}
                        {items.map((inq, idx) => (
                          <div key={inq.id} style={{ paddingTop: '.75rem', marginTop: '.75rem', borderTop: idx === 0 ? '1px solid var(--br)' : '1px dashed var(--br)' }}>
                            <div style={{ fontSize: '.68rem', color: 'var(--tl)', marginBottom: '.4rem' }}>
                              {new Date(inq.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>

                            {inq.intake_data ? (
                              <div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem', marginBottom: '.4rem' }}>
                                  {inq.intake_data.eventType && <span style={{ fontSize: '.72rem', padding: '.2rem .65rem', background: 'var(--vf)', border: '1px solid var(--br)', borderRadius: 100, color: 'var(--tm)' }}>{inq.intake_data.eventType}</span>}
                                  {inq.intake_data.eventDate && <span style={{ fontSize: '.72rem', padding: '.2rem .65rem', background: 'var(--vf)', border: '1px solid var(--br)', borderRadius: 100, color: 'var(--tm)' }}>🗓 {inq.intake_data.eventDate}</span>}
                                  {inq.intake_data.guestCount && <span style={{ fontSize: '.72rem', padding: '.2rem .65rem', background: 'var(--vf)', border: '1px solid var(--br)', borderRadius: 100, color: 'var(--tm)' }}>👥 {inq.intake_data.guestCount}</span>}
                                  {inq.intake_data.budget && <span style={{ fontSize: '.72rem', padding: '.2rem .65rem', background: 'var(--vf)', border: '1px solid var(--br)', borderRadius: 100, color: 'var(--tm)' }}>💰 {inq.intake_data.budget}</span>}
                                </div>
                                {(inq.intake_data.contactName || inq.intake_data.contactEmail || inq.intake_data.contactPhone) && (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem', marginBottom: '.4rem' }}>
                                    {inq.intake_data.contactName && <span style={{ fontSize: '.72rem', padding: '.2rem .65rem', background: 'rgba(150,172,156,.15)', border: '1px solid rgba(150,172,156,.4)', borderRadius: 100, color: 'var(--tm)' }}>👤 {inq.intake_data.contactName}</span>}
                                    {inq.intake_data.contactEmail && <span style={{ fontSize: '.72rem', padding: '.2rem .65rem', background: 'rgba(150,172,156,.15)', border: '1px solid rgba(150,172,156,.4)', borderRadius: 100, color: 'var(--tm)' }}>✉ {inq.intake_data.contactEmail}</span>}
                                    {inq.intake_data.contactPhone && <span style={{ fontSize: '.72rem', padding: '.2rem .65rem', background: 'rgba(150,172,156,.15)', border: '1px solid rgba(150,172,156,.4)', borderRadius: 100, color: 'var(--tm)' }}>📞 {inq.intake_data.contactPhone}</span>}
                                  </div>
                                )}
                                {inq.intake_data.notes && <div style={{ fontSize: '.83rem', color: 'var(--tm)', fontStyle: 'italic', lineHeight: 1.6 }}>"{inq.intake_data.notes}"</div>}
                              </div>
                            ) : (
                              <div>
                                {inq.event_date && <div style={{ fontSize: '.72rem', color: 'var(--tm)', marginBottom: '.3rem' }}>📅 {new Date(inq.event_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>}
                                <div style={{ fontSize: '.84rem', color: 'var(--tm)', fontStyle: 'italic', lineHeight: 1.6 }}>"{inq.message}"</div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
