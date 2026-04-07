import { useNavigate } from 'react-router-dom'

export default function Terms() {
  const navigate = useNavigate()
  const sections = [
    {
      title: 'Use of the Platform',
      body: 'Pallaki is a marketplace designed to help users discover and connect with South Asian wedding vendors. By using our platform, you agree to use it only for lawful purposes and in a way that does not infringe on the rights of others.',
    },
    {
      title: 'User Information',
      body: 'You agree to provide accurate and up-to-date information when using Pallaki. Any misuse of the platform, including false inquiries or spam, may result in restricted access.',
    },
    {
      title: 'Vendor Listings',
      body: 'Pallaki provides a platform for vendors to showcase their services. While we strive to maintain accurate and reliable listings, we do not guarantee the quality, availability, pricing, or outcomes of services provided by vendors. All agreements, communications, and transactions between users and vendors are solely between those parties.',
    },
    {
      title: 'No Liability',
      body: 'Pallaki is not responsible for any disputes, damages, or issues arising from interactions between users and vendors. We encourage users to conduct their own research and due diligence before making decisions.',
    },
    {
      title: 'Intellectual Property',
      body: 'All content on this website, including text, design, and branding, belongs to Pallaki and may not be copied, reproduced, or used without permission.',
    },
    {
      title: 'Privacy',
      body: 'Your use of Pallaki is also governed by our Privacy Policy. We are committed to protecting your information and do not sell or share your data without your consent.',
    },
    {
      title: 'Changes to Terms',
      body: 'We may update these Terms & Conditions from time to time. Continued use of the platform after changes means you accept the updated terms.',
    },
  ]

  return (
    <div style={{ paddingTop: 64, minHeight: '100vh', background: 'var(--cr)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '4rem 2rem 6rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--tl)', fontSize: '.8rem', cursor: 'pointer', fontFamily: "'Cormorant Garamond',serif", marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: 5 }}>
          ← Back
        </button>

        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 400, color: 'var(--vx)', marginBottom: '.5rem' }}>
          Terms & Conditions
        </h1>
        <p style={{ fontSize: '.8rem', color: 'var(--tl)', marginBottom: '3rem', letterSpacing: '.06em', textTransform: 'uppercase' }}>
          Last updated: March 2026
        </p>

        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.05rem', fontStyle: 'italic', color: 'var(--tm)', lineHeight: 1.85, marginBottom: '2.5rem' }}>
          By accessing and using Pallaki, you agree to the following terms and conditions. Please read them carefully.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {sections.map(item => (
            <div key={item.title} style={{ borderLeft: '3px solid var(--vl)', paddingLeft: '1.5rem' }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.1rem', color: 'var(--vx)', fontWeight: 400, marginBottom: '.5rem' }}>
                {item.title}
              </h3>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.05rem', fontStyle: 'italic', color: 'var(--tm)', lineHeight: 1.85, fontWeight: 400 }}>
                {item.body}
              </p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'var(--vf)', border: '1px solid var(--br)', borderRadius: 12 }}>
          <p style={{ fontSize: '.86rem', color: 'var(--tm)', lineHeight: 1.7, fontWeight: 300 }}>
            Questions? Contact us at{' '}
            <a href="mailto:info@pallaki.us" style={{ color: 'var(--v)', textDecoration: 'none' }}>info@pallaki.us</a>
            {' '}· Also see our{' '}
            <span style={{ color: 'var(--v)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/privacy')}>Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  )
}
