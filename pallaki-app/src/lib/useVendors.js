import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { VENDORS } from '../data/vendors' // fallback for demo mode

export function useVendors(category = 'All', city = '') {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!supabase) {
      let filtered = category === 'All' ? VENDORS : VENDORS.filter(v => v.cat === category)
      if (city) filtered = filtered.filter(v => v.loc.toLowerCase().includes(city.toLowerCase()))
      setVendors(filtered)
      setLoading(false)
      return
    }

    async function fetch() {
      setLoading(true)
      let query = supabase
        .from('vendors')
        .select('*')
        .order('rating', { ascending: false })

      if (category !== 'All') query = query.eq('category', category)
      if (city) query = query.ilike('city', `%${city}%`)

      const { data, error } = await query
      if (error) { setError(error.message); setLoading(false); return }

      setVendors(data.map(v => ({
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
        portfolio_urls: v.portfolio_urls || [],
        featured_urls: v.featured_urls || [],
      })))
      setLoading(false)
    }

    fetch()
  }, [category, city])

  return { vendors, loading, error }
}

export function useVendor(id) {
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    if (!supabase) {
      const v = VENDORS.find(x => x.id === id) || VENDORS[0]
      setVendor(v)
      setLoading(false)
      return
    }

    async function fetch() {
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
          portfolio_urls: data.portfolio_urls || [],
          featured_urls: data.featured_urls || [],
        })
      }
      setLoading(false)
    }

    fetch()
  }, [id])

  return { vendor, loading }
}
