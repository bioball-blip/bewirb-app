import { Fragment, useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'
import { FeedbackButton } from '../components/FeedbackButton'
import { QrCodeButton } from '../components/QrCodeButton'
import { downloadApplicationPdf } from '../lib/applicationPdf'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAuth } from '../context/AuthContext'

type Application = {
  id: string
  applicant_name: string
  applicant_email: string
  status: string
  created_at: string
  updated_at: string
  phone: string | null
  desired_position: string | null
  location: string | null
  location_id: string | null
  available_from: string | null
  salary_expectation: string | null
  desired_working_time: string | null
  work_experience: string | null
  education: string | null
  languages: string | null
  applicant_message: string | null
  job_postings: { title: string } | null
}

type LocationOption = { id: string; name: string }

const workingTimeLabels: Record<string, string> = {
  vollzeit: 'Vollzeit',
  teilzeit: 'Teilzeit',
  aushilfe: 'Aushilfe',
  egal: 'Egal',
}

function daysUntilSixMonthsAfter(dateString: string): number {
  const changed = new Date(dateString)
  const threshold = new Date(changed)
  threshold.setMonth(threshold.getMonth() + 6)
  const diffMs = threshold.getTime() - Date.now()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

type OpenJobPosting = {
  id: string
  title: string
  employment_type: string | null
  location: string | null
}

const statusLabels: Record<string, string> = {
  eingegangen: 'Eingegangen',
  gelesen: 'Gelesen',
  eingeladen: 'Eingeladen',
  angenommen: 'Angenommen',
  abgelehnt: 'Abgelehnt',
}

const statusOptions = Object.keys(statusLabels)

const statusStyles: Record<string, string> = {
  eingegangen: 'bg-gray-100 text-gray-600',
  gelesen: 'bg-sky-50 text-sky-700',
  eingeladen: 'bg-amber-50 text-amber-700',
  angenommen: 'bg-emerald-50 text-emerald-700',
  abgelehnt: 'bg-red-50 text-red-600',
}

const employmentTypeLabels: Record<string, string> = {
  vollzeit: 'Vollzeit',
  teilzeit: 'Teilzeit',
  aushilfe: 'Aushilfe',
  ausbildung: 'Ausbildung',
}

function DetailItem({
  label,
  value,
  wide = false,
}: {
  label: string
  value: string | null
  wide?: boolean
}) {
  if (!value) return null
  return (
    <div className={'flex flex-col gap-0.5 ' + (wide ? 'sm:col-span-2' : '')}>
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-sm text-gray-800 whitespace-pre-wrap">
        {value}
      </span>
    </div>
  )
}

function ApplicationDetails({
  application,
  tenantName,
}: {
  application: Application
  tenantName: string | null
}) {
  const workingTime = application.desired_working_time
    ? (workingTimeLabels[application.desired_working_time] ??
      application.desired_working_time)
    : null

  const pdfButton = (
    <button
      onClick={() => downloadApplicationPdf(application, tenantName)}
      className="self-start text-xs font-medium text-crewwerk border border-crewwerk/30 rounded-full px-3 py-1.5 hover:bg-crewwerk-cream/50"
    >
      Als PDF herunterladen
    </button>
  )

  const hasAny =
    application.phone ||
    application.desired_position ||
    application.location ||
    application.available_from ||
    application.salary_expectation ||
    (workingTime && application.desired_working_time !== 'egal') ||
    application.work_experience ||
    application.education ||
    application.languages ||
    application.applicant_message

  if (!hasAny) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-400">
          Keine weiteren Angaben. E-Mail: {application.applicant_email}
        </p>
        {pdfButton}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid sm:grid-cols-2 gap-4">
      <DetailItem label="Telefon" value={application.phone} />
      <DetailItem label="Stelle / Position" value={application.desired_position} />
      <DetailItem label="Verfügbar ab" value={application.available_from} />
      <DetailItem
        label="Gehaltsvorstellung"
        value={application.salary_expectation}
      />
      <DetailItem label="Wohnort" value={application.location} />
      <DetailItem
        label="Gewünschte Arbeitszeit"
        value={
          application.desired_working_time &&
          application.desired_working_time !== 'egal'
            ? workingTime
            : null
        }
      />
      <DetailItem label="Sprachkenntnisse" value={application.languages} wide />
      <DetailItem
        label="Berufserfahrung / Werdegang"
        value={application.work_experience}
        wide
      />
      <DetailItem
        label="Ausbildung & Abschlüsse"
        value={application.education}
        wide
      />
      <DetailItem
        label="Bewerbungsschreiben"
        value={application.applicant_message}
        wide
      />
      </div>
      {pdfButton}
    </div>
  )
}

