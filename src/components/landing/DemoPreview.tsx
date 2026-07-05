import { useState } from 'react'

type DemoApplication = {
  id: string
  name: string
  email: string
  role: string
  status: string
}

type DemoJobPosting = {
  id: string
  title: string
  employmentType: string
  description: string
}

const statusLabels: Record<string, string> = {
  eingegangen: 'Eingegangen',
  gelesen: 'Gelesen',
  eingeladen: 'Eingeladen',
  angenommen: 'Angenommen',
  abgelehnt: 'Abgelehnt',
}

const statusStyles: Record<string, string> = {
  eingegangen: 'bg-gray-100 text-gray-600',
  gelesen: 'bg-sky-50 text-sky-700',
  eingeladen: 'bg-amber-50 text-amber-700',
  angenommen: 'bg-emerald-50 text-emerald-700',
  abgelehnt: 'bg-red-50 text-red-600',
}

const statusOptions = Object.keys(statusLabels)

const employmentTypeLabels: Record<string, string> = {
  vollzeit: 'Vollzeit',
  teilzeit: 'Teilzeit',
  aushilfe: 'Aushilfe',
  ausbildung: 'Ausbildung',
}

const employmentTypeOptions = Object.keys(employmentTypeLabels)

const initialDemoApplications: DemoApplication[] = [
  {
    id: '1',
    name: 'Anna Beispiel',
    email: 'anna@beispiel.de',
    role: 'Rezeption',
    status: 'eingegangen',
  },
  {
    id: '2',
    name: 'Tom Muster',
    email: 'tom@muster.de',
    role: 'Koch/Köchin',
    status: 'gelesen',
  },
  {
    id: '3',
    name: 'Lea Test',
    email: 'lea@test.de',
    role: 'Zimmerservice',
    status: 'eingeladen',
  },
  {
    id: '4',
    name: 'Max Fiktiv',
    email: 'max@fiktiv.de',
    role: 'Initiativbewerbung',
    status: 'angenommen',
  },
]

const initialDemoJobPostings: DemoJobPosting[] = [
  {
    id: 'j1',
    title: 'Rezeptionist:in',
    employmentType: 'vollzeit',
    description:
      'Empfang unserer Gäste, Check-in/Check-out und Telefondienst. Freundliches Auftreten und Deutsch- sowie Englischkenntnisse erwünscht.',
  },
  {
    id: 'j2',
    title: 'Koch/Köchin',
    employmentType: 'teilzeit',
    description:
      'Zubereitung von Speisen à la carte, Mitgestaltung der Wochenkarte. Erfahrung in der gehobenen Gastronomie von Vorteil.',
  },
]

