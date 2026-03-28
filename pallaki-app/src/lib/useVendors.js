import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { VENDORS } from '../data/vendors' // fallback for demo mode

export function useVendors(category = 'All') {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!supabase) {
      // demo mode — use hardcoded data
      const filtered = category === 'All'
        ? VENDORS
        : VENDORS.filter(v => v.cat === category)
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

      if (category !== 'All') {
        query = query.eq('category', category)
      }

      const { data, error } = await query
      if (error) { setError(error.message); setLoading(false); return }

      // Normalize DB shape to match component expectations
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
      })))
      setLoading(false)
    }

    fetch()
  }, [category])

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
        })
      }
      setLoading(false)
    }

    fetch()
  }, [id])

  return { vendor, loading }
}
