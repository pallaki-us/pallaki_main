import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { IS_DEMO } from './env'
import { VENDORS } from '../data/vendors'

const PAGE_SIZE = 9

// Columns needed for listing cards — excludes heavy fields like portfolio_urls
const LISTING_COLS = 'id, name, category, city, state, icon, bg, rating, review_count, badge, description, services, events_covered, is_verified, is_available'

export function useVendors(category = 'All', city = '', page = 1, topRated = false) {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (!supabase || IS_DEMO) {
      let filtered = category === 'All' ? VENDORS : VENDORS.filter(v => v.cat === category)
      if (city) filtered = filtered.filter(v => v.loc.toLowerCase().includes(city.toLowerCase()))
      if (topRated) filtered = filtered.filter(v => v.badge === 'top')
      setTotal(filtered.length)
      const start = (page - 1) * PAGE_SIZE
      setVendors(filtered.slice(start, start + PAGE_SIZE))
      setLoading(false)
      return
    }

    async function fetchVendors() {
      setLoading(true)
      setError(null)

      const start = (page - 1) * PAGE_SIZE
      const end = start + PAGE_SIZE - 1

      let query = supabase
        .from('vendors')
        .select(LISTING_COLS, { count: 'exact' })
        .order('rating', { ascending: false })
        .range(start, end)

      if (category !== 'All') query = query.eq('category', category)
      if (city) query = query.ilike('city', `%${city}%`)
      if (topRated) query = query.eq('badge', 'top')

      const { data, error: err, count } = await query

      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }

      setTotal(count || 0)
      setVendors((data || []).map(v => ({
        id: v.id,
        name: v.name,
        cat: v.category,
        loc: `${v.city}, ${v.state}`,
        icon: v.icon,
        rating: v.rating?.toFixed(1),
        reviews: v.review_count,
        badge: v.badge,
        desc: v.description,
        services: v.services || [],
        events: v.events_covered,
        bg: v.bg,
        is_verified: v.is_verified,
        is_available: v.is_available,
      })))
      setLoading(false)
    }

    fetchVendors()
  }, [category, city, page, topRated])

  return { vendors, loading, error, total }
}

export function useVendor(id) {
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    if (!supabase || IS_DEMO) {
      const v = VENDORS.find(x => String(x.id) === String(id)) || VENDORS[0]
      setVendor(v)
      setLoading(false)
      return
    }

    async function fetchVendor() {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', id)
        .single()

      if (!error && data) {
        setVendor({
          id: data.id,
          name: data.name,
          cat: data.category,
          loc: `${data.city}, ${data.state}`,
          icon: data.icon,
          rating: data.rating?.toFixed(1),
          reviews: data.review_count,
          badge: data.badge,
          desc: data.description,
          services: data.services || [],
          events: data.events_covered,
          bg: data.bg,
          is_verified: data.is_verified,
          avatar_url: data.avatar_url || null,
          portfolio_urls: data.portfolio_urls || [],
          featured_urls: data.featured_urls || [],
          is_available: data.is_available,
          availability_note: data.availability_note || '',
          languages: data.languages || [],
          testimonials: data.testimonials || [],
          service_areas: data.service_areas || [],
        })
      }
      setLoading(false)
    }

    fetchVendor()
  }, [id])

  return { vendor, loading }
}
