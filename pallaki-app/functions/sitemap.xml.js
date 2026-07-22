// Dynamic sitemap: /sitemap.xml
// Rebuilt on request (edge-cached 1h) from Supabase, so newly onboarded vendors
// appear automatically — no redeploy needed. Replaces the old static sitemap.

import { SITE, CATEGORIES, esc, supabaseSelect } from './_shared.js'

const STATIC_PATHS = ['/', '/vendors', '/vendor/signup', '/planner/signup', '/privacy', '/terms']

export async function onRequestGet(context) {
  const urls = [...STATIC_PATHS.map((p) => `${SITE}${p}`)]

  // One URL per category listing.
  for (const cat of CATEGORIES) {
    urls.push(`${SITE}/vendors?cat=${encodeURIComponent(cat)}`)
  }

  // One URL per vendor profile.
  try {
    const vendors = await supabaseSelect(context.env, 'vendors', 'select=id&order=created_at.asc&limit=1000')
    if (Array.isArray(vendors)) {
      for (const v of vendors) urls.push(`${SITE}/vendor/${v.id}`)
    }
  } catch {
    // Supabase unreachable — still serve the static + category URLs.
  }

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${esc(u)}</loc></url>`).join('\n') +
    `\n</urlset>\n`

  return new Response(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=3600',
    },
  })
}
