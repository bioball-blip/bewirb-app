import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Application = {
  id: string
  applicant_name: string
  applicant_email: string
  status: string
  created_at: string
  job_postings: { title: string } | null
}

type JobPosting = {
  id: string
  title: string
  status: string
  description: string | null
  employment_type: string | null
  location: string | null
  salary_range: string | null
}

const statusLabels: Record<string, string> = {
  eingegangen: 'Eingegangen',
  gelesen: 'Gelesen',
  eingeladen: 'Eingeladen',
  angenommen: 'Angenommen',
  abgelehnt: 'Abgelehnt',
}

const statusOptions = Object.keys(statusLabels)

const employmentTypeLabels: Record<string, string> = {
  vollzeit: 'Vollzeit',
  teilzeit: 'Teilzeit',
  aushilfe: 'Aushilfe',
  ausbildung: 'Ausbildung',
}

export function DashboardPage() {
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [tenantName, setTenantName] = useState<string | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)

  const [newJobTitle, setNewJobTitle] = useState('')
  const [newJobDescription, setNewJobDescription] = useState('')
  const [newJobEmploymentType, setNewJobEmploymentType] = useState('')
  const [newJobLocation, setNewJobLocation] = useState('')
  const [newJobSalaryRange, setNewJobSalaryRange] = useState('')
  const [creatingJob, setCreatingJob] = useState(false)
  const [jobError, setJobError] = useState<string | null>(null)
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null)

  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      const [tenantResult, applicationsResult, jobPostingsResult] =
        await Promise.all([
          supabase.from('tenants').select('id, name').single(),
          supabase
            .from('applications')
            .select(
              'id, applicant_name, applicant_email, status, created_at, job_postings(title)',
            )
            .order('created_at', { ascending: false })
            .returns<Application[]>(),
          supabase
            .from('job_postings')
            .select(
              'id, title, status, description, employment_type, location, salary_range',
            )
            .order('created_at', { ascending: false }),
        ])

      if (tenantResult.error) setError(tenantResult.error.message)
      else {
        setTenantId(tenantResult.data.id)
        setTenantName(tenantResult.data.name)
      }

      if (applicationsResult.error) setError(applicationsResult.error.message)
      else setApplications(applicationsResult.data ?? [])

      if (jobPostingsResult.error) setError(jobPostingsResult.error.message)
      else setJobPostings(jobPostingsResult.data ?? [])

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
      })
      .select(
        'id, applicant_name, applicant_email, status, created_at, job_postings(title)',
      )
      .returns<Application[]>()
      .single()

    setCreating(false)

    if (error) {
      setCreateError(error.message)
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
        'id, applicant_name, applicant_email, status, created_at, job_postings(title)',
      )
      .returns<Application[]>()
      .single()

    setUpdatingId(null)

    if (error) {
      setStatusError(error.message)
      return
    }

    setApplications((prev) =>
      prev.map((application) =>
        application.id === applicationId ? data : application,
      ),
    )
  }

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
      })
      .select(
        'id, title, status, description, employment_type, location, salary_range',
      )
      .single()

    setCreatingJob(false)

    if (error) {
      setJobError(error.message)
      return
    }

    setJobPostings((prev) => [data, ...prev])
    setNewJobTitle('')
    setNewJobDescription('')
    setNewJobEmploymentType('')
    setNewJobLocation('')
    setNewJobSalaryRange('')
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
        'id, title, status, description, employment_type, location, salary_range',
      )
      .single()

    setUpdatingJobId(null)

    if (error) {
      setJobError(error.message)
      return
    }

    setJobPostings((prev) => prev.map((job) => (job.id === jobId ? data : job)))
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 underline"
          >
            Logout
          </button>
        </div>

        {tenantName && (
          <p className="text-gray-700">
            Eingeloggt für: <strong>{tenantName}</strong>
          </p>
        )}

        {tenantId && (
          <p className="text-xs text-gray-500 bg-white rounded-lg shadow p-3">
            Allgemeiner Bewerbungslink (Initiativbewerbung):{' '}
            <span className="font-mono break-all">
              {window.location.origin}/apply/{tenantId}
            </span>
          </p>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Stellenausschreibungen
          </h2>

          <form onSubmit={handleCreateJob} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">
                Titel der Stelle
              </label>
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
                  {Object.entries(employmentTypeLabels).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ),
                  )}
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
                <label className="text-xs text-gray-500">
                  Gehaltsangabe
                </label>
                <input
                  type="text"
                  placeholder="z. B. 18-20€/Std."
                  value={newJobSalaryRange}
                  onChange={(event) =>
                    setNewJobSalaryRange(event.target.value)
                  }
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creatingJob || !tenantId}
              className="self-start bg-gray-900 text-white rounded px-4 py-2 text-sm disabled:opacity-50"
            >
              {creatingJob ? 'Wird angelegt…' : 'Stelle anlegen'}
            </button>
          </form>
          {jobError && <p className="text-red-600 text-sm">{jobError}</p>}

          {jobPostings.length === 0 && (
            <p className="text-gray-400 text-sm">
              Noch keine Stellenausschreibungen.
            </p>
          )}

          {jobPostings.map((job) => (
            <div
              key={job.id}
              className="border-t border-gray-100 pt-3 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-900">{job.title}</span>
                <button
                  onClick={() => handleToggleJobStatus(job.id, job.status)}
                  disabled={updatingJobId === job.id}
                  className={
                    'text-xs rounded px-2 py-1 disabled:opacity-50 ' +
                    (job.status === 'offen'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500')
                  }
                >
                  {job.status === 'offen' ? 'Offen' : 'Geschlossen'}
                </button>
              </div>
              <span className="text-xs text-gray-500">
                {[
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
              <span className="text-xs text-gray-500 font-mono break-all">
                {window.location.origin}/apply/job/{job.id}
              </span>
            </div>
          ))}
        </div>

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
            className="bg-gray-900 text-white rounded px-4 py-2 text-sm disabled:opacity-50"
          >
            {creating ? 'Wird angelegt…' : 'Bewerbung anlegen'}
          </button>
        </form>
        {createError && <p className="text-red-600 text-sm">{createError}</p>}
        {statusError && <p className="text-red-600 text-sm">{statusError}</p>}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">E-Mail</th>
                <th className="px-4 py-2 font-medium">Stelle</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Eingegangen am</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-4 text-gray-400 text-center"
                  >
                    Lädt…
                  </td>
                </tr>
              )}
              {!loading && applications.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-4 text-gray-400 text-center"
                  >
                    Noch keine Bewerbungen.
                  </td>
                </tr>
              )}
              {applications.map((application) => (
                <tr key={application.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-gray-900">
                    {application.applicant_name}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {application.applicant_email}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {application.job_postings?.title ?? 'Initiativbewerbung'}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    <select
                      value={application.status}
                      disabled={updatingId === application.id}
                      onChange={(event) =>
                        handleStatusChange(application.id, event.target.value)
                      }
                      className="border border-gray-300 rounded px-2 py-1 text-sm disabled:opacity-50"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {statusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {new Date(application.created_at).toLocaleDateString(
                      'de-DE',
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
