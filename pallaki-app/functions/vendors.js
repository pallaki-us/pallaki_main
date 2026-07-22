// SEO meta for the browse/listing page: /vendors and /vendors?cat=...&city=...
// Gives each category (and category+city) combination its own title and
// description so Google can rank them for searches like "mehndi artist dallas".

import { SITE, CATEGORIES, esc, serveWithMeta } from './_shared.js'

export async function onRequestGet(context) {
  const url = new URL(context.request.url)
  const cat = url.searchParams.get('cat')
  const city = (url.searchParams.get('city') || '').trim()

  const validCat = CATEGORIES.includes(cat) ? cat : null

  let title, description, canonical
  if (validCat) {
    const where = city ? ` in ${city}` : ''
    title = `${validCat}${where} — South Asian Wedding Vendors | Pallaki`
    description = `Browse trusted ${validCat.toLowerCase()} vendors${where} for Indian, Pakistani and South Asian weddings. Compare portfolios and connect directly on Pallaki.`
    canonical = `${SITE}/vendors?cat=${encodeURIComponent(validCat)}${city ? `&city=${encodeURIComponent(city)}` : ''}`
  } else {
    title = 'Browse South Asian Wedding Vendors | Pallaki'
    description = 'Explore photographers, mehndi artists, caterers, decorators, DJs and more for your South Asian wedding — all in one place on Pallaki.'
    canonical = `${SITE}/vendors`
  }

  return serveWithMeta(context, {
    title: esc(title),
    description: esc(description),
    url: canonical,
    image: `${SITE}/og-image.jpg`,
  })
}
