import { useState } from 'react'

type DemoApplication = {
  id: string
  name: string
  email: string
  role: string
  status: string
}

const statusLabels: Record<string, string> = {
  eingegangen: 'Eingegangen',
  gelesen: 'Gelesen',
  eingeladen: 'Eingeladen',
  angenommen: 'Angenommen',
  abgelehnt: 'Abgelehnt',
}

const statusOptions = Object.keys(statusLabels)

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

export function DemoPreview() {
  const [applications, setApplications] = useState(initialDemoApplications)
  const [previewId, setPreviewId] = useState('3')

  const previewApplication =
    applications.find((application) => application.id === previewId) ??
    applications[0]

  function handleStatusChange(id: string, newStatus: string) {
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
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Browser-Fenster-Mock des Dashboards */}
      <div className="flex-1 w-full rounded-lg shadow-xl overflow-hidden border border-gray-200">
        <div className="bg-gray-100 px-3 py-2 flex items-center gap-1.5 border-b border-gray-200">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="ml-3 text-xs text-gray-400">
            crewwerk.de/dashboard (Demo)
          </span>
        </div>
        <div className="bg-white p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold text-gray-900">
              Bewerbungen
            </h4>
            <button
              onClick={handleAddDemoRow}
              className="text-xs bg-crewwerk text-crewwerk-cream rounded px-2 py-1"
            >
              + Bewerbung anlegen
            </button>
          </div>
          <div className="overflow-hidden rounded border border-gray-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-2 py-1.5 font-medium">Bewerber:in</th>
                  <th className="px-2 py-1.5 font-medium">Stelle</th>
                  <th className="px-2 py-1.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr
                    key={application.id}
                    onClick={() => setPreviewId(application.id)}
                    className={
                      'border-t border-gray-100 cursor-pointer ' +
                      (application.id === previewId
                        ? 'bg-crewwerk-cream/40'
                        : '')
                    }
                  >
                    <td className="px-2 py-1.5 text-gray-900">
                      {application.name}
                    </td>
                    <td className="px-2 py-1.5 text-gray-600">
                      {application.role}
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        value={application.status}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) =>
                          handleStatusChange(application.id, event.target.value)
                        }
                        className="border border-gray-300 rounded px-1 py-0.5 text-xs"
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
      </div>

      {/* Handy-Mock der Bewerber-Statusseite */}
      <div className="w-full max-w-[260px] shrink-0 mx-auto">
        <div className="rounded-[1.5rem] border-4 border-gray-800 bg-gray-800 shadow-xl overflow-hidden">
          <div className="bg-gray-50 aspect-[9/16] flex flex-col items-center justify-center p-4 gap-2">
            <p className="text-xs text-gray-400">Status deiner Bewerbung</p>
            <p className="text-sm text-gray-500">
              Hallo {previewApplication.name.split(' ')[0]},
            </p>
            <p className="text-xl font-semibold text-crewwerk text-center">
              {statusLabels[previewApplication.status]}
            </p>
            <p className="text-[10px] text-gray-400 text-center">
              Ohne Login, per persönlichem Link
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          Bewerber-Ansicht (Demo)
        </p>
      </div>
    </div>
  )
}
