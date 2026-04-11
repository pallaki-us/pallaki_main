import { useState, useEffect } from 'react'
import { supabase } from './supabase'

// Returns analytics data for the logged-in vendor, scoped to a day window.
// {
//   views: number,
//   inquiries: number,
//   monthlyViews: number[12],    // Jan–Dec counts for current year
//   monthlyInquiries: number[12],
//   loading: boolean,
// }
export function useVendorAnalytics(vendorId, days = 365) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!vendorId || !supabase) { setLoading(false); return }

    let cancelled = false

    async function fetch() {
      setLoading(true)
      const since = new Date()
      since.setDate(since.getDate() - days)
      const sinceISO = since.toISOString()

      const currentYear = new Date().getFullYear()
      const yearStart = `${currentYear}-01-01T00:00:00.000Z`

      const [viewsRes, inqRes, monthlyViewsRes, monthlyInqRes] = await Promise.all([
        // Total views in window
        supabase
          .from('profile_views')
          .select('id', { count: 'exact', head: true })
          .eq('vendor_id', vendorId)
          .gte('viewed_at', sinceISO),

        // Total inquiries in window
        supabase
          .from('inquiries')
          .select('id', { count: 'exact', head: true })
          .eq('vendor_id', vendorId)
          .gte('created_at', sinceISO),

        // Monthly views for current year (for chart)
        supabase
          .from('profile_views')
          .select('viewed_at')
          .eq('vendor_id', vendorId)
          .gte('viewed_at', yearStart),

        // Monthly inquiries for current year (for chart)
        supabase
          .from('inquiries')
          .select('created_at')
          .eq('vendor_id', vendorId)
          .gte('created_at', yearStart),
      ])

      if (cancelled) return

      // Aggregate monthly arrays (index 0 = Jan, 11 = Dec)
      const monthlyViews = Array(12).fill(0)
      for (const row of monthlyViewsRes.data || []) {
        const m = new Date(row.viewed_at).getMonth()
        monthlyViews[m]++
      }

      const monthlyInquiries = Array(12).fill(0)
      for (const row of monthlyInqRes.data || []) {
        const m = new Date(row.created_at).getMonth()
        monthlyInquiries[m]++
      }

      setData({
        views: viewsRes.count ?? 0,
        inquiries: inqRes.count ?? 0,
        monthlyViews,
        monthlyInquiries,
      })
      setLoading(false)
    }

    fetch()
    return () => { cancelled = true }
  }, [vendorId, days])

  return { data, loading }
}
