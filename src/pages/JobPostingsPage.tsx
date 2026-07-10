import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'
import { QrCodeButton } from '../components/QrCodeButton'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

type JobPosting = {
  id: string
  title: string
  status: string
  description: string | null
  employment_type: string | null
  location: string | null
  salary_range: string | null
  location_id: string | null
}

type Location = { id: string; name: string }

const employmentTypeLabels: Record<string, string> = {
  vollzeit: 'Vollzeit',
  teilzeit: 'Teilzeit',
  aushilfe: 'Aushilfe',
  ausbildung: 'Ausbildung',
}

export function JobPostingsPage() {
  useDocumentTitle('Stellenausschreibungen')

  const [tenantId, setTenantId] = useState<string | null>(null)
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [newJobTitle, setNewJobTitle] = useState('')
  const [newJobDescription, setNewJobDescription] = useState('')
  const [newJobEmploymentType, setNewJobEmploymentType] = useState('')
  const [newJobLocation, setNewJobLocation] = useState('')
  const [newJobSalaryRange, setNewJobSalaryRange] = useState('')
  const [newJobLocationId, setNewJobLocationId] = useState('')

  function locationName(id: string | null) {
    if (!id) return null
    return locations.find((l) => l.id === id)?.name ?? null
  }
  const [creatingJob, setCreatingJob] = useState(false)
  const [jobError, setJobError] = useState<string | null>(null)
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [tenantResult, jobPostingsResult, locationsResult] =
        await Promise.all([
          supabase.from('tenants').select('id').single(),
          supabase
            .from('job_postings')
            .select(
              'id, title, status, description, employment_type, location, salary_range, location_id',
            )
            .order('created_at', { ascending: false }),
          supabase.from('locations').select('id, name').order('name'),
        ])

      if (tenantResult.error)
        setError('Die Daten konnten nicht geladen werden.')
      else setTenantId(tenantResult.data.id)

      if (jobPostingsResult.error)
        setError('Die Stellenausschreibungen konnten nicht geladen werden.')
      else setJobPostings(jobPostingsResult.data ?? [])

      if (!locationsResult.error) setLocations(locationsResult.data ?? [])

      setLoading(false)
    }

    load()
  }, [])

  async function handleCreateJob(event: FormEvent) {
    event.preventDefault()
    if (!tenantId) return

    setJobError(null)
    setCreatingJob(true)

    const { data, error } = await supabase
      .from('job_postings')
      .insert({
        tenant_id: tenantId,
        title: newJobTitle,
        description: newJobDescription || null,
        employment_type: newJobEmploymentType || null,
        location: newJobLocation || null,
        salary_range: newJobSalaryRange || null,
        location_id: newJobLocationId || null,
      })
      .select(
        'id, title, status, description, employment_type, location, salary_range, location_id',
      )
      .single()

    setCreatingJob(false)

    if (error) {
      setJobError('Die Stelle konnte nicht angelegt werden. Bitte versuche es erneut.')
      return
    }

    setJobPostings((prev) => [data, ...prev])
    setNewJobTitle('')
    setNewJobDescription('')
    setNewJobEmploymentType('')
    setNewJobLocation('')
    setNewJobSalaryRange('')
    setNewJobLocationId('')
  }

  async function handleToggleJobStatus(jobId: string, currentStatus: string) {
    setJobError(null)
    setUpdatingJobId(jobId)

    const nextStatus = currentStatus === 'offen' ? 'geschlossen' : 'offen'

    const { data, error } = await supabase
      .from('job_postings')
      .update({ status: nextStatus })
      .eq('id', jobId)
      .select(
        'id, title, status, description, employment_type, location, salary_range, location_id',
      )
      .single()

    setUpdatingJobId(null)

    if (error) {
      setJobError('Der Status der Stelle konnte nicht geändert werden.')
      return
    }

    setJobPostings((prev) => prev.map((job) => (job.id === jobId ? data : job)))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-crewwerk px-4 py-4 flex justify-between items-center">
        <Logo size="sm" align="left" variant="light" linkTo="/dashboard" />
        <Link
          to="/dashboard"
          className="text-sm text-crewwerk-cream underline"
        >
          Zurück zum Dashboard
        </Link>
      </div>

      <div className="max-w-3xl mx-auto flex flex-col gap-6 px-4 py-8">
        <h1 className="text-2xl font-semibold text-crewwerk">
          Stellenausschreibungen
        </h1>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <form
          onSubmit={handleCreateJob}
          className="bg-white rounded-lg shadow p-4 flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Titel der Stelle</label>
            <input
              type="text"
              required
              value={newJobTitle}
              onChange={(event) => setNewJobTitle(event.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">
              Beschreibung (Aufgaben, Anforderungen)
            </label>
            <textarea
              value={newJobDescription}
              onChange={(event) => setNewJobDescription(event.target.value)}
              rows={3}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>

          {locations.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Filiale</label>
              <select
                value={newJobLocationId}
                onChange={(event) => setNewJobLocationId(event.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">Ganzer Betrieb (keine Filiale)</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-400">
                Bewerbungen auf diese Stelle landen automatisch bei der
                gewählten Filiale.
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs text-gray-500">
                Beschäftigungsart
              </label>
              <select
                value={newJobEmploymentType}
                onChange={(event) =>
                  setNewJobEmploymentType(event.target.value)
                }
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">Keine Angabe</option>
                {Object.entries(employmentTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs text-gray-500">Standort</label>
              <input
                type="text"
                value={newJobLocation}
                onChange={(event) => setNewJobLocation(event.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs text-gray-500">Gehaltsangabe</label>
              <input
                type="text"
                placeholder="z. B. 18-20€/Std."
                value={newJobSalaryRange}
                onChange={(event) => setNewJobSalaryRange(event.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={creatingJob || !tenantId}
            className="self-start bg-crewwerk text-crewwerk-cream rounded px-4 py-2 text-sm hover:bg-crewwerk-light disabled:opacity-50"
          >
            {creatingJob ? 'Wird angelegt…' : 'Stelle anlegen'}
          </button>
        </form>
        {jobError && <p className="text-red-600 text-sm">{jobError}</p>}

        <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-3">
          {loading && <p className="text-gray-400 text-sm">Lädt…</p>}
          {!loading && jobPostings.length === 0 && (
            <p className="text-gray-400 text-sm">
              Noch keine Stellenausschreibungen.
            </p>
          )}

          {jobPostings.map((job) => (
            <div
              key={job.id}
              className="border-t border-gray-100 first:border-t-0 pt-3 first:pt-0 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-900">{job.title}</span>
                <button
                  onClick={() => handleToggleJobStatus(job.id, job.status)}
                  disabled={updatingJobId === job.id}
                  className={
                    'text-xs rounded px-2 py-1 disabled:opacity-50 ' +
                    (job.status === 'offen'
                      ? 'bg-crewwerk-cream text-crewwerk'
                      : 'bg-gray-100 text-gray-500')
                  }
                >
                  {job.status === 'offen' ? 'Offen' : 'Geschlossen'}
                </button>
              </div>
              <span className="text-xs text-gray-500">
                {[
                  locationName(job.location_id),
                  job.employment_type
                    ? employmentTypeLabels[job.employment_type]
                    : null,
                  job.location,
                  job.salary_range,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
              {job.description && (
                <p className="text-xs text-gray-500">{job.description}</p>
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500 font-mono break-all">
                  {window.location.origin}/apply/job/{job.id}
                </span>
                <QrCodeButton
                  url={`${window.location.origin}/apply/job/${job.id}`}
                  subtitle={`als ${job.title}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
