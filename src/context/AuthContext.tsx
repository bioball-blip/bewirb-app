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
  // Ist der eingeloggte Nutzer Plattform-Admin (Betreiber)?
  isPlatformAdmin: boolean
  // Wird das Profil / der Admin-Status gerade geladen?
  profileLoading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  loading: true,
  profile: null,
  isPlatformAdmin: false,
  profileLoading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)

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

  // Rolle + Filiale sowie Plattform-Admin-Status des eingeloggten Nutzers
  // laden (und bei Logout leeren).
  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) {
      setProfile(null)
      setIsPlatformAdmin(false)
      setProfileLoading(false)
      return
    }

    let active = true
    setProfileLoading(true)
    Promise.all([
      supabase
        .from('users')
        .select('id, tenant_id, role, location_id')
        .eq('id', userId)
        .maybeSingle(),
      supabase.rpc('is_platform_admin'),
    ]).then(([profileResult, adminResult]) => {
      if (!active) return
      setProfile((profileResult.data as Profile) ?? null)
      setIsPlatformAdmin(adminResult.data === true)
      setProfileLoading(false)
    })

    return () => {
      active = false
    }
  }, [session?.user?.id])

  return (
    <AuthContext.Provider
      value={{ session, loading, profile, isPlatformAdmin, profileLoading }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
