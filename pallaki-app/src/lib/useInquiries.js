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
    fetchAll()
  }, [vendorId])

  async function fetchAll() {
    const { data } = await supabase
      .from('inquiries')
      .select(`*, profiles (name, email, phone, city, state, event_type)`)
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
    setInquiries(data || [])
    setLoading(false)
  }

  async function updateStatus(id, status) {
    if (!supabase) return
    await supabase.from('inquiries').update({ status }).eq('id', id)
    await fetchAll()
  }

  async function saveReply(id, reply) {
    if (!supabase) return
    await supabase.from('inquiries').update({
      vendor_reply: reply,
      replied_at: new Date().toISOString(),
      status: 'replied',
    }).eq('id', id)
    await fetchAll()
  }

  async function archiveInquiry(id) {
    if (!supabase) return
    await supabase.from('inquiries').update({ status: 'archived' }).eq('id', id)
    await fetchAll()
  }

  return { inquiries, loading, updateStatus, saveReply, archiveInquiry, refetch: fetchAll }
}

// For planners — fetch their sent inquiries with vendor info
export function usePlannerInquiries() {
  const { user } = useAuth()
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !supabase) { setLoading(false); return }
    fetchAll()
  }, [user])

  async function fetchAll() {
    const { data } = await supabase
      .from('inquiries')
      .select(`*, vendors (id, name, category, city, state, icon, avatar_url)`)
      .eq('planner_id', user.id)
      .order('created_at', { ascending: false })
    setInquiries(data || [])
    setLoading(false)
  }

  return { inquiries, loading }
}
