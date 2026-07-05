import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const statusLabels: Record<string, string> = {
  eingegangen: 'Eingegangen',
  gelesen: 'Gelesen',
  eingeladen: 'Eingeladen',
  angenommen: 'Angenommen',
  abgelehnt: 'Abgelehnt',
}

type StatusResult = {
  applicant_name: string
  status: string
  updated_at: string
}

export function ApplicationStatusPage() {
  const { token } = useParams()
  const [result, setResult] = useState<StatusResult | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return

    supabase
      .rpc('get_application_status', { p_token: token })
      .then(({ data, error }) => {
        setLoading(false)

        if (error) {
          setError(error.message)
          return
        }

        if (!data || data.length === 0) {
          setNotFound(true)
          return
        }

        setResult(data[0])
      })
  }, [token])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white shadow rounded-lg p-8 w-full max-w-sm text-center flex flex-col gap-3">
        <h1 className="text-xl font-semibold text-gray-900">
          Status deiner Bewerbung
        </h1>

        {loading && <p className="text-gray-400">Lädt…</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {!loading && notFound && (
          <p className="text-gray-500">
            Zu diesem Link wurde keine Bewerbung gefunden.
          </p>
        )}
        {result && (
          <>
            <p className="text-gray-500">Hallo {result.applicant_name},</p>
            <p className="text-2xl font-semibold text-gray-900">
              {statusLabels[result.status] ?? result.status}
            </p>
            <p className="text-xs text-gray-400">
              Zuletzt aktualisiert am{' '}
              {new Date(result.updated_at).toLocaleDateString('de-DE')}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