export function DashboardPage() {
  useDocumentTitle('Dashboard')
  const { profile, isPlatformAdmin, profileLoading } = useAuth()

  const [tenantId, setTenantId] = useState<string | null>(null)
  const [tenantName, setTenantName] = useState<string | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [openJobPostings, setOpenJobPostings] = useState<OpenJobPosting[]>([])
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [locationFilter, setLocationFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Rollen: Chef & Filialleiter dürfen bearbeiten, "Nur ansehen" nicht.
  const canEdit = profile?.role === 'owner' || profile?.role === 'editor'
  const isOwner = profile?.role === 'owner'

  function locationName(id: string | null) {
    if (!id) return '—'
    return locations.find((l) => l.id === id)?.name ?? '—'
  }

  // Chef kann nach Filiale filtern; Filial-Zugänge sehen ohnehin nur die eigene.
  const visibleApplications = locationFilter
    ? applications.filter((a) => a.location_id === locationFilter)
    : applications

  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      const [
        tenantResult,
        applicationsResult,
        openJobPostingsResult,
        locationsResult,
      ] = await Promise.all([
        supabase.from('tenants').select('id, name').single(),
        supabase
          .from('applications')
          .select(
            'id, applicant_name, applicant_email, status, created_at, updated_at, phone, desired_position, location, location_id, available_from, salary_expectation, desired_working_time, work_experience, education, languages, applicant_message, job_postings(title)',
          )
          .order('created_at', { ascending: false })
          .returns<Application[]>(),
        supabase
          .from('job_postings')
          .select('id, title, employment_type, location')
          .eq('status', 'offen')
          .order('created_at', { ascending: false }),
        supabase.from('locations').select('id, name').order('name'),
      ])

      if (tenantResult.error) setError('Die Daten konnten nicht geladen werden.')
      else {
        setTenantId(tenantResult.data.id)
        setTenantName(tenantResult.data.name)
      }

      if (applicationsResult.error)
        setError('Die Bewerbungen konnten nicht geladen werden.')
      else setApplications(applicationsResult.data ?? [])

      if (openJobPostingsResult.error)
        setError('Die Stellenausschreibungen konnten nicht geladen werden.')
      else setOpenJobPostings(openJobPostingsResult.data ?? [])

      if (!locationsResult.error) setLocations(locationsResult.data ?? [])

      setLoading(false)
    }

    load()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    if (!tenantId) return

    setCreateError(null)
    setCreating(true)

    const { data, error } = await supabase
      .from('applications')
      .insert({
        tenant_id: tenantId,
        applicant_name: newName,
        applicant_email: newEmail,
        // Filialleiter legen in ihrer eigenen Filiale an; der Chef betriebsweit.
        location_id: isOwner ? null : (profile?.location_id ?? null),
      })
      .select(
        'id, applicant_name, applicant_email, status, created_at, updated_at, phone, desired_position, location, location_id, available_from, salary_expectation, desired_working_time, work_experience, education, languages, applicant_message, job_postings(title)',
      )
      .returns<Application[]>()
      .single()

    setCreating(false)

    if (error) {
      setCreateError('Die Bewerbung konnte nicht angelegt werden. Bitte versuche es erneut.')
      return
    }

    setApplications((prev) => [data, ...prev])
    setNewName('')
    setNewEmail('')
  }

  async function handleStatusChange(applicationId: string, newStatus: string) {
    setStatusError(null)
    setUpdatingId(applicationId)

    const { data, error } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', applicationId)
      .select(
        'id, applicant_name, applicant_email, status, created_at, updated_at, phone, desired_position, location, location_id, available_from, salary_expectation, desired_working_time, work_experience, education, languages, applicant_message, job_postings(title)',
      )
      .returns<Application[]>()
      .single()

    setUpdatingId(null)

    if (error) {
      setStatusError('Der Status konnte nicht geändert werden. Bitte versuche es erneut.')
      return
    }

    setApplications((prev) =>
      prev.map((application) =>
        application.id === applicationId ? data : application,
      ),
    )
  }

  async function handleDelete(application: Application) {
    let message = `Bewerbung von ${application.applicant_name} wirklich löschen?`

    if (application.status === 'abgelehnt') {
      const daysRemaining = daysUntilSixMonthsAfter(application.updated_at)
      if (daysRemaining > 0) {
        message =
          `Diese Bewerbung wurde erst vor Kurzem abgelehnt. Übliche Praxis ist, ` +
          `abgelehnte Bewerbungen ca. 6 Monate aufzubewahren (wegen möglicher ` +
          `Ansprüche nach dem AGG) - noch ${daysRemaining} Tage bis dahin. ` +
          `Trotzdem jetzt löschen?`
      }
    }

    if (!window.confirm(message)) return

    setStatusError(null)

    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', application.id)

    if (error) {
      setStatusError('Die Bewerbung konnte nicht gelöscht werden. Bitte versuche es erneut.')
      return
    }

    setApplications((prev) => prev.filter((a) => a.id !== application.id))
  }

  // Plattform-Admins (Betreiber) haben keinen eigenen Betrieb -> zur
  // Betreiber-Verwaltung schicken statt ins (leere) Dashboard.
  if (!profileLoading && isPlatformAdmin && !profile) {
    return <Navigate to="/admin" replace />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-crewwerk px-4 py-4 flex justify-between items-center">
        <Logo
          size="sm"
          align="left"
          withTagline
          variant="light"
          linkTo="/dashboard"
        />
        <div className="flex items-center gap-4">
          {profile?.role === 'owner' && (
            <Link
              to="/dashboard/team"
              className="text-sm text-crewwerk-cream underline"
            >
              Filialen & Team
            </Link>
          )}
          <FeedbackButton tenantId={tenantId} />
          <button
            onClick={handleLogout}
            className="text-sm text-crewwerk-cream underline"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto flex flex-col gap-6 px-4 py-8">
        <h1 className="text-2xl font-semibold text-crewwerk">Dashboard</h1>

        {tenantName && (
          <p className="text-gray-700">
            Eingeloggt für: <strong>{tenantName}</strong>
          </p>
        )}

        {tenantId && (
          <div className="text-xs text-gray-500 bg-white rounded-lg shadow p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>
              Allgemeiner Bewerbungslink (Initiativbewerbung):{' '}
              <span className="font-mono break-all">
                {window.location.origin}/apply/{tenantId}
              </span>
            </span>
            <QrCodeButton
              url={`${window.location.origin}/apply/${tenantId}`}
              subtitle={tenantName ? `bei ${tenantName}` : undefined}
            />
          </div>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              Offene Stellenausschreibungen
            </h2>
            <Link to="/dashboard/jobs" className="text-sm text-crewwerk underline">
              Stellen verwalten
            </Link>
          </div>

          {!loading && openJobPostings.length === 0 && (
            <p className="text-gray-400 text-sm">
              Aktuell keine offenen Stellen.
            </p>
          )}

          {openJobPostings.map((job) => (
            <div
              key={job.id}
              className="border-t border-gray-100 first:border-t-0 pt-2 first:pt-0"
            >
              <span className="text-sm text-gray-900">{job.title}</span>
              <span className="block text-xs text-gray-500">
                {[
                  job.employment_type
                    ? employmentTypeLabels[job.employment_type]
                    : null,
                  job.location,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </div>
          ))}
        </div>

        {canEdit && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-lg shadow p-4 flex flex-col sm:flex-row gap-3 sm:items-end"
        >
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs text-gray-500">
              Bewerbung manuell erfassen (telefonisch, postalisch,
              Empfehlung) — Name
            </label>
            <input
              type="text"
              required
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs text-gray-500">E-Mail</label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={creating || !tenantId}
            className="bg-crewwerk text-crewwerk-cream rounded px-4 py-2 text-sm hover:bg-crewwerk-light disabled:opacity-50"
          >
            {creating ? 'Wird angelegt…' : 'Bewerbung anlegen'}
          </button>
        </form>
        )}
        {createError && <p className="text-red-600 text-sm">{createError}</p>}
        {statusError && <p className="text-red-600 text-sm">{statusError}</p>}

        {isOwner && locations.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <label className="text-gray-500">Filiale:</label>
            <select
              value={locationFilter}
              onChange={(event) => setLocationFilter(event.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="">Alle</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-3 py-2 font-medium">Bewerber:in</th>
                <th className="px-3 py-2 font-medium">Stelle</th>
                <th className="px-3 py-2 font-medium">Filiale</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Datum</th>
                <th className="px-2 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-4 text-gray-400 text-center"
                  >
                    Lädt…
                  </td>
                </tr>
              )}
              {!loading && visibleApplications.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-4 text-gray-400 text-center"
                  >
                    Noch keine Bewerbungen.
                  </td>
                </tr>
              )}
              {visibleApplications.map((application) => {
                const expanded = expandedId === application.id
                return (
                  <Fragment key={application.id}>
                    <tr className="border-t border-gray-100">
                      <td className="px-3 py-2">
                        <button
                          onClick={() =>
                            setExpandedId(expanded ? null : application.id)
                          }
                          className="text-left flex items-start gap-1.5 group"
                          aria-expanded={expanded}
                        >
                          <span
                            className={
                              'text-gray-400 mt-0.5 transition-transform ' +
                              (expanded ? 'rotate-90' : '')
                            }
                          >
                            ›
                          </span>
                          <span>
                            <span className="block text-gray-900 group-hover:text-crewwerk">
                              {application.applicant_name}
                            </span>
                            <span className="block text-xs text-gray-500">
                              {application.applicant_email}
                            </span>
                          </span>
                        </button>
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {application.job_postings?.title ??
                          'Initiativbewerbung'}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {locationName(application.location_id)}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {canEdit ? (
                          <select
                            value={application.status}
                            disabled={updatingId === application.id}
                            onChange={(event) =>
                              handleStatusChange(
                                application.id,
                                event.target.value,
                              )
                            }
                            className={
                              'rounded-full border-0 px-2.5 py-1 text-sm font-medium cursor-pointer disabled:opacity-50 ' +
                              (statusStyles[application.status] ?? '')
                            }
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {statusLabels[status]}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={
                              'inline-block rounded-full px-2.5 py-1 text-sm font-medium ' +
                              (statusStyles[application.status] ?? '')
                            }
                          >
                            {statusLabels[application.status] ??
                              application.status}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                        {new Date(application.created_at).toLocaleDateString(
                          'de-DE',
                        )}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {canEdit && (
                        <button
                          onClick={() => handleDelete(application)}
                          title="Bewerbung löschen"
                          aria-label="Bewerbung löschen"
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482 41.03 41.03 0 0 0-2.365-.298V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        )}
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="bg-gray-50/70">
                        <td colSpan={5} className="px-6 py-4">
                          <ApplicationDetails
                            application={application}
                            tenantName={tenantName}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
