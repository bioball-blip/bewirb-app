import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type JobPosting = {
  id: string
  title: string
  status: string
  description: string | null
  employment_type: string | null
  location: string | null
  salary_range: string | null
}

const employmentTypeLabels: Record<string, string> = {
  vollzeit: 'Vollzeit',
  teilzeit: 'Teilzeit',
  aushilfe: 'Aushilfe',
  ausbildung: 'Ausbildung',
}

export function JobPostingsPage() {
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [newJobTitle, setNewJobTitle] = useState('')
  const [newJobDescription, setNewJobDescription] = useState('')
  const [newJobEmploymentType, setNewJobEmploymentType] = useState('')
  const [newJobLocation, setNewJobLocation] = useState('')
  const [newJobSalaryRange, setNewJobSalaryRange] = useState('')
  const [creatingJob, setCreatingJob] = useState(false)
  const [jobError, setJobError] = useState<string | null>(null)
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [tenantResult, jobPostingsResult] = await Promise.all([
        supabase.from('tenants').select('id').single(),
        supabase
          .from('job_postings')
          .select(
            'id, title, status, description, employment_type, location, salary_range',
          )
          .order('created_at', { ascending: false }),
      ])

      if (tenantResult.error) setError(tenantResult.error.message)
      else setTenantId(tenantResult.data.id)

      if (jobPostingsResult.error) setError(jobPostingsResult.error.message)
      else setJobPostings(jobPostingsResult.data ?? [])

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
          <h1 className="text-2xl font-semibold text-gray-900">
            Stellenausschreibungen
          </h1>
          <Link to="/dashboard" className="text-sm text-gray-500 underline">
            Zurück zum Dashboard
          </Link>
        </div>

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
            className="self-start bg-gray-900 text-white rounded px-4 py-2 text-sm disabled:opacity-50"
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
      </div>
    </div>
  )
}
