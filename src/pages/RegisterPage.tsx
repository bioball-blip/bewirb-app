import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { translateAuthError } from '../lib/authErrors'
import { Logo } from '../components/Logo'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function RegisterPage() {
  useDocumentTitle('Registrieren')

  const [tenantName, setTenantName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { tenant_name: tenantName } },
    })

    setSubmitting(false)

    if (error) {
      setError(translateAuthError(error.message))
      return
    }

    if (data.session) {
      navigate('/dashboard')
    } else {
      setInfo(
        'Registrierung erfolgreich. Bitte bestätige deine E-Mail-Adresse über den Link, den wir dir geschickt haben, und logge dich danach ein.',
      )
    }
  }

  return (
    <div className="min-h-screen bg-crewwerk flex flex-col items-center justify-center px-4 gap-6">
      <Logo withTagline variant="light" />
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow rounded-lg p-8 w-full max-w-sm flex flex-col gap-4"
      >
        <h1 className="text-2xl font-semibold text-gray-900">Registrieren</h1>

        <input
          type="text"
          placeholder="Name deines Betriebs"
          required
          value={tenantName}
          onChange={(event) => setTenantName(event.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        />
        <input
          type="email"
          placeholder="E-Mail"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        />
        <input
          type="password"
          placeholder="Passwort"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {info && <p className="text-green-600 text-sm">{info}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-crewwerk text-crewwerk-cream rounded px-3 py-2 hover:bg-crewwerk-light disabled:opacity-50"
        >
          {submitting ? 'Wird erstellt…' : 'Konto erstellen'}
        </button>

        <p className="text-sm text-gray-500 text-center">
          Schon registriert?{' '}
          <Link to="/login" className="text-crewwerk underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  )
}
