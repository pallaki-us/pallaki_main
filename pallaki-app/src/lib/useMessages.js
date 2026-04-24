import { useState, useEffect } from 'react'
import { supabase } from './supabase'

// Messages within a single thread (vendor + planner pair)
export function useMessages(vendorId, plannerId) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!vendorId || !plannerId || !supabase) { setLoading(false); return }
    fetchMessages()

    const channel = supabase
      .channel(`msgs-${vendorId}-${plannerId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => fetchMessages())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [vendorId, plannerId])

  async function fetchMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('planner_id', plannerId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    setLoading(false)
  }

  async function send(body, senderRole, senderId) {
    if (!supabase || !body.trim()) return
    await supabase.from('messages').insert({
      vendor_id: vendorId,
      planner_id: plannerId,
      sender_id: senderId,
      sender_role: senderRole,
      body: body.trim(),
    })
  }

  return { messages, loading, send, refetch: fetchMessages }
}

// For vendor dashboard: list of planners who have sent messages, using inquiries for profile info
export function useVendorThreads(vendorId) {
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!vendorId || !supabase) { setLoading(false); return }
    fetchThreads()
  }, [vendorId])

  async function fetchThreads() {
    const { data } = await supabase
      .from('inquiries')
      .select('planner_id, created_at, intake_data, profiles(name, email)')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })

    if (!data) { setThreads([]); setLoading(false); return }

    const seen = new Set()
    const result = []
    for (const inq of data) {
      if (!seen.has(inq.planner_id)) {
        seen.add(inq.planner_id)
        result.push({
          planner_id: inq.planner_id,
          name: inq.intake_data?.contactName || inq.profiles?.name || inq.profiles?.email || 'Planner',
          email: inq.intake_data?.contactEmail || inq.profiles?.email,
        })
      }
    }
    setThreads(result)
    setLoading(false)
  }

  return { threads, loading, refetch: fetchThreads }
}

// For planner profile: list of vendors they've contacted
export function usePlannerThreads(plannerId) {
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!plannerId || !supabase) { setLoading(false); return }
    fetchThreads()
  }, [plannerId])

  async function fetchThreads() {
    const { data } = await supabase
      .from('inquiries')
      .select('vendor_id, created_at, vendors(id, name, category, city, icon, avatar_url)')
      .eq('planner_id', plannerId)
      .order('created_at', { ascending: false })

    if (!data) { setThreads([]); setLoading(false); return }

    const seen = new Set()
    const result = []
    for (const inq of data) {
      if (!seen.has(inq.vendor_id)) {
        seen.add(inq.vendor_id)
        result.push({ vendor_id: inq.vendor_id, vendor: inq.vendors })
      }
    }
    setThreads(result)
    setLoading(false)
  }

  return { threads, loading, refetch: fetchThreads }
}
