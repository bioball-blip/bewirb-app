import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { translateAuthError } from '../lib/authErrors'
import { Logo } from '../components/Logo'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

type InvitationInfo = {
  email: string
  role: 'editor' | 'viewer'
  tenant_name: string
  location_name: string | null
}

const roleLabels: Record<string, string> = {
  owner: 'Inhaber',
  editor: 'Bearbeiten',
  viewer: 'Nur ansehen',
}

export function RegisterPage() {
  useDocumentTitle('Registrieren')

  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('token')

  const [tenantName, setTenantName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Einladungs-Modus: gültigen Token laden.
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null)
  const [inviteChecked, setInviteChecked] = useState(!inviteToken)
  const navigate = useNavigate()

  useEffect(() => {
    if (!inviteToken) return
    supabase
      .rpc('get_invitation', { p_token: inviteToken })
      .then(({ data }) => {
        const inv = (data as InvitationInfo[] | null)?.[0] ?? null
        setInvitation(inv)
        if (inv) setEmail(inv.email)
        setInviteChecked(true)
      })
  }, [inviteToken])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)

    // Bei Einladung nur den Token mitschicken, sonst Betrieb + Einladungscode.
    const metadata = invitation
      ? { invite_token: inviteToken }
      : { tenant_name: tenantName, invite_code: inviteCode }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
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

  // Einladungslink vorhanden, aber (noch) ungültig/geladen.
  if (inviteToken && inviteChecked && !invitation) {
    return (
      <div className="min-h-screen bg-crewwerk flex flex-col items-center justify-center px-4 gap-6">
        <Logo withTagline variant="light" />
        <div className="bg-white shadow rounded-lg p-8 w-full max-w-sm text-center">
          <p className="text-gray-900 font-semibold">Einladung ungültig</p>
          <p className="text-gray-500 text-sm mt-2">
            Dieser Einladungslink ist ungültig oder wurde bereits verwendet.
            Bitte den Betrieb um eine neue Einladung.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-crewwerk flex flex-col items-center justify-center px-4 gap-6">
      <Logo withTagline variant="light" />
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow rounded-lg p-8 w-full max-w-sm flex flex-col gap-4"
      >
        <h1 className="text-2xl font-semibold text-gray-900">
          {invitation ? 'Zugang aktivieren' : 'Registrieren'}
        </h1>

        {invitation && (
          <div className="text-sm text-gray-600 bg-crewwerk-cream/40 rounded p-3">
            Du wurdest zu <strong>{invitation.tenant_name}</strong> eingeladen
            {invitation.location_name && (
              <> für die Filiale <strong>{invitation.location_name}</strong></>
            )}{' '}
            als <strong>{roleLabels[invitation.role] ?? invitation.role}</strong>.
            Wähle ein Passwort, um deinen Zugang zu aktivieren.
          </div>
        )}

        {!invitation && (
          <input
            type="text"
            placeholder="Name deines Betriebs"
            required
            value={tenantName}
            onChange={(event) => setTenantName(event.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          />
        )}

        <input
          type="email"
          placeholder="E-Mail"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          readOnly={!!invitation}
          className={
            'border border-gray-300 rounded px-3 py-2' +
            (invitation ? ' bg-gray-100 text-gray-500' : '')
          }
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

        {!invitation && (
          <input
            type="text"
            placeholder="Einladungscode"
            required
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          />
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {info && <p className="text-green-600 text-sm">{info}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-crewwerk text-crewwerk-cream rounded px-3 py-2 hover:bg-crewwerk-light disabled:opacity-50"
        >
          {submitting
            ? 'Wird erstellt…'
            : invitation
              ? 'Zugang aktivieren'
              : 'Konto erstellen'}
        </button>

        {!invitation && (
          <p className="text-sm text-gray-500 text-center">
            Schon registriert?{' '}
            <Link to="/login" className="text-crewwerk underline">
              Login
            </Link>
          </p>
        )}
      </form>
    </div>
  )
}
