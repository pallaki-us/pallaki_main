const STEPS = [
  { n: '1', title: 'Browse Vendors', desc: 'Search by category and city to find trusted South Asian event vendors near you.' },
  { n: '2', title: 'Create Your Profile', desc: 'Sign up and share your event details so vendors understand exactly what you need.' },
  { n: '3', title: 'Send an Inquiry', desc: 'Message vendors directly and discuss your event on your own terms.' },
  { n: '4', title: 'Celebrate', desc: 'Book your perfect team and let Pallaki help you create memories that last forever.' },
]

export default function HowItWorksSection() {
  return (
    <section className="how-section" id="how-it-works">
      <div className="how-inner">
        <h2 className="how-title">How Pallaki Works</h2>
        <div className="how-timeline">
          {STEPS.map(step => (
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
  )
}
