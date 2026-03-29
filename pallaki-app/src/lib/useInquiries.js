import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { useAuth } from './AuthContext'

// For planners — send an inquiry
export async function sendInquiry({ vendorId, plannerId, message, eventDate }) {
  if (!supabase) return { error: null }
  const payload = {
    vendor_id: vendorId,
    planner_id: plannerId,
    message,
    event_date: eventDate ? `${eventDate}-01` : null,
    status: 'pending',
  }
  return supabase.from('inquiries').insert(payload)
}

// For vendors — fetch their incoming inquiries
export function useVendorInquiries(vendorId) {
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!vendorId || !supabase) { setLoading(false); return }
    fetch()
  }, [vendorId])

  async function fetch() {
    const { data } = await supabase
      .from('inquiries')
      .select(`
        *,
        profiles (name, email, city, state, event_type)
      `)
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
    setInquiries(data || [])
    setLoading(false)
  }

  async function updateStatus(id, status) {
    if (!supabase) return
    await supabase.from('inquiries').update({ status }).eq('id', id)
    await fetch()
  }

  return { inquiries, loading, updateStatus, refetch: fetch }
}
