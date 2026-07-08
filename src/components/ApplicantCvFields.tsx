import { type ReactNode } from 'react'

export type ApplicantCvValues = {
  phone: string
  position: string
  availableFrom: string
  salaryExpectation: string
  languages: string
  career: string
  coverLetter: string
}

export const emptyCvValues: ApplicantCvValues = {
  phone: '',
  position: '',
  availableFrom: '',
  salaryExpectation: '',
  languages: '',
  career: '',
  coverLetter: '',
}

// Wandelt die Formularwerte in die Spalten der applications-Tabelle.
// Leere Freitextfelder werden zu null (statt leerem String).
export function cvValuesToInsert(values: ApplicantCvValues) {
  return {
    phone: values.phone || null,
    desired_position: values.position || null,
    available_from: values.availableFrom || null,
    salary_expectation: values.salaryExpectation || null,
    languages: values.languages || null,
    work_experience: values.career || null,
    applicant_message: values.coverLetter || null,
  }
}

const inputClass =
  'border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-crewwerk focus:ring-2 focus:ring-crewwerk/15'

// Hinweis, damit Bewerber:innen möglichst keine besonders schützenswerten
// Daten (Gesundheit, Religion o. Ä.) in die Freitextfelder schreiben.
const sensitiveDataHint =
  'Bitte gib hier nur Informationen zu deiner Erfahrung und Motivation an — keine sensiblen persönlichen Daten wie Gesundheit, Religion o. Ä.'

function FieldLabel({
  children,
  required = false,
}: {
  children: ReactNode
  required?: boolean
}) {
  return (
    <label className="text-xs text-gray-500">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  )
}

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
          Kontakt & Stelle
        </div>
        <div className="flex flex-col gap-1">
          <FieldLabel required>Telefonnummer</FieldLabel>
          <input
            type="tel"
            required
            value={values.phone}
            onChange={(event) => set('phone', event.target.value)}
            placeholder="Telefonnummer"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <FieldLabel required>Stelle / Position</FieldLabel>
          <input
            type="text"
            required
            value={values.position}
            onChange={(event) => set('position', event.target.value)}
            placeholder="z. B. Koch, Servicekraft, Rezeption"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-xs font-medium text-crewwerk uppercase tracking-wide">
          Verfügbarkeit & Gehalt
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex flex-col gap-1 flex-1">
            <FieldLabel required>Verfügbar ab</FieldLabel>
            <input
              type="text"
              required
              value={values.availableFrom}
              onChange={(event) => set('availableFrom', event.target.value)}
              placeholder="z. B. sofort, ab 1. Mai"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <FieldLabel>Gehaltsvorstellung</FieldLabel>
            <input
              type="text"
              value={values.salaryExpectation}
              onChange={(event) =>
                set('salaryExpectation', event.target.value)
              }
              placeholder="z. B. 2.800 € brutto/Monat oder Verhandlungsbasis"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-xs font-medium text-crewwerk uppercase tracking-wide">
          Werdegang & Bewerbungsschreiben
        </div>
        <p className="text-xs text-gray-400">{sensitiveDataHint}</p>

        <div className="flex flex-col gap-1">
          <FieldLabel>Sprachkenntnisse</FieldLabel>
          <input
            type="text"
            value={values.languages}
            onChange={(event) => set('languages', event.target.value)}
            placeholder="z. B. Deutsch (fließend), Englisch (Grundkenntnisse)"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <FieldLabel>Berufserfahrung / Werdegang</FieldLabel>
          <textarea
            rows={3}
            value={values.career}
            onChange={(event) => set('career', event.target.value)}
            placeholder="Wo hast du zuletzt gearbeitet und was gemacht? Genaue Daten sind nicht nötig."
            className={`${inputClass} resize-none`}
          />
        </div>
        <div className="flex flex-col gap-1">
          <FieldLabel required>Bewerbungsschreiben</FieldLabel>
          <textarea
            rows={5}
            required
            value={values.coverLetter}
            onChange={(event) => set('coverLetter', event.target.value)}
            placeholder="Warum bewirbst du dich hier? Was motiviert dich?"
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>
    </div>
  )
}
