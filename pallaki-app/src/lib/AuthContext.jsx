import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userType, setUserType] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch user_type from profiles table
  async function fetchProfile(userId) {
    if (!supabase) return
    const { data } = await supabase
      .from('profiles')
      .select('user_type, name')
      .eq('id', userId)
      .single()
    if (data) setUserType(data.user_type)
  }

  useEffect(() => {
    if (!supabase) { setLoading(false); return }

    // Get existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setUserType(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signUp(email, password, type, name) {
    if (!supabase) {
      // demo mode fallback
      setUser({ email, user_metadata: { name, user_type: type } })
      setUserType(type)
      return { error: null }
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, user_type: type } },
    })
    if (!error) setUserType(type)
    return { data, error }
  }

  async function signIn(email, password) {
    if (!supabase) {
      // demo credentials
      if (email === 'test@pallaki.com' && password === 'test123') {
        setUser({ email, user_metadata: { name: 'Ria' } })
        setUserType('planner')
        return { error: null }
      }
      if (email === 'vendor@pallaki.com' && password === 'test123') {
        setUser({ email, user_metadata: { name: 'KJF Artistry' } })
        setUserType('vendor')
        return { error: null }
      }
      return { error: { message: 'Incorrect email or password.' } }
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error && data.user) await fetchProfile(data.user.id)
    return { data, error }
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut()
    setUser(null)
    setUserType(null)
  }

  return (
    <AuthContext.Provider value={{ user, userType, setUserType, loading, signUp, signIn, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
