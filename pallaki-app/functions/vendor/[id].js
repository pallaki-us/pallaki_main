// SEO/share meta for vendor profile pages: /vendor/:id
// Crawlers (Google, WhatsApp, Instagram) see the vendor's real name, description
// and photo; human visitors get the exact same SPA as before.

import { SITE, DEFAULT_IMAGE, esc, truncate, supabaseSelect, serveWithMeta, serveSpa } from '../_shared.js'

export async function onRequestGet(context) {
  const { params } = context
  const id = String(params.id || '')

  // Vendor ids are UUIDs — anything else falls through to the SPA (404 handled there).
  if (!/^[0-9a-f-]{20,40}$/i.test(id)) return serveSpa(context)

  try {
    const rows = await supabaseSelect(
      context.env,
      'vendors',
      `id=eq.${id}&select=name,category,city,state,description,avatar_url&limit=1`,
    )
    const v = rows && rows[0]
    if (!v || !v.name) return serveSpa(context)

    const place = [v.city, v.state].filter(Boolean).join(', ')
    const title = esc(`${v.name} — ${v.category}${place ? ` in ${place}` : ''} | Pallaki`)
    const description = esc(truncate(
      v.description ||
      `${v.name} is a South Asian wedding ${v.category} vendor${place ? ` in ${place}` : ''}. View their portfolio and get in touch on Pallaki.`,
    ))

    return serveWithMeta(context, {
      title,
      description,
      url: `${SITE}/vendor/${id}`,
      image: v.avatar_url ? esc(v.avatar_url) : DEFAULT_IMAGE,
    })
  } catch {
    return serveSpa(context)
  }
}
