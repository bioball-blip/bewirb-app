import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type Profile = {
  id: string
  tenant_id: string
  role: 'owner' | 'editor' | 'viewer'
  location_id: string | null
}

type AuthContextValue = {
  session: Session | null
  loading: boolean
  // Profil (Rolle + Filiale) des eingeloggten Nutzers, null wenn nicht geladen.
  profile: Profile | null
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  loading: true,
  profile: null,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession)
      },
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  // Rolle + Filiale des eingeloggten Nutzers laden (und bei Logout leeren).
  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) {
      setProfile(null)
      return
    }

    let active = true
    supabase
      .from('users')
      .select('id, tenant_id, role, location_id')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (active) setProfile((data as Profile) ?? null)
      })

    return () => {
      active = false
    }
  }, [session?.user?.id])

  return (
    <AuthContext.Provider value={{ session, loading, profile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
