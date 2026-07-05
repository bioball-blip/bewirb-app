import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Application = {
  id: string
  applicant_name: string
  applicant_email: string
  status: string
  created_at: string
}

const statusLabels: Record<string, string> = {
  eingegangen: 'Eingegangen',
  gelesen: 'Gelesen',
  eingeladen: 'Eingeladen',
  angenommen: 'Angenommen',
  abgelehnt: 'Abgelehnt',
}

const statusOptions = Object.keys(statusLabels)

export function DashboardPage() {
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [tenantName, setTenantName] = useState<string | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)

  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      const [tenantResult, applicationsResult] = await Promise.all([
        supabase.from('tenants').select('id, name').single(),
        supabase
          .from('applications')
          .select('id, applicant_name, applicant_email, status, created_at')
          .order('created_at', { ascending: false }),
      ])

      if (tenantResult.error) setError(tenantResult.error.message)
      else {
        setTenantId(tenantResult.data.id)
        setTenantName(tenantResult.data.name)
      }

      if (applicationsResult.error) setError(applicationsResult.error.message)
      else setApplications(applicationsResult.data ?? [])

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
      .select('id, applicant_name, applicant_email, status, created_at')
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
      .select('id, applicant_name, applicant_email, status, created_at')
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

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <form
          onSubmit={handleCreate}
          className="bg-white rounded-lg shadow p-4 flex flex-col sm:flex-row gap-3 sm:items-end"
        >
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs text-gray-500">Name</label>
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
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Eingegangen am</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-4 text-gray-400 text-center"
                  >
                    Lädt…
                  </td>
                </tr>
              )}
              {!loading && applications.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
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
