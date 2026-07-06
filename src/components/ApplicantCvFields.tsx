export type ApplicantCvValues = {
  phone: string
  location: string
  availableFrom: string
  desiredWorkingTime: string
  workExperience: string
  education: string
  languages: string
  message: string
}

export const emptyCvValues: ApplicantCvValues = {
  phone: '',
  location: '',
  availableFrom: '',
  desiredWorkingTime: 'egal',
  workExperience: '',
  education: '',
  languages: '',
  message: '',
}

// Wandelt die Formularwerte in die Spalten der applications-Tabelle.
// Leere Freitextfelder werden zu null (statt leerem String).
export function cvValuesToInsert(values: ApplicantCvValues) {
  return {
    phone: values.phone || null,
    location: values.location || null,
    available_from: values.availableFrom || null,
    desired_working_time: values.desiredWorkingTime,
    work_experience: values.workExperience || null,
    education: values.education || null,
    languages: values.languages || null,
    applicant_message: values.message || null,
  }
}

const workingTimeOptions: Record<string, string> = {
  egal: 'Egal',
  vollzeit: 'Vollzeit',
  teilzeit: 'Teilzeit',
  aushilfe: 'Aushilfe',
}

const inputClass =
  'border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-crewwerk focus:ring-2 focus:ring-crewwerk/15'

export function ApplicantCvFields({
  values,
  onChange,
}: {
  values: ApplicantCvValues
  onChange: (values: ApplicantCvValues) => void
}) {
  function set<K extends keyof ApplicantCvValues>(
    key: K,
    value: ApplicantCvValues[K],
  ) {
    onChange({ ...values, [key]: value })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="text-xs font-medium text-crewwerk uppercase tracking-wide">
          Kontakt
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs text-gray-500">Telefon</label>
            <input
              type="tel"
              value={values.phone}
              onChange={(event) => set('phone', event.target.value)}
              placeholder="Telefonnummer"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs text-gray-500">Wohnort</label>
            <input
              type="text"
              value={values.location}
              onChange={(event) => set('location', event.target.value)}
              placeholder="z. B. Lüneburg"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-xs font-medium text-crewwerk uppercase tracking-wide">
          Verfügbarkeit
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs text-gray-500">Verfügbar ab</label>
            <input
              type="text"
              value={values.availableFrom}
              onChange={(event) => set('availableFrom', event.target.value)}
              placeholder="z. B. sofort, ab Mai"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs text-gray-500">
              Gewünschte Arbeitszeit
            </label>
            <select
              value={values.desiredWorkingTime}
              onChange={(event) =>
                set('desiredWorkingTime', event.target.value)
              }
              className={inputClass}
            >
              {Object.entries(workingTimeOptions).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-xs font-medium text-crewwerk uppercase tracking-wide">
          Werdegang
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Berufserfahrung</label>
          <textarea
            rows={3}
            value={values.workExperience}
            onChange={(event) => set('workExperience', event.target.value)}
            placeholder="Wo hast du zuletzt gearbeitet und was gemacht? Genaue Daten sind nicht nötig."
            className={`${inputClass} resize-none`}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">
            Ausbildung &amp; Abschlüsse
          </label>
          <textarea
            rows={3}
            value={values.education}
            onChange={(event) => set('education', event.target.value)}
            placeholder="Welche Ausbildung, Schule oder Abschlüsse hast du? Jahreszahlen sind nicht nötig."
            className={`${inputClass} resize-none`}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Sprachen</label>
          <input
            type="text"
            value={values.languages}
            onChange={(event) => set('languages', event.target.value)}
            placeholder="z. B. Deutsch (Muttersprache), Englisch (gut)"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">
          Nachricht an den Betrieb (optional)
        </label>
        <textarea
          rows={2}
          value={values.message}
          onChange={(event) => set('message', event.target.value)}
          placeholder="Warum bewirbst du dich hier?"
          className={`${inputClass} resize-none`}
        />
      </div>
    </div>
  )
}
