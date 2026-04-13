import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { useAuth } from './AuthContext'

export function useVendorProfile() {
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
      .from('vendors')
      .select('*')
      .eq('profile_id', user.id)
      .single()
    setProfile(data || null)
    setLoading(false)
  }

  async function saveProfile(fields) {
    if (!user || !supabase) { return { error: null } }
    setSaving(true)

    const result = await supabase
      .from('vendors')
      .upsert({ ...fields, profile_id: user.id }, { onConflict: 'profile_id' })

    if (result.error) {
      console.error('[saveProfile] upsert failed', result.error)
    } else {
      await fetchProfile()
    }
    setSaving(false)
    return result
  }

  return { profile, loading, saving, saveProfile, fetchProfile }
}
