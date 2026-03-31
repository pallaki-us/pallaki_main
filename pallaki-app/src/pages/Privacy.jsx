export default function Privacy({ onClose }) {
  return (
    <div style={{ paddingTop: 64, minHeight: '100vh', background: 'var(--cr)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '4rem 2rem 6rem' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--tl)', fontSize: '.8rem', cursor: 'pointer', fontFamily: "'Cormorant Garamond',serif", marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: 5 }}>
          ← Back
        </button>

        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 400, color: 'var(--vx)', marginBottom: '.5rem' }}>
          Privacy & Data Protection
        </h1>
        <p style={{ fontSize: '.8rem', color: 'var(--tl)', marginBottom: '3rem', letterSpacing: '.06em', textTransform: 'uppercase' }}>
          Last updated: March 2026
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {[
            {
              title: 'We take your privacy seriously.',
              body: 'At Pallaki, we are committed to protecting your personal information and handling it with the highest level of care and responsibility.',
            },
            {
              title: 'We collect only what we need.',
              body: 'We collect only the information necessary to provide and improve our services. Your personal data is never sold to third parties.',
            },
            {
              title: 'Your data is not shared without your consent.',
              body: 'We do not share your information with vendors or other users unless it is required to facilitate a connection or interaction that you have explicitly chosen — for example, when you reach out to a vendor through our platform.',
            },
            {
              title: 'Mutual consent, always.',
              body: 'Any information shared between users and vendors is done with mutual consent and for the sole purpose of enabling a seamless experience.',
            },
            {
              title: 'Your data is protected.',
              body: 'We implement appropriate security measures to protect your data from unauthorized access, misuse, or disclosure.',
            },
          ].map(item => (
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
            Questions about your data? Contact us at{' '}
            <a href="mailto:info@pallaki.us" style={{ color: 'var(--v)', textDecoration: 'none' }}>info@pallaki.us</a>
          </p>
        </div>
      </div>
    </div>
  )
}
