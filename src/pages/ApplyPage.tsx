import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type OpenJobPosting = {
  id: string
  title: string
}

export function ApplyPage() {
  const { tenantId } = useParams()
  const [tenantName, setTenantName] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [openJobs, setOpenJobs] = useState<OpenJobPosting[]>([])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!tenantId) return

    supabase
      .rpc('get_tenant_name', { p_tenant_id: tenantId })
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true)
          return
        }
        setTenantName(data)
      })

    supabase
      .rpc('list_open_job_postings', { p_tenant_id: tenantId })
      .then(({ data }) => {
        setOpenJobs(data ?? [])
      })
  }, [tenantId])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!tenantId) return

    setError(null)
    setSubmitting(true)

    const { error } = await supabase.from('applications').insert({
      tenant_id: tenantId,
      applicant_name: name,
      applicant_email: email,
    })

    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    setSubmitted(true)
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <p className="text-gray-500">Dieser Bewerbungslink ist ungültig.</p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white shadow rounded-lg p-8 w-full max-w-sm text-center flex flex-col gap-2">
          <p className="text-gray-900 font-semibold">
            Danke für deine Bewerbung!
          </p>
          <p className="text-gray-500 text-sm">
            Du erhältst eine E-Mail, sobald sich dein Status ändert.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm flex flex-col gap-6">
        {openJobs.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Offene Stellen bei {tenantName}
            </h2>
            <ul className="flex flex-col gap-2">
              {openJobs.map((job) => (
                <li key={job.id}>
                  <Link
                    to={`/apply/job/${job.id}`}
                    className="block border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 hover:bg-gray-50"
                  >
                    {job.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white shadow rounded-lg p-8 flex flex-col gap-4"
        >
          <h1 className="text-xl font-semibold text-gray-900">
            {tenantName
              ? `Initiativbewerbung bei ${tenantName}`
              : 'Bewerbung'}
          </h1>
          <p className="text-xs text-gray-500">
            Keine passende Stelle dabei? Bewirb dich trotzdem allgemein.
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

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="bg-gray-900 text-white rounded px-3 py-2 disabled:opacity-50"
          >
            {submitting ? 'Wird gesendet…' : 'Bewerbung absenden'}
          </button>
        </form>
      </div>
    </div>
  )
}
