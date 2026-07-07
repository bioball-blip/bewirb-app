import { useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'

export function AccessRequestForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [tenantName, setTenantName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error } = await supabase.from('beta_requests').insert({
      name,
      email,
      tenant_name: tenantName,
    })

    setSubmitting(false)

    if (error) {
      setError('Deine Anfrage konnte nicht gesendet werden. Bitte versuche es später erneut.')
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="bg-white shadow-xl shadow-black/10 rounded-2xl p-8 w-full max-w-sm text-center flex flex-col items-center gap-3">
        <span className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-6 h-6"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
              clipRule="evenodd"
            />
          </svg>
        </span>
        <p className="text-gray-900 font-semibold">Danke für dein Interesse!</p>
        <p className="text-gray-500 text-sm leading-relaxed">
          Wir melden uns per E-Mail bei dir, sobald ein Platz in der
          Testphase frei ist, und schicken dir dann deinen Zugangscode.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-xl shadow-black/10 rounded-2xl p-8 w-full max-w-sm flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-gray-900">
          Zugang anfragen
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          Trag dich ein — wir melden uns per E-Mail mit deinem Zugangscode.
        </p>
      </div>

      <input
        type="text"
        placeholder="Dein Name"
        required
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-crewwerk focus:ring-2 focus:ring-crewwerk/15 transition-shadow"
      />
      <input
        type="email"
        placeholder="Deine E-Mail"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-crewwerk focus:ring-2 focus:ring-crewwerk/15 transition-shadow"
      />
      <input
        type="text"
        placeholder="Name deines Betriebs"
        required
        value={tenantName}
        onChange={(event) => setTenantName(event.target.value)}
        className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-crewwerk focus:ring-2 focus:ring-crewwerk/15 transition-shadow"
      />

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-crewwerk text-crewwerk-cream font-medium rounded-full px-4 py-3 hover:bg-crewwerk-light transition-colors disabled:opacity-50"
      >
        {submitting ? 'Wird gesendet…' : 'Zugang anfragen'}
      </button>
    </form>
  )
}
