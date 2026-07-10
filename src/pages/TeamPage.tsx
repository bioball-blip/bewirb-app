import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'
import { QrCodeButton } from '../components/QrCodeButton'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAuth } from '../context/AuthContext'

type Location = { id: string; name: string }
type Invitation = {
  id: string
  email: string
  role: 'editor' | 'viewer'
  location_id: string | null
  token: string
  accepted_at: string | null
}
type Member = {
  id: string
  email: string
  role: 'owner' | 'editor' | 'viewer'
  location_id: string | null
}

const roleLabels: Record<string, string> = {
  owner: 'Chef (Hauptzugang)',
  editor: 'Bearbeiten',
  viewer: 'Nur ansehen',
}

const inputClass =
  'border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-crewwerk focus:ring-2 focus:ring-crewwerk/15'

export function TeamPage() {
  useDocumentTitle('Filialen & Team')
  const { profile } = useAuth()

  const [locations, setLocations] = useState<Location[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLocationId, setInviteLocationId] = useState('')
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor')
  const [inviting, setInviting] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedLocId, setCopiedLocId] = useState<string | null>(null)

  const isOwner = profile?.role === 'owner'

  function applyLink(locationId: string) {
    return `${window.location.origin}/apply/${profile?.tenant_id}?loc=${locationId}`
  }

  async function copyApplyLink(locationId: string) {
    try {
      await navigator.clipboard.writeText(applyLink(locationId))
      setCopiedLocId(locationId)
      setTimeout(
        () => setCopiedLocId((c) => (c === locationId ? null : c)),
        2000,
      )
    } catch {
      setError('Kopieren nicht möglich – bitte den Link manuell markieren.')
    }
  }

  function locationName(id: string | null) {
    if (!id) return 'Ganzer Betrieb'
    return locations.find((l) => l.id === id)?.name ?? '—'
  }

  function joinLink(token: string) {
    return `${window.location.origin}/register?token=${token}`
  }

  useEffect(() => {
    async function load() {
      const [locationsResult, invitationsResult, membersResult] =
        await Promise.all([
          supabase.from('locations').select('id, name').order('name'),
          supabase
            .from('invitations')
            .select('id, email, role, location_id, token, accepted_at')
            .order('created_at', { ascending: false }),
          supabase.from('users').select('id, email, role, location_id'),
        ])

      if (locationsResult.error) setError('Die Filialen konnten nicht geladen werden.')
      else setLocations(locationsResult.data ?? [])
      if (!invitationsResult.error) setInvitations(invitationsResult.data ?? [])
      if (!membersResult.error) setMembers(membersResult.data ?? [])

      setLoading(false)
    }

    load()
  }, [])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    if (!profile) return
    setError(null)
    setCreating(true)

    const { data, error } = await supabase
      .from('locations')
      .insert({ tenant_id: profile.tenant_id, name: newName.trim() })
      .select('id, name')
      .single()

    setCreating(false)
    if (error || !data) {
      setError('Die Filiale konnte nicht angelegt werden. Bitte versuche es erneut.')
      return
    }
    setLocations((prev) =>
      [...prev, data].sort((a, b) => a.name.localeCompare(b.name)),
    )
    setNewName('')
  }

  async function handleRename(id: string) {
    const name = editingName.trim()
    if (!name) return
    setError(null)
    const { error } = await supabase.from('locations').update({ name }).eq('id', id)
    if (error) {
      setError('Die Filiale konnte nicht umbenannt werden.')
      return
    }
    setLocations((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, name } : l))
        .sort((a, b) => a.name.localeCompare(b.name)),
    )
    setEditingId(null)
    setEditingName('')
  }

  async function handleDeleteLocation(location: Location) {
    const confirmed = window.confirm(
      `Filiale "${location.name}" wirklich löschen? Zugänge und Bewerbungen ` +
        `dieser Filiale verlieren dann ihre Filial-Zuordnung (sie werden nicht gelöscht).`,
    )
    if (!confirmed) return
    setError(null)
    const { error } = await supabase.from('locations').delete().eq('id', location.id)
    if (error) {
      setError('Die Filiale konnte nicht gelöscht werden.')
      return
    }
    setLocations((prev) => prev.filter((l) => l.id !== location.id))
  }

  async function handleInvite(event: FormEvent) {
    event.preventDefault()
    if (!profile) return
    setError(null)
    setInviting(true)

    const { data, error } = await supabase
      .from('invitations')
      .insert({
        tenant_id: profile.tenant_id,
        email: inviteEmail.trim(),
        location_id: inviteLocationId || null,
        role: inviteRole,
      })
      .select('id, email, role, location_id, token, accepted_at')
      .single()

    setInviting(false)
    if (error || !data) {
      setError('Die Einladung konnte nicht erstellt werden. Bitte versuche es erneut.')
      return
    }
    setInvitations((prev) => [data, ...prev])
    setInviteEmail('')
    setInviteLocationId('')
    setInviteRole('editor')
  }

  async function handleRevoke(id: string) {
    setError(null)
    const { error } = await supabase.from('invitations').delete().eq('id', id)
    if (error) {
      setError('Die Einladung konnte nicht zurückgezogen werden.')
      return
    }
    setInvitations((prev) => prev.filter((i) => i.id !== id))
  }

  async function copyLink(invitation: Invitation) {
    try {
      await navigator.clipboard.writeText(joinLink(invitation.token))
      setCopiedId(invitation.id)
      setTimeout(() => setCopiedId((c) => (c === invitation.id ? null : c)), 2000)
    } catch {
      setError('Kopieren nicht möglich – bitte den Link manuell markieren.')
    }
  }

  const pendingInvitations = invitations.filter((i) => !i.accepted_at)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-crewwerk px-4 py-4 flex justify-between items-center">
        <Logo size="sm" align="left" variant="light" linkTo="/dashboard" />
        <Link to="/dashboard" className="text-sm text-crewwerk-cream underline">
          Zurück zum Dashboard
        </Link>
      </div>

      <div className="max-w-3xl mx-auto flex flex-col gap-6 px-4 py-8">
        <h1 className="text-2xl font-semibold text-crewwerk">Filialen & Team</h1>

        {profile && !isOwner && (
          <p className="text-gray-600 bg-white rounded-lg shadow p-4 text-sm">
            Nur der Hauptzugang kann Filialen und Zugänge verwalten.
          </p>
        )}

        {isOwner && (
          <>
            {error && <p className="text-red-600 text-sm">{error}</p>}

            {/* --- Filialen --- */}
            <section className="bg-white rounded-lg shadow p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-semibold text-gray-900">Filialen</h2>
                <p className="text-xs text-gray-500">
                  Lege deine Standorte an. Zugänge und Bewerbungen kannst du
                  Filialen zuordnen.
                </p>
              </div>

              <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="Name der Filiale, z. B. Hamburg Innenstadt"
                  className={`flex-1 ${inputClass}`}
                />
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-crewwerk text-crewwerk-cream rounded px-4 py-2 text-sm hover:bg-crewwerk-light disabled:opacity-50"
                >
                  {creating ? 'Wird angelegt…' : 'Filiale anlegen'}
                </button>
              </form>

              {loading ? (
                <p className="text-sm text-gray-400">Lädt…</p>
              ) : locations.length === 0 ? (
                <p className="text-sm text-gray-400">Noch keine Filialen angelegt.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-gray-100">
                  {locations.map((location) => (
                    <li key={location.id} className="py-2 flex flex-col gap-2">
                      {editingId === location.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                            className={`flex-1 ${inputClass}`}
                          />
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => handleRename(location.id)}
                              className="text-xs font-medium text-crewwerk hover:underline"
                            >
                              Speichern
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null)
                                setEditingName('')
                              }}
                              className="text-xs text-gray-500 hover:underline"
                            >
                              Abbrechen
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-gray-800">
                              {location.name}
                            </span>
                            <div className="flex gap-3 shrink-0">
                              <button
                                onClick={() => {
                                  setEditingId(location.id)
                                  setEditingName(location.name)
                                }}
                                className="text-xs font-medium text-crewwerk hover:underline"
                              >
                                Umbenennen
                              </button>
                              <button
                                onClick={() => handleDeleteLocation(location)}
                                className="text-xs text-red-600 hover:underline"
                              >
                                Löschen
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              readOnly
                              value={applyLink(location.id)}
                              className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs font-mono text-gray-500 bg-gray-50"
                            />
                            <button
                              onClick={() => copyApplyLink(location.id)}
                              className="text-xs font-medium text-crewwerk hover:underline shrink-0"
                            >
                              {copiedLocId === location.id
                                ? 'Kopiert!'
                                : 'Bewerbungslink'}
                            </button>
                            <QrCodeButton
                              url={applyLink(location.id)}
                              subtitle={location.name}
                            />
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* --- Zugänge einladen --- */}
            <section className="bg-white rounded-lg shadow p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-semibold text-gray-900">
                  Zugänge einladen
                </h2>
                <p className="text-xs text-gray-500">
                  Lade Mitarbeiter:innen ein und weise ihnen eine Filiale sowie
                  „Bearbeiten" oder „Nur ansehen" zu. Teile den erzeugten
                  Einladungslink mit der Person – sie setzt ein eigenes Passwort.
                </p>
              </div>

              <form onSubmit={handleInvite} className="flex flex-col gap-2">
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="E-Mail der Person"
                  className={inputClass}
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    required
                    value={inviteLocationId}
                    onChange={(event) => setInviteLocationId(event.target.value)}
                    className={`flex-1 ${inputClass}`}
                  >
                    <option value="">Filiale wählen…</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={inviteRole}
                    onChange={(event) =>
                      setInviteRole(event.target.value as 'editor' | 'viewer')
                    }
                    className={`flex-1 ${inputClass}`}
                  >
                    <option value="editor">Bearbeiten</option>
                    <option value="viewer">Nur ansehen</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={inviting || locations.length === 0}
                  className="self-start bg-crewwerk text-crewwerk-cream rounded px-4 py-2 text-sm hover:bg-crewwerk-light disabled:opacity-50"
                >
                  {inviting ? 'Wird erstellt…' : 'Einladung erstellen'}
                </button>
                {locations.length === 0 && (
                  <p className="text-xs text-gray-400">
                    Lege zuerst eine Filiale an, bevor du Zugänge einlädst.
                  </p>
                )}
              </form>

              {pendingInvitations.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Offene Einladungen
                  </h3>
                  <ul className="flex flex-col divide-y divide-gray-100">
                    {pendingInvitations.map((inv) => (
                      <li key={inv.id} className="flex flex-col gap-1 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-gray-800">
                            {inv.email}
                          </span>
                          <span className="text-xs text-gray-500">
                            {locationName(inv.location_id)} ·{' '}
                            {roleLabels[inv.role]}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            readOnly
                            value={joinLink(inv.token)}
                            className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs font-mono text-gray-500 bg-gray-50"
                          />
                          <button
                            onClick={() => copyLink(inv)}
                            className="text-xs font-medium text-crewwerk hover:underline shrink-0"
                          >
                            {copiedId === inv.id ? 'Kopiert!' : 'Link kopieren'}
                          </button>
                          <button
                            onClick={() => handleRevoke(inv.id)}
                            className="text-xs text-red-600 hover:underline shrink-0"
                          >
                            Zurückziehen
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* --- Team --- */}
            <section className="bg-white rounded-lg shadow p-4 flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-gray-900">Team</h2>
              {members.length === 0 ? (
                <p className="text-sm text-gray-400">Noch keine Zugänge.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-gray-100">
                  {members.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center justify-between gap-2 py-2"
                    >
                      <span className="text-sm text-gray-800">{m.email}</span>
                      <span className="text-xs text-gray-500">
                        {m.role === 'owner'
                          ? roleLabels.owner
                          : `${locationName(m.location_id)} · ${roleLabels[m.role]}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
