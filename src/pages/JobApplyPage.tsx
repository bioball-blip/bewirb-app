import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const employmentTypeLabels: Record<string, string> = {
  vollzeit: 'Vollzeit',
  teilzeit: 'Teilzeit',
  aushilfe: 'Aushilfe',
  ausbildung: 'Ausbildung',
}

export function JobApplyPage() {
  const { jobPostingId } = useParams()
  const [title, setTitle] = useState<string | null>(null)
  useDocumentTitle(title ? `Bewerbung: ${title}` : 'Bewerbung')
  const [description, setDescription] = useState<string | null>(null)
  const [employmentType, setEmploymentType] = useState<string | null>(null)
  const [location, setLocation] = useState<string | null>(null)
  const [salaryRange, setSalaryRange] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!jobPostingId) return

    supabase
      .rpc('get_open_job_posting', { p_job_posting_id: jobPostingId })
      .then(({ data, error }) => {
        if (error || !data || data.length === 0) {
          setNotFound(true)
          return
        }
        setTitle(data[0].title)
        setDescription(data[0].description)
        setEmploymentType(data[0].employment_type)
        setLocation(data[0].location)
        setSalaryRange(data[0].salary_range)
        setTenantId(data[0].tenant_id)
      })
  }, [jobPostingId])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!tenantId || !jobPostingId) return

    setError(null)
    setSubmitting(true)

    const { error } = await supabase.from('applications').insert({
      tenant_id: tenantId,
      job_posting_id: jobPostingId,
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
        <p className="text-gray-500">
          Diese Stelle ist nicht (mehr) verfügbar.
        </p>
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

  const metaInfo = [
    employmentType ? employmentTypeLabels[employmentType] : null,
    location,
    salaryRange,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow rounded-lg p-8 w-full max-w-sm flex flex-col gap-4"
      >
        <h1 className="text-xl font-semibold text-gray-900">
          {title ? `Bewirb dich als ${title}` : 'Bewerbung'}
        </h1>
        {metaInfo && <p className="text-xs text-gray-500">{metaInfo}</p>}
        {description && (
          <p className="text-sm text-gray-500 whitespace-pre-wrap">
            {description}
          </p>
        )}

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
          className="bg-crewwerk text-crewwerk-cream rounded px-3 py-2 hover:bg-crewwerk-light disabled:opacity-50"
        >
          {submitting ? 'Wird gesendet…' : 'Bewerbung absenden'}
        </button>
      </form>
    </div>
  )
}
