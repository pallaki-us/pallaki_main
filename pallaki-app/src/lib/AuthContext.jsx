import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userType, setUserType] = useState(null) // 'planner' | 'vendor'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password, type, name) => {
    if (!supabase) {
      // demo mode
      setUser({ email, user_metadata: { name } })
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

  const signIn = async (email, password) => {
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
    return { data, error }
  }

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut()
    setUser(null)
    setUserType(null)
  }

  return (
    <AuthContext.Provider value={{ user, userType, setUserType, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
