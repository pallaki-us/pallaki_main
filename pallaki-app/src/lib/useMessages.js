import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

// Messages within a single thread (vendor + planner pair)
export function useMessages(vendorId, plannerId) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const activeRef = useRef(false)

  useEffect(() => {
    if (!vendorId || !plannerId || !supabase) { setLoading(false); return }
    activeRef.current = true
    fetchMessages()

    const channel = supabase
      .channel(`msgs-${vendorId}-${plannerId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => fetchMessages())
      .subscribe()

    return () => {
      activeRef.current = false
      supabase.removeChannel(channel)
    }
  }, [vendorId, plannerId])

  async function fetchMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('planner_id', plannerId)
      .order('created_at', { ascending: true })
    if (activeRef.current) {
      setMessages(data || [])
      setLoading(false)
    }
  }

  async function send(body, senderRole, senderId) {
    if (!supabase || !body.trim() || !vendorId || !plannerId) return { error: 'Missing IDs' }
    const { error } = await supabase.from('messages').insert({
      vendor_id: vendorId,
      planner_id: plannerId,
      sender_id: senderId,
      sender_role: senderRole,
      body: body.trim(),
    })
    return { error }
  }

  async function markRead(readerRole) {
    if (!supabase || !vendorId || !plannerId) return
    const otherRole = readerRole === 'planner' ? 'vendor' : 'planner'
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('vendor_id', vendorId)
      .eq('planner_id', plannerId)
      .eq('sender_role', otherRole)
      .eq('is_read', false)
  }

  return { messages, loading, send, markRead, refetch: fetchMessages }
}

// For vendor dashboard: list of planners who have sent messages
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

    const [{ data: unreadData }, { data: latestMsgs }] = await Promise.all([
      supabase.from('messages').select('planner_id').eq('vendor_id', vendorId).eq('sender_role', 'planner').eq('is_read', false),
      supabase.from('messages').select('planner_id, created_at').eq('vendor_id', vendorId).order('created_at', { ascending: false }),
    ])

    const unreadPlannerIds = new Set((unreadData || []).map(m => m.planner_id))
    const latestMap = {}
    for (const msg of (latestMsgs || [])) {
      if (!latestMap[msg.planner_id]) latestMap[msg.planner_id] = msg.created_at
    }

    const seen = new Set()
    const result = []
    for (const inq of data) {
      if (!seen.has(inq.planner_id)) {
        seen.add(inq.planner_id)
        result.push({
          planner_id: inq.planner_id,
          name: inq.intake_data?.contactName || inq.profiles?.name || inq.profiles?.email || 'Planner',
          email: inq.intake_data?.contactEmail || inq.profiles?.email,
          hasUnread: unreadPlannerIds.has(inq.planner_id),
          lastMessageAt: latestMap[inq.planner_id] || inq.created_at,
        })
      }
    }
    result.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
    setThreads(result)
    setLoading(false)
  }

  return { threads, loading, refetch: fetchThreads }
}

// For planner conversations: list of vendors they've contacted
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

    const [{ data: unreadData }, { data: latestMsgs }] = await Promise.all([
      supabase.from('messages').select('vendor_id').eq('planner_id', plannerId).eq('sender_role', 'vendor').eq('is_read', false),
      supabase.from('messages').select('vendor_id, created_at').eq('planner_id', plannerId).order('created_at', { ascending: false }),
    ])

    const unreadVendorIds = new Set((unreadData || []).map(m => m.vendor_id))
    const latestMap = {}
    for (const msg of (latestMsgs || [])) {
      if (!latestMap[msg.vendor_id]) latestMap[msg.vendor_id] = msg.created_at
    }

    const seen = new Set()
    const result = []
    for (const inq of data) {
      if (!seen.has(inq.vendor_id)) {
        seen.add(inq.vendor_id)
        result.push({
          vendor_id: inq.vendor_id,
          vendor: inq.vendors,
          hasUnread: unreadVendorIds.has(inq.vendor_id),
          lastMessageAt: latestMap[inq.vendor_id] || inq.created_at,
        })
      }
    }
    result.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
    setThreads(result)
    setLoading(false)
  }

  return { threads, loading, refetch: fetchThreads }
}
