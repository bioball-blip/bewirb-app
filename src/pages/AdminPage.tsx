import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAuth } from '../context/AuthContext'

type Company = {
  id: string
  name: string
  seat_limit: number
  used: number
}

const inputClass =
  'border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-crewwerk focus:ring-2 focus:ring-crewwerk/15'

export function AdminPage() {
  useDocumentTitle('Betreiber-Verwaltung')
  const { profileLoading, isPlatformAdmin } = useAuth()
  const navigate = useNavigate()

  const [companyName, setCompanyName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [seatLimit, setSeatLimit] = useState('1')
  const [locationsText, setLocationsText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ joinLink: string; company: string } | null>(
    null,
  )

  const [companies, setCompanies] = useState<Company[]>([])
  const [editSeatsId, setEditSeatsId] = useState<string | null>(null)
  const [editSeatsValue, setEditSeatsValue] = useState('')

  async function loadCompanies() {
    const { data } = await supabase.functions.invoke('admin-companies', {
      body: { action: 'list' },
    })
    if (data?.ok) setCompanies(data.companies as Company[])
  }

  useEffect(() => {
    if (isPlatformAdmin) loadCompanies()
  }, [isPlatformAdmin])

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
      {
        body: {
          companyName,
          ownerEmail,
          seatLimit: Number(seatLimit) || 1,
          locations,
        },
      },
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
    setSeatLimit('1')
    setLocationsText('')
    loadCompanies()
  }

  async function handleSaveSeats(company: Company) {
    const seat_limit = Number(editSeatsValue)
    if (!seat_limit || seat_limit < 1) return

    const { data, error } = await supabase.functions.invoke('admin-companies', {
      body: { action: 'set_seats', tenant_id: company.id, seat_limit },
    })

    if (error || !data?.ok) {
      setError('Das Kontingent konnte nicht geändert werden.')
      return
    }

    setCompanies((prev) =>
      prev.map((c) => (c.id === company.id ? { ...c, seat_limit } : c)),
    )
    setEditSeatsId(null)
    setEditSeatsValue('')
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

        {/* Onboarding */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow p-4 flex flex-col gap-4"
        >
          <h2 className="text-sm font-semibold text-gray-900">Neue Firma anlegen</h2>

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

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex flex-col gap-1 flex-1">
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
            <div className="flex flex-col gap-1 w-full sm:w-40">
              <label className="text-xs text-gray-500">
                Zugänge (inkl. Inhaber)
              </label>
              <input
                type="number"
                min={1}
                required
                value={seatLimit}
                onChange={(event) => setSeatLimit(event.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">
              Filialen (optional, eine pro Zeile)
            </label>
            <textarea
              rows={3}
              value={locationsText}
              onChange={(event) => setLocationsText(event.target.value)}
              placeholder={'Hamburg Innenstadt\nMünchen Zentrum'}
              className={`${inputClass} resize-none`}
            />
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

        {/* Firmen-Übersicht */}
        <section className="bg-white rounded-lg shadow p-4 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-gray-900">Firmen</h2>
          {companies.length === 0 ? (
            <p className="text-sm text-gray-400">Noch keine Firmen.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-gray-100">
              {companies.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-2 py-2"
                >
                  <span className="text-sm text-gray-800">{c.name}</span>
                  {editSeatsId === c.id ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number"
                        min={1}
                        value={editSeatsValue}
                        onChange={(event) => setEditSeatsValue(event.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-20"
                      />
                      <button
                        onClick={() => handleSaveSeats(c)}
                        className="text-xs font-medium text-crewwerk hover:underline"
                      >
                        Speichern
                      </button>
                      <button
                        onClick={() => setEditSeatsId(null)}
                        className="text-xs text-gray-500 hover:underline"
                      >
                        Abbrechen
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-gray-500">
                        {c.used} / {c.seat_limit} Zugänge belegt
                      </span>
                      <button
                        onClick={() => {
                          setEditSeatsId(c.id)
                          setEditSeatsValue(String(c.seat_limit))
                        }}
                        className="text-xs font-medium text-crewwerk hover:underline"
                      >
                        Kontingent ändern
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
