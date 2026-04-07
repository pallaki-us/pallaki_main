const TESTIMONIALS = [
  {
    icon: '💍',
    quote: "Finding vendors who truly understood our traditions was the hardest part. Pallaki made it effortless — we found our photographer and mehndi artist in one place.",
    name: "Priya & Rohan",
    event: "Wedding · Dallas, TX"
  },
  {
    icon: '🌸',
    quote: "Every vendor we reached out to through Pallaki was professional and culturally aware. Planning felt less overwhelming than we expected.",
    name: "Anita & Vikram",
    event: "Wedding · Chicago, IL"
  },
  {
    icon: '📸',
    quote: "Pallaki brought us clients who understand the importance of what we do. The quality of inquiries is unlike anything else we've tried.",
    name: "Meera Nair Photography",
    event: "Photography Vendor · Atlanta, GA"
  }
]

export default function TestimonialsSection() {
  return (
    <section className="testimonials-section">
      <div className="testimonials-inner">
        <h2 className="how-title">What Families Are Saying</h2>
        <div className="testimonials-grid">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="testi-card">
              <div className="testi-stars">★★★★★</div>
              <p className="testi-quote">"{t.quote}"</p>
              <div className="testi-author">
                <div className="testi-av">{t.icon}</div>
                <div>
                  <div className="testi-name">{t.name}</div>
                  <div className="testi-event">{t.event}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
