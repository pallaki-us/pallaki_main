import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userType, setUserType] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch user_type from profiles table, fall back to user_metadata
  async function fetchProfile(userId, userMeta) {
    if (!supabase) return
    const { data } = await supabase
      .from('profiles')
      .select('user_type, name')
      .eq('id', userId)
      .single()
    if (data?.user_type) {
      setUserType(data.user_type)
    } else if (userMeta?.user_type) {
      // fallback to metadata set at signup
      setUserType(userMeta.user_type)
    }
  }

  useEffect(() => {
    if (!supabase) { setLoading(false); return }

    // Get existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id, session.user.user_metadata)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (_event === 'SIGNED_IN' && window.location.hash.includes('type=signup')) {
        // Email just verified — sign them out so they must log in manually
        window.history.replaceState(null, '', window.location.pathname)
        await supabase.auth.signOut()
        setUser(null)
        setUserType('__verified__') // signal to App to show sign-in modal
        return
      }
      setUser(session?.user ?? null)
      if (session?.user) {
        const provider = session.user.app_metadata?.provider
        if (provider === 'google') {
          const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', session.user.id).single()
          const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || ''
          await supabase.from('profiles').upsert({
            id: session.user.id,
            user_type: profile?.user_type || 'planner',
            name: profile?.name || name,
            email: session.user.email,
          })
          setUserType(profile?.user_type || 'planner')
        } else {
          fetchProfile(session.user.id, session.user.user_metadata)
        }
      } else {
        setUserType(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signUp(email, password, type, name) {
    if (!supabase) {
      setUser({ email, user_metadata: { name, user_type: type } })
      setUserType(type)
      return { error: null }
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, user_type: type },
        emailRedirectTo: `${window.location.origin}`,
      },
    })
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
    if (!error && data.user) await fetchProfile(data.user.id, data.user.user_metadata)
    return { data, error }
  }

  async function signInWithGoogle() {
    if (!supabase) return { error: { message: 'Not available in demo' } }
    sessionStorage.setItem('pallaki_oauth_type', 'planner')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + (import.meta.env.VITE_BASE_PATH || '/') },
    })
    return { error }
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut()
    setUser(null)
    setUserType(null)
  }

  return (
    <AuthContext.Provider value={{ user, userType, setUserType, loading, signUp, signIn, signInWithGoogle, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
