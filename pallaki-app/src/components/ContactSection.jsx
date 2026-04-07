import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) return
    setStatus('sending')
    try {
      if (supabase) {
        const { error } = await supabase
          .from('contact_messages')
          .insert({ name: form.name, email: form.email, message: form.message })
        if (error) throw error
      }
      setStatus('sent')
      setForm({ name: '', email: '', message: '' })
    } catch (err) {
      console.error('Failed to send contact message:', err)
      setStatus('error')
    }
  }

  return (
    <section className="ct-section" id="contact">
      <div className="ct-inner">
        <h2 className="how-title">Get in Touch</h2>
        <p className="ct-intro">We'd love to hear from you.</p>
        <p className="ct-intro ct-sub">Have questions, feedback, or want to partner with us? Drop us a note and we'll get back to you within 24 hours.</p>
        {status === 'sent' ? (
          <div className="contact-success">
            <span className="contact-success-icon">🌸</span>
            <h3>Thank you for reaching out!</h3>
            <p>We've received your message and will get back to you as soon as we can.</p>
            <button className="btn-sub" style={{ marginTop: '1.2rem' }} onClick={() => setStatus(null)}>Send Another Message</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="fg">
              <div className="ff">
                <label>Name</label>
                <input type="text" placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="ff">
                <label>Email</label>
                <input type="email" placeholder="you@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div className="ff full">
                <label>Message</label>
                <textarea placeholder="Tell us how we can help…" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required />
              </div>
            </div>
            {status === 'error' && (
              <p style={{ color: '#c0392b', fontSize: '.84rem', marginTop: '.75rem' }}>Something went wrong. Please try again.</p>
            )}
            <button className="btn-sub" type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
