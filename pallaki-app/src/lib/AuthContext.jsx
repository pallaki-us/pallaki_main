import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--cr)', zIndex: 9999, gap: '1rem',
    }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', color: 'var(--v)' }}>
        🪷
      </div>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid var(--br)', borderTopColor: 'var(--v)',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userType, setUserType] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchUserType(userId) {
    const { data: vendorRow } = await supabase
      .from('vendors')
      .select('id')
      .eq('profile_id', userId)
      .maybeSingle()
    setUserType(vendorRow ? 'vendor' : 'planner')
  }

  useEffect(() => {
    if (!supabase) { setLoading(false); return }

    // Safety net: always unblock after 4s in case something hangs
    const timeout = setTimeout(() => setLoading(false), 4000)

    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          // Stale / invalid token — clear it and start fresh
          supabase.auth.signOut()
          setUser(null)
          setUserType(null)
          setLoading(false)
          return
        }
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchUserType(session.user.id).finally(() => setLoading(false))
        } else {
          setLoading(false)
        }
      })
      .catch(() => {
        // Network or unexpected error — don't leave user stuck
        setUser(null)
        setUserType(null)
        setLoading(false)
      })
      .finally(() => clearTimeout(timeout))

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Stale token was rejected by Supabase — clear state
      if (_event === 'SIGNED_OUT') {
        setUser(null)
        setUserType(null)
        setLoading(false)
        return
      }

      if (_event === 'SIGNED_IN' && window.location.hash.includes('type=signup')) {
        window.history.replaceState(null, '', window.location.pathname)
        await supabase.auth.signOut()
        setUser(null)
        setUserType('__verified__')
        return
      }
      setUser(session?.user ?? null)
      if (session?.user) {
        // Google OAuth: create planner profile if none exists
        if (session.user.app_metadata?.provider === 'google') {
          const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || ''
          await supabase.from('profiles').upsert(
            { id: session.user.id, user_type: 'planner', name, email: session.user.email },
            { onConflict: 'id' }
          )
        }
        fetchUserType(session.user.id)
      } else {
        setUserType(null)
      }
    })

    return () => { subscription.unsubscribe(); clearTimeout(timeout) }
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
        emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
      },
    })
    if (error) return { error }

    if (data.session?.user) {
      await fetchUserType(data.session.user.id)
    }

    supabase.functions.invoke('send-notification-email', {
      body: {
        type: type === 'vendor' ? 'welcome_vendor' : 'welcome_planner',
        recipientEmail: email,
        recipientName: name,
      },
    })

    return { data, error: null }
  }

  async function signIn(email, password) {
    if (!supabase) {
      if (email === 'test@pallaki.com' && password === 'test123') {
        setUser({ email, user_metadata: { name: 'Ria' } })
        setUserType('planner')
        return { error: null, actualType: 'planner' }
      }
      if (email === 'vendor@pallaki.com' && password === 'test123') {
        setUser({ email, user_metadata: { name: 'KJF Artistry' } })
        setUserType('vendor')
        return { error: null, actualType: 'vendor' }
      }
      return { error: { message: 'Incorrect email or password.' }, actualType: null }
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error, actualType: null }

    const { data: vendorRow } = await supabase
      .from('vendors')
      .select('id')
      .eq('profile_id', data.user.id)
      .maybeSingle()
    const actualType = vendorRow ? 'vendor' : 'planner'
    setUserType(actualType)
    return { data, error: null, actualType }
  }

  async function signInWithGoogle() {
    if (!supabase) return { error: { message: 'Not available in demo' } }
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

  async function verifyOtp(email, token) {
    if (!supabase) return { error: { message: 'Not available in demo mode.' } }
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' })
    if (error) return { error }
    if (data.session?.user) await fetchUserType(data.session.user.id)
    return { data, error: null }
  }

  async function resetPassword(email) {
    if (!supabase) return { error: { message: 'Not available in demo mode.' } }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }

  return (
    <AuthContext.Provider value={{ user, userType, setUserType, loading, signUp, verifyOtp, signIn, signInWithGoogle, signOut, resetPassword }}>
      {loading ? <LoadingScreen /> : children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
