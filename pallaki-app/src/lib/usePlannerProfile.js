import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { useAuth } from './AuthContext'

export function usePlannerProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user || !supabase) { setLoading(false); return }
    fetchProfile()
  }, [user])

  async function fetchProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setProfile(data || null)
    setLoading(false)
  }

  async function saveProfile(fields) {
    if (!user || !supabase) return { error: null }
    setSaving(true)
    const result = await supabase
      .from('profiles')
      .update(fields)
      .eq('id', user.id)
    if (!result.error) await fetchProfile()
    setSaving(false)
    return result
  }

  return { profile, loading, saving, saveProfile }
}
