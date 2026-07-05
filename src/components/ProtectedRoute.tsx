import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return <p className="text-center mt-20 text-gray-400">Lädt…</p>
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
