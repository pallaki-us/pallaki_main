import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { showToast } from '../lib/toast'
import ImageUpload from '../components/ImageUpload'
import { useVendorProfile } from '../lib/useVendorProfile'
import { useVendorInquiries } from '../lib/useInquiries'

const AN_DATA = {
  30:  { views: 127,  inquiries: 8,  bookings: 2,  rating: '4.9', rate: '11.8%', viewTrend: '↑ 14%', inqTrend: '↑ 3',  bkTrend: '↑ 1', contacts: [2,3,1,4,3,2,5,4,3,6,4,8],  profileViews: [12,15,10,18,14,11,22,19,14,26,18,28] },
  180: { views: 641,  inquiries: 31, bookings: 6,  rating: '4.9', rate: '11.4%', viewTrend: '↑ 22%', inqTrend: '↑ 9',  bkTrend: '↑ 3', contacts: [4,5,3,7,8,6,9,8,6,10,9,12], profileViews: [30,38,25,48,52,44,61,58,44,72,64,85] },
  365: { views: 1284, inquiries: 64, bookings: 12, rating: '4.9', rate: '11.2%', viewTrend: '↑ 38%', inqTrend: '↑ 22%', bkTrend: '↑ 4', contacts: [4,6,5,8,12,18,22,19,25,31,28,34], profileViews: [18,22,20,28,38,55,61,58,72,88,81,95] },
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const SERVICES = ['Weddings','Engagements','Mehndi Night','Sangeet','Pre-Wedding','Birthdays']

export default function Dashboard({ activePage, onShowVendorListing }) {
  const { user, signOut } = useAuth()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }
  const navigate = useNavigate()
  const { profile, saving, saveProfile } = useVendorProfile()
  const { inquiries, updateStatus, saveReply, archiveInquiry } = useVendorInquiries(profile?.id)
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [period, setPeriod] = useState(365)
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
    const path = `${user.id}/avatar/profile.${ext}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
    if (error) { showToast('Upload failed: ' + error.message); return }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    const url = data.publicUrl + '?t=' + Date.now()
    setAvatarUrl(url)
    await saveProfile({ avatar_url: url })
    showToast('Profile photo updated ✨')
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
    })
    if (error) showToast('Error saving: ' + error.message)
    else showToast('Profile saved! ✨')
  }
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  const d = AN_DATA[period]

  // Draw chart when analytics tab is active
  useEffect(() => {
    if (activePage !== 'analytics') return
    if (!chartRef.current) return

    const draw = () => {
      if (!window.Chart) return
      if (chartInstance.current) chartInstance.current.destroy()
      chartInstance.current = new window.Chart(chartRef.current, {
        type: 'line',
        data: {
          labels: MONTHS,
          datasets: [
            { label: 'Inquiries', data: d.contacts, borderColor: '#C4848C', backgroundColor: 'rgba(196,132,140,0.08)', tension: .4, pointBackgroundColor: '#C4848C', pointRadius: 3 },
            { label: 'Profile Views', data: d.profileViews, borderColor: '#C49A3C', backgroundColor: 'rgba(196,154,60,0.08)', tension: .4, pointBackgroundColor: '#C49A3C', pointRadius: 3 },
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
  }, [activePage, period])

  function toggleService(s) {
    setSelServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  const name = user?.user_metadata?.name || 'Vendor'

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
                      {['New York','New Jersey','California','Texas','Illinois','Georgia','Washington','Virginia','Maryland'].map(s => <option key={s}>{s}</option>)}
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
                          await saveProfile({ portfolio_urls: urls })
                          showToast(`Portfolio updated — ${urls.length} photos`)
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
                          await saveProfile({ featured_urls: urls })
                          showToast(`Featured work updated — ${urls.length} photos`)
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
            <div className="stat-row" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
              {[
                { id: 'views', n: d.views.toLocaleString(), l: 'Profile Views', t: d.viewTrend },
                { id: 'inq',   n: d.inquiries,              l: 'Inquiries',     t: d.inqTrend },
                { id: 'book',  n: d.bookings,               l: 'Bookings',      t: d.bkTrend },
                { id: 'rat',   n: d.rating,                 l: 'Avg Rating',    t: '↑ 0.2' },
                { id: 'rate',  n: d.rate,                   l: 'Inquiry Rate',  t: '↑ 4.1%' },
              ].map(k => (
                <div key={k.id} className="stat-c">
                  <div className="sn">{k.n}</div>
                  <div className="sl">{k.l}</div>
                  <div className="sd up">{k.t}</div>
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
                  {[
                    { label: 'Profile Views',      n: d.views.toLocaleString(), pct: '100%', color: 'var(--v)' },
                    { label: 'Gallery Clicks',     n: Math.round(d.views * .32).toLocaleString(), pct: '32%', color: 'var(--v)' },
                    { label: 'Inquiries Sent',     n: d.inquiries, pct: '5%', color: 'var(--v)' },
                    { label: 'Bookings Confirmed', n: d.bookings,  pct: '0.9%', color: 'var(--g)' },
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
                  ))}
                </div>
              </div>
            </div>

            {/* Inquiries */}
            <div className="an-card">
              <div className="an-card-head">
                <h3>💌 Inquiries</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                  {inquiries.filter(i => i.status === 'pending').length > 0 && (
                    <span style={{ fontSize: '.7rem', color: 'var(--v)', fontWeight: 500 }}>{inquiries.filter(i => i.status === 'pending').length} new</span>
                  )}
                  <button style={{ fontSize: '.7rem', color: 'var(--tl)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Cormorant Garamond',serif" }}
                    onClick={() => setShowArchived(p => !p)}>
                    {showArchived ? 'Hide Archived' : 'Show Archived'}
                  </button>
                </div>
              </div>
              <div className="an-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                {inquiries.filter(i => showArchived ? i.status === 'archived' : i.status !== 'archived').length === 0 ? (
                  <p style={{ fontSize: '.88rem', color: 'var(--tl)', textAlign: 'center', padding: '2rem', fontStyle: 'italic' }}>
                    {showArchived ? 'No archived inquiries.' : 'No inquiries yet — your listing is live and families can find you!'}
                  </p>
                ) : inquiries.filter(i => showArchived ? i.status === 'archived' : i.status !== 'archived').map(inq => (
                  <div key={inq.id} style={{ padding: '1rem', background: inq.status === 'pending' ? 'var(--vf)' : 'var(--wh)', border: `1px solid ${inq.status === 'pending' ? 'rgba(196,132,140,.3)' : 'var(--br)'}`, borderRadius: 12 }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '.75rem', marginBottom: '.6rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--v)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '.88rem', flexShrink: 0 }}>
                          {(inq.profiles?.name || inq.profiles?.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '.86rem', fontWeight: 500, color: 'var(--vx)' }}>
                            {inq.profiles?.name || inq.profiles?.email}
                            {inq.profiles?.event_type && <span style={{ fontWeight: 300, color: 'var(--tm)' }}> · {inq.profiles.event_type}</span>}
                          </div>
                          <div style={{ fontSize: '.72rem', color: 'var(--tl)', marginTop: '.15rem', display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
                            {inq.profiles?.email && <span>✉ {inq.profiles.email}</span>}
                            {inq.profiles?.phone && <span>📞 {inq.profiles.phone}</span>}
                            {inq.profiles?.city && <span>📍 {inq.profiles.city}{inq.profiles.state ? `, ${inq.profiles.state}` : ''}</span>}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: '.68rem', color: 'var(--tl)', whiteSpace: 'nowrap', textAlign: 'right', flexShrink: 0 }}>
                        {new Date(inq.created_at).toLocaleDateString()}
                        {inq.status === 'pending' && <div style={{ color: 'var(--v)', fontWeight: 600, marginTop: 2 }}>New</div>}
                        {inq.status === 'replied' && <div style={{ color: 'var(--sage)', fontWeight: 500, marginTop: 2 }}>Replied</div>}
                        {inq.status === 'archived' && <div style={{ color: 'var(--tl)', marginTop: 2 }}>Archived</div>}
                      </div>
                    </div>

                    {/* Message */}
                    {inq.event_date && (
                      <div style={{ fontSize: '.72rem', color: 'var(--tm)', marginBottom: '.35rem' }}>📅 Event date: {new Date(inq.event_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                    )}
                    <div style={{ fontSize: '.84rem', color: 'var(--tm)', fontStyle: 'italic', marginBottom: '.6rem', lineHeight: 1.6 }}>"{inq.message}"</div>

                    {/* Vendor reply (if exists) */}
                    {inq.vendor_reply && (
                      <div style={{ background: 'var(--cd)', border: '1px solid var(--br)', borderRadius: 8, padding: '.6rem .8rem', marginBottom: '.6rem' }}>
                        <div style={{ fontSize: '.68rem', color: 'var(--tl)', marginBottom: '.25rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Your reply</div>
                        <div style={{ fontSize: '.82rem', color: 'var(--tm)', lineHeight: 1.6 }}>{inq.vendor_reply}</div>
                      </div>
                    )}

                    {/* Reply box */}
                    {replyingTo === inq.id && (
                      <div style={{ marginBottom: '.6rem' }}>
                        <textarea
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          placeholder="Write your reply…"
                          style={{ width: '100%', padding: '.65rem .8rem', border: '1.5px solid var(--v)', borderRadius: 8, fontFamily: "'Cormorant Garamond',serif", fontSize: '.84rem', resize: 'vertical', minHeight: 80, outline: 'none', background: 'var(--cr)', boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', gap: '.5rem', marginTop: '.4rem' }}>
                          <button style={{ fontSize: '.75rem', padding: '.35rem .9rem', background: 'var(--v)', color: '#fff', border: 'none', borderRadius: 20, cursor: 'pointer', fontFamily: "'Cormorant Garamond',serif" }}
                            onClick={async () => { if (!replyText.trim()) return; await saveReply(inq.id, replyText); setReplyingTo(null); setReplyText('') }}>
                            Send Reply ✓
                          </button>
                          <button style={{ fontSize: '.75rem', padding: '.35rem .9rem', background: 'none', color: 'var(--tl)', border: '1px solid var(--br)', borderRadius: 20, cursor: 'pointer', fontFamily: "'Cormorant Garamond',serif" }}
                            onClick={() => { setReplyingTo(null); setReplyText('') }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {inq.status !== 'archived' && (
                      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                        {replyingTo !== inq.id && (
                          <button style={{ fontSize: '.72rem', padding: '.3rem .85rem', background: 'var(--v)', color: '#fff', border: 'none', borderRadius: 20, cursor: 'pointer', fontFamily: "'Cormorant Garamond',serif" }}
                            onClick={() => { setReplyingTo(inq.id); setReplyText(inq.vendor_reply || '') }}>
                            {inq.vendor_reply ? 'Edit Reply' : 'Reply'}
                          </button>
                        )}
                        <button style={{ fontSize: '.72rem', padding: '.3rem .85rem', background: 'none', color: 'var(--tl)', border: '1px solid var(--br)', borderRadius: 20, cursor: 'pointer', fontFamily: "'Cormorant Garamond',serif" }}
                          onClick={() => archiveInquiry(inq.id)}>
                          Archive
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