export function DemoPreview() {
  const [view, setView] = useState<'applications' | 'jobs'>('applications')
  const [applications, setApplications] = useState(initialDemoApplications)
  const [previewId, setPreviewId] = useState('3')

  const [jobPostings, setJobPostings] = useState(initialDemoJobPostings)
  const [newJobTitle, setNewJobTitle] = useState('')
  const [newJobType, setNewJobType] = useState('vollzeit')
  const [newJobDescription, setNewJobDescription] = useState('')

  const previewApplication =
    applications.find((application) => application.id === previewId) ??
    applications[0]

  function handleStatusChange(id: string, newStatus: string) {
    setPreviewId(id)
    setApplications((prev) =>
      prev.map((application) =>
        application.id === id
          ? { ...application, status: newStatus }
          : application,
      ),
    )
  }

  function handleAddDemoRow() {
    const id = String(Date.now())
    setApplications((prev) => [
      {
        id,
        name: 'Neue Demo-Bewerbung',
        email: 'demo@beispiel.de',
        role: 'Initiativbewerbung',
        status: 'eingegangen',
      },
      ...prev,
    ])
    setPreviewId(id)
  }

  function handleAddJob(event: React.FormEvent) {
    event.preventDefault()
    const title = newJobTitle.trim()
    if (!title) return
    setJobPostings((prev) => [
      {
        id: String(Date.now()),
        title,
        employmentType: newJobType,
        description: newJobDescription.trim(),
      },
      ...prev,
    ])
    setNewJobTitle('')
    setNewJobType('vollzeit')
    setNewJobDescription('')
  }

  const tabClass = (active: boolean) =>
    'text-xs font-medium rounded-full px-3.5 py-1.5 transition-colors ' +
    (active
      ? 'bg-crewwerk text-crewwerk-cream'
      : 'text-gray-500 hover:bg-gray-100')

  return (
    <div className="flex flex-col lg:flex-row gap-10 items-center lg:items-start">
      {/* Browser-Fenster-Mock des Dashboards */}
      <div className="flex-1 w-full rounded-xl shadow-2xl shadow-crewwerk/10 overflow-hidden border border-gray-200 bg-white">
        <div className="bg-gray-50 px-4 py-2.5 flex items-center gap-1.5 border-b border-gray-200">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="w-3 h-3 rounded-full bg-green-400" />
          <span className="ml-4 text-xs text-gray-400 bg-white border border-gray-200 rounded-full px-3 py-0.5">
            crewwerk.de/dashboard · Demo
          </span>
        </div>

        <div className="px-5 pt-4">
          <div className="inline-flex gap-1 bg-gray-50 rounded-full p-1">
            <button
              onClick={() => setView('applications')}
              className={tabClass(view === 'applications')}
            >
              Bewerbungen
            </button>
            <button
              onClick={() => setView('jobs')}
              className={tabClass(view === 'jobs')}
            >
              Stellen
            </button>
          </div>
        </div>

        {view === 'applications' ? (
          <div className="p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-semibold text-gray-900">
                Bewerbungen
              </h4>
              <button
                onClick={handleAddDemoRow}
                className="text-xs font-medium bg-crewwerk text-crewwerk-cream rounded-full px-3.5 py-1.5 hover:bg-crewwerk-light transition-colors"
              >
                + Bewerbung anlegen
              </button>
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Bewerber:in</th>
                    <th className="px-3 py-2 font-medium">Stelle</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((application) => (
                    <tr
                      key={application.id}
                      onClick={() => setPreviewId(application.id)}
                      className={
                        'border-t border-gray-100 cursor-pointer transition-colors ' +
                        (application.id === previewId
                          ? 'bg-crewwerk-cream/50'
                          : 'hover:bg-gray-50')
                      }
                    >
                      <td className="px-3 py-2.5">
                        <div className="text-gray-900 font-medium">
                          {application.name}
                        </div>
                        <div className="text-gray-400">
                          {application.email}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-gray-600">
                        {application.role}
                      </td>
                      <td className="px-3 py-2.5">
                        <select
                          value={application.status}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) =>
                            handleStatusChange(
                              application.id,
                              event.target.value,
                            )
                          }
                          className={
                            'rounded-full border-0 px-2.5 py-1 text-xs font-medium cursor-pointer ' +
                            (statusStyles[application.status] ?? '')
                          }
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {statusLabels[status]}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400">
              Klick auf eine Zeile oder ändere den Status — rechts siehst du,
              was der/die Bewerber:in dann sieht.
            </p>
          </div>
        ) : (
          <div className="p-5 flex flex-col gap-4">
            <h4 className="text-sm font-semibold text-gray-900">
              Stelle ausschreiben
            </h4>
            <form onSubmit={handleAddJob} className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-[11px] text-gray-500">
                    Titel der Stelle
                  </label>
                  <input
                    type="text"
                    value={newJobTitle}
                    onChange={(event) => setNewJobTitle(event.target.value)}
                    placeholder="z. B. Servicekraft"
                    className="border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-crewwerk focus:ring-2 focus:ring-crewwerk/15"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-gray-500">
                    Beschäftigung
                  </label>
                  <select
                    value={newJobType}
                    onChange={(event) => setNewJobType(event.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-crewwerk"
                  >
                    {employmentTypeOptions.map((type) => (
                      <option key={type} value={type}>
                        {employmentTypeLabels[type]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-500">
                  Beschreibung
                </label>
                <textarea
                  value={newJobDescription}
                  onChange={(event) =>
                    setNewJobDescription(event.target.value)
                  }
                  rows={3}
                  placeholder="Aufgaben, Anforderungen, was den Betrieb ausmacht …"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-crewwerk focus:ring-2 focus:ring-crewwerk/15 resize-none"
                />
              </div>
              <button
                type="submit"
                className="self-start text-xs font-medium bg-crewwerk text-crewwerk-cream rounded-full px-3.5 py-2 hover:bg-crewwerk-light transition-colors"
              >
                + Stelle anlegen
              </button>
            </form>

            <div className="flex flex-col gap-2">
              {jobPostings.map((job) => (
                <div
                  key={job.id}
                  className="border border-gray-100 rounded-lg px-3 py-2.5 flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-900">
                      {job.title}
                    </span>
                    <span className="text-[10px] font-medium rounded-full px-2 py-0.5 bg-emerald-50 text-emerald-700">
                      Offen
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500">
                    {employmentTypeLabels[job.employmentType]}
                  </span>
                  {job.description && (
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      {job.description}
                    </p>
                  )}
                  <span className="text-[10px] text-gray-400 font-mono truncate">
                    crewwerk.de/apply/job/{job.id}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              Jede Stelle bekommt automatisch einen eigenen Bewerbungslink
              zum Teilen.
            </p>
          </div>
        )}
      </div>

      {/* Handy-Mock der Bewerber-Statusseite */}
      <div className="w-full max-w-[250px] shrink-0">
        <div className="rounded-[2.2rem] border-[6px] border-gray-900 bg-gray-900 shadow-2xl shadow-crewwerk/20 overflow-hidden">
          <div className="bg-white aspect-[9/17] flex flex-col">
            <div className="flex justify-center pt-2 pb-4">
              <span className="w-16 h-1.5 rounded-full bg-gray-200" />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-5 pb-10 text-center">
              <svg
                viewBox="0 0 40 24"
                fill="none"
                className="w-9 text-crewwerk"
                aria-hidden="true"
              >
                <circle cx="12" cy="4" r="2.5" fill="currentColor" />
                <circle cx="24" cy="4" r="2.5" fill="currentColor" />
                <circle
                  cx="13"
                  cy="16"
                  r="7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4.5"
                />
                <circle
                  cx="23"
                  cy="16"
                  r="7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4.5"
                />
              </svg>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider">
                Status deiner Bewerbung
              </p>
              <p className="text-sm text-gray-500">
                Hallo {previewApplication.name.split(' ')[0]},
              </p>
              <span
                className={
                  'text-base font-semibold rounded-full px-4 py-1.5 ' +
                  (statusStyles[previewApplication.status] ?? '')
                }
              >
                {statusLabels[previewApplication.status]}
              </span>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Ohne Login,
                <br />
                per persönlichem Link
              </p>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 text-center mt-3">
          Bewerber-Ansicht · Demo
        </p>
      </div>
    </div>
  )
}
