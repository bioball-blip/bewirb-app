import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAuth } from '../context/AuthContext'

const inputClass =
  'border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-crewwerk focus:ring-2 focus:ring-crewwerk/15'

export function AdminPage() {
  useDocumentTitle('Betreiber-Verwaltung')
  const { profileLoading, isPlatformAdmin } = useAuth()
  const navigate = useNavigate()

  const [companyName, setCompanyName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [locationsText, setLocationsText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ joinLink: string; company: string } | null>(
    null,
  )

  if (profileLoading) {
    return <p className="text-center mt-20 text-gray-400">Lädt…</p>
  }

  // Nur Plattform-Admins; alle anderen zurück ins normale Dashboard.
  if (!isPlatformAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setResult(null)
    setSubmitting(true)

    const locations = locationsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    const { data, error } = await supabase.functions.invoke(
      'admin-create-company',
      { body: { companyName, ownerEmail, locations } },
    )

    setSubmitting(false)

    if (error || !data?.ok) {
      setError(
        'Die Firma konnte nicht angelegt werden. Bitte Eingaben prüfen und erneut versuchen.',
      )
      return
    }

    setResult({
      joinLink: `${window.location.origin}/register?token=${data.token}`,
      company: companyName,
    })
    setCompanyName('')
    setOwnerEmail('')
    setLocationsText('')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-crewwerk px-4 py-4 flex justify-between items-center">
        <Logo size="sm" align="left" variant="light" />
        <button
          onClick={handleLogout}
          className="text-sm text-crewwerk-cream underline"
        >
          Logout
        </button>
      </div>

      <div className="max-w-2xl mx-auto flex flex-col gap-6 px-4 py-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-crewwerk">
            Betreiber-Verwaltung
          </h1>
          <p className="text-sm text-gray-500">
            Neue Firma anlegen und den Inhaber per E-Mail einladen. Der Inhaber
            verwaltet danach Filialen und Zugänge selbst.
          </p>
        </div>

        {result && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex flex-col gap-2">
            <p className="text-sm text-emerald-800 font-medium">
              „{result.company}" wurde angelegt und der Inhaber per E-Mail
              eingeladen. ✅
            </p>
            <p className="text-xs text-emerald-700">
              Falls die E-Mail nicht ankommt, kannst du dem Inhaber diesen
              Einladungslink direkt geben:
            </p>
            <input
              readOnly
              value={result.joinLink}
              className="border border-emerald-200 rounded px-2 py-1 text-xs font-mono text-emerald-800 bg-white"
            />
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow p-4 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Firmenname</label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="z. B. Muster Hotel GmbH"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">E-Mail des Inhabers</label>
            <input
              type="email"
              required
              value={ownerEmail}
              onChange={(event) => setOwnerEmail(event.target.value)}
              placeholder="inhaber@firma.de"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">
              Filialen (optional, eine pro Zeile)
            </label>
            <textarea
              rows={4}
              value={locationsText}
              onChange={(event) => setLocationsText(event.target.value)}
              placeholder={'Hamburg Innenstadt\nMünchen Zentrum'}
              className={`${inputClass} resize-none`}
            />
            <p className="text-xs text-gray-400">
              Der Inhaber kann Filialen später auch selbst anlegen.
            </p>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="self-start bg-crewwerk text-crewwerk-cream rounded px-4 py-2 text-sm hover:bg-crewwerk-light disabled:opacity-50"
          >
            {submitting ? 'Wird angelegt…' : 'Firma anlegen & Inhaber einladen'}
          </button>
        </form>
      </div>
    </div>
  )
}
