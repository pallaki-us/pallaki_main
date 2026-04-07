import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { usePlannerProfile } from '../lib/usePlannerProfile'
import { showToast } from '../lib/toast'

const SERVICES = ['📷 Photography','🪷 Mehndi Artist','🎥 Videography','💄 Bridal Makeup','🍛 Catering','🌸 Mandap & Decor','🎵 Music & DJ','🛕 Priest / Pandit','👗 Bridal Lehenga','🏛️ Wedding Venue']
const STATES = ['California','Georgia','Illinois','Maryland','New Jersey','New York','Texas','Virginia','Washington']
const TRADITIONS = ['Hindu (North Indian)','Hindu (South Indian)','Muslim / Nikah','Sikh','Christian','Jain','Mixed / Fusion','Other']
const GUEST_OPTIONS = ['Under 50','50 - 100','100 - 200','200 - 400','400+']
const BUDGET_OPTIONS = ['Under $2,000','$2,000 - $5,000','$5,000 - $10,000','$10,000 - $25,000','$25,000 - $50,000','$50,000+','Prefer not to say']

export default function PlannerProfile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { profile, saving, saveProfile } = usePlannerProfile()

  const [fname, setFname] = useState('')
  const [lname, setLname] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [venueCity, setVenueCity] = useState('')
  const [eventType, setEventType] = useState('Wedding')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [guests, setGuests] = useState('100 - 200')
  const [budget, setBudget] = useState('Prefer not to say')
  const [tradition, setTradition] = useState('Hindu (North Indian)')
  const [notes, setNotes] = useState('')
  const [services, setServices] = useState(['📷 Photography','🪷 Mehndi Artist'])
  const [visible, setVisible] = useState(true)

  // Populate from DB
  useEffect(() => {
    if (!profile) return
    const nameParts = (profile.name || '').split(' ')
    setFname(nameParts[0] || '')
    setLname(nameParts.slice(1).join(' ') || '')
    setPhone(profile.phone || '')
    setCity(profile.city || '')
    setState(profile.state || '')
    setZip(profile.zip || '')
    setEventType(profile.event_type || 'Wedding')
    setDateStart(profile.event_date_start || '')
    setDateEnd(profile.event_date_end || '')
    setGuests(profile.guest_count || '100 - 200')
    setBudget(profile.budget || 'Prefer not to say')
    setTradition(profile.tradition || 'Hindu (North Indian)')
    setNotes(profile.notes || '')
    setServices(profile.services_needed || ['📷 Photography','🪷 Mehndi Artist'])
    setVisible(profile.visible_to_vendors ?? true)
  }, [profile])

  function toggleService(s) {
    setServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  async function handleSave() {
    const { error } = await saveProfile({
      name: `${fname} ${lname}`.trim(),
      phone,
      city,
      state,
      zip,
      event_type: eventType,
      event_date_start: dateStart || null,
      event_date_end: dateEnd || null,
      guest_count: guests,
      budget,
      tradition,
      notes,
      services_needed: services,
      visible_to_vendors: visible,
    })
    if (error) showToast('Error saving: ' + error.message)
    else showToast('Profile saved! ✨ Vendors matching your event can now find you.')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cd)', paddingTop: 64 }}>
      {/* Sticky action bar */}
      <div style={{ position: 'sticky', top: 64, zIndex: 100, background: 'var(--cr)', borderBottom: '1px solid var(--br)', padding: '.75rem 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <button className="btn-o" style={{ padding: '.45rem 1rem', fontSize: '.78rem' }} onClick={() => navigate('/')}>← Back</button>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1rem', color: 'var(--vx)', fontWeight: 400 }}>Edit My Profile</span>
        </div>
        <button className="dash-btn dash-btn-gold" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Profile ✓'}
        </button>
      </div>

      <div className="dash-body">
        {/* Contact Info */}
        <div className="dash-card">
          <div className="dash-card-head"><h3>👤 Contact Information</h3><span style={{ fontSize: '.72rem', color: 'var(--tl)' }}>Shared with vendors only when you send an inquiry</span></div>
          <div className="dash-card-body">
            <div className="details-form">
              <div className="df"><label>First Name</label><input value={fname} onChange={e => setFname(e.target.value)} placeholder="Priya" /></div>
              <div className="df"><label>Last Name</label><input value={lname} onChange={e => setLname(e.target.value)} placeholder="Sharma" /></div>
              <div className="df"><label>Email Address</label><input type="email" value={user?.email || ''} disabled style={{ opacity: .6 }} /></div>
              <div className="df"><label>Phone / WhatsApp</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" /></div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="dash-card">
          <div className="dash-card-head"><h3>📍 Location</h3></div>
          <div className="dash-card-body">
            <div className="details-form">
              <div className="df"><label>Your City</label><input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Edison" /></div>
              <div className="df"><label>State</label>
                <select value={state} onChange={e => setState(e.target.value)}>
                  <option value="">Select state...</option>
                  {STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="df"><label>ZIP Code</label><input value={zip} onChange={e => setZip(e.target.value)} placeholder="e.g. 08817" maxLength={10} /></div>
              <div className="df"><label>Event Venue City</label><input value={venueCity} onChange={e => setVenueCity(e.target.value)} placeholder="e.g. New York, NY" /></div>
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="dash-card">
          <div className="dash-card-head"><h3>🎯 Event Details</h3></div>
          <div className="dash-card-body">
            <div className="details-form">
              <div className="df"><label>Type of Event</label>
                <select value={eventType} onChange={e => setEventType(e.target.value)}>
                  {['Wedding','Pre-Wedding / Engagement','Mehndi Night','Sangeet','Baby Shower','Birthday','House Warming','Other'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="df"><label>Event Start Date</label><input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} /></div>
              <div className="df"><label>Event End Date</label><input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} /></div>
              <div className="df"><label>Expected Guest Count</label>
                <select value={guests} onChange={e => setGuests(e.target.value)}>
                  {GUEST_OPTIONS.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div className="df"><label>Approximate Budget</label>
                <select value={budget} onChange={e => setBudget(e.target.value)}>
                  {BUDGET_OPTIONS.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div className="df"><label>Cultural Tradition</label>
                <select value={tradition} onChange={e => setTradition(e.target.value)}>
                  {TRADITIONS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="df full"><label>Special Notes for Vendors</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: 'vertical', minHeight: 100 }} placeholder="e.g. Outdoor ceremony, vegetarian catering only, need someone who understands Telugu rituals..." />
              </div>
            </div>
          </div>
        </div>

        {/* Services Needed */}
        <div className="dash-card">
          <div className="dash-card-head"><h3>🛍️ Services I Need</h3></div>
          <div className="dash-card-body">
            <div className="multi-sel">
              {SERVICES.map(s => (
                <div key={s} className={`ms-chip${services.includes(s) ? ' sel' : ''}`} onClick={() => toggleService(s)}>{s}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Visibility */}
        <div className="dash-card">
          <div className="dash-card-head"><h3>👁️ Vendor Visibility</h3></div>
          <div className="dash-card-body">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem', padding: '1rem', background: 'var(--vf)', border: '1px solid var(--br)', borderRadius: 12, marginBottom: '1rem' }}>
              <div>
                <p style={{ fontSize: '.88rem', fontWeight: 500, color: 'var(--vx)', marginBottom: '.3rem' }}>Allow vendors to find & contact me</p>
                <p style={{ fontSize: '.78rem', color: 'var(--tl)', fontWeight: 300, lineHeight: 1.6 }}>Verified vendors matching your event can send you an introductory message.</p>
              </div>
              <label className="pp-toggle" style={{ flexShrink: 0, marginTop: '.1rem' }}>
                <input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)} />
                <span className="pp-toggle-slider" />
              </label>
            </div>
            <div style={{ padding: '.85rem 1rem', background: 'var(--gp)', border: '1px solid rgba(196,154,60,.3)', borderRadius: 10 }}>
              <p style={{ fontSize: '.78rem', color: 'var(--tm)', lineHeight: 1.65 }}>
                <strong style={{ color: 'var(--vx)' }}>Your privacy matters.</strong> We only share your details with vendors you choose to contact.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.75rem', paddingBottom: '3rem', flexWrap: 'wrap' }}>
          <button className="btn-o" onClick={() => navigate('/')}>← Back to Home</button>
          <div style={{ display: 'flex', gap: '.65rem' }}>
            <button className="btn-o" onClick={() => navigate('/vendors')}>Browse Vendors</button>
            <button className="btn-p" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Profile ✓'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
