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
      setError(error.message)
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="bg-white shadow rounded-lg p-8 w-full max-w-sm text-center flex flex-col gap-2">
        <p className="text-gray-900 font-semibold">Danke für dein Interesse!</p>
        <p className="text-gray-500 text-sm">
          Wir melden uns per E-Mail bei dir, sobald ein Platz in der
          Testphase frei ist, und schicken dir dann deinen Zugangscode.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow rounded-lg p-8 w-full max-w-sm flex flex-col gap-4"
    >
      <h3 className="text-lg font-semibold text-gray-900">Zugang anfragen</h3>
      <p className="text-xs text-gray-500">
        Wir befinden uns aktuell in einer geschlossenen Testphase. Trag dich
        ein, wir melden uns per E-Mail mit deinem Zugangscode.
      </p>

      <input
        type="text"
        placeholder="Dein Name"
        required
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="border border-gray-300 rounded px-3 py-2"
      />
      <input
        type="email"
        placeholder="Deine E-Mail"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="border border-gray-300 rounded px-3 py-2"
      />
      <input
        type="text"
        placeholder="Name deines Betriebs"
        required
        value={tenantName}
        onChange={(event) => setTenantName(event.target.value)}
        className="border border-gray-300 rounded px-3 py-2"
      />

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-crewwerk text-crewwerk-cream rounded px-3 py-2 hover:bg-crewwerk-light disabled:opacity-50"
      >
        {submitting ? 'Wird gesendet…' : 'Zugang anfragen'}
      </button>
    </form>
  )
}
