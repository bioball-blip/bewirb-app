import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { translateAuthError } from '../lib/authErrors'
import { Logo } from '../components/Logo'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setSubmitting(false)

    if (error) {
      setError(translateAuthError(error.message))
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 gap-6">
      <Logo withTagline />
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow rounded-lg p-8 w-full max-w-sm flex flex-col gap-4"
      >
        <h1 className="text-2xl font-semibold text-gray-900">Login</h1>

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
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-crewwerk text-crewwerk-cream rounded px-3 py-2 hover:bg-crewwerk-light disabled:opacity-50"
        >
          {submitting ? 'Wird geprüft…' : 'Login'}
        </button>

        <p className="text-sm text-gray-500 text-center">
          Noch kein Konto?{' '}
          <Link to="/register" className="text-crewwerk underline">
            Registrieren
          </Link>
        </p>
      </form>
    </div>
  )
}
