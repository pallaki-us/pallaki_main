// Shared helpers for Cloudflare Pages Functions (SEO meta injection).
// These run on Cloudflare's edge in front of the SPA — the React app is untouched.

export const SITE = 'https://www.pallaki.us'

export const DEFAULT_IMAGE = `${SITE}/og-image.jpg`

// Mirrors the category list used in the app UI.
export const CATEGORIES = [
  'Photography', 'Videography', 'Mehndi Artists', 'Bridal Makeup', 'Catering',
  'Decor', 'Music & DJ', 'Event Planners', 'Party Rentals', 'Wedding Attire & Boutique',
]

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export function truncate(s, max = 155) {
  const clean = String(s ?? '').replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return clean.slice(0, max - 1).replace(/\s+\S*$/, '') + '…'
}

export function supabaseConfig(env) {
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL
  const key = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY
  return url && key ? { url: url.replace(/\/$/, ''), key } : null
}

// Query the Supabase REST API (same public anon access the browser app uses).
export async function supabaseSelect(env, table, query) {
  const cfg = supabaseConfig(env)
  if (!cfg) return null
  const res = await fetch(`${cfg.url}/rest/v1/${table}?${query}`, {
    headers: { apikey: cfg.key, authorization: `Bearer ${cfg.key}` },
  })
  if (!res.ok) return null
  return res.json()
}

// Serve the SPA's index.html with title/description/OG tags swapped out.
export async function serveWithMeta(context, meta) {
  const { request, env } = context
  const asset = await env.ASSETS.fetch(new URL('/index.html', request.url))

  const set = (attr) => ({
    element(el) { el.setAttribute('content', meta[attr]) },
  })

  let rewriter = new HTMLRewriter()
    .on('title', { element(el) { el.setInnerContent(meta.title) } })
    .on('meta[name="description"]', set('description'))
    .on('link[rel="canonical"]', { element(el) { el.setAttribute('href', meta.url) } })
    .on('meta[property="og:title"]', set('title'))
    .on('meta[property="og:description"]', set('description'))
    .on('meta[property="og:url"]', { element(el) { el.setAttribute('content', meta.url) } })
    .on('meta[property="og:image"]', set('image'))
    .on('meta[name="twitter:title"]', set('title'))
    .on('meta[name="twitter:description"]', set('description'))
    .on('meta[name="twitter:image"]', set('image'))

  // The default 1200x630 dimensions only apply to the default share image.
  if (meta.image !== DEFAULT_IMAGE) {
    const drop = { element(el) { el.remove() } }
    rewriter = rewriter
      .on('meta[property="og:image:width"]', drop)
      .on('meta[property="og:image:height"]', drop)
  }

  const res = rewriter.transform(asset)
  return new Response(res.body, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Edge-cache briefly so crawler bursts don't hammer Supabase.
      'cache-control': 'public, max-age=0, s-maxage=300',
    },
  })
}

// Fallback: serve the SPA untouched (identical to what Pages does without functions).
export function serveSpa(context) {
  const { request, env } = context
  return env.ASSETS.fetch(new URL('/index.html', request.url))
}
