import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function DatenschutzPage() {
  useDocumentTitle('Datenschutz')

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-2xl mx-auto bg-white shadow rounded-lg p-8 flex flex-col gap-5 text-sm text-gray-700">
        <h1 className="text-2xl font-semibold text-gray-900">
          Datenschutzerklärung
        </h1>

        <section className="flex flex-col gap-1">
          <h2 className="font-medium text-gray-900">1. Verantwortlicher</h2>
          <p>
            Marc Lünser
            <br />
            Ostpreußenring 113
            <br />
            21339 Lüneburg
            <br />
            E-Mail: marcluenser@gmx.de
          </p>
        </section>

        <section className="flex flex-col gap-1">
          <h2 className="font-medium text-gray-900">
            2. Daten von Betriebs-Mitarbeitern (Dashboard-Nutzung)
          </h2>
          <p>
            Bei der Registrierung erheben wir E-Mail-Adresse, Passwort (in
            verschlüsselter Form) und den angegebenen Betriebsnamen. Diese
            Daten werden benötigt, um dir ein Nutzerkonto und den Zugriff auf
            das Dashboard bereitzustellen.
          </p>
          <p>
            Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Erfüllung eines
            Vertrags bzw. vorvertragliche Maßnahmen zur Nutzung des Dienstes).
          </p>
        </section>

        <section className="flex flex-col gap-1">
          <h2 className="font-medium text-gray-900">
            3. Daten von Bewerber:innen (öffentliches Bewerbungsformular)
          </h2>
          <p>
            Wer sich über ein Bewerbungsformular auf dieser Plattform
            bewirbt, übermittelt Name, E-Mail-Adresse und ggf. Angaben zur
            gewünschten Stelle. Diese Daten werden an den jeweiligen Betrieb
            weitergegeben, bei dem die Bewerbung eingereicht wurde, damit
            dieser die Bewerbung bearbeiten kann.
          </p>
          <p>
            Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO i. V. m. § 26 BDSG
            (vorvertragliche Maßnahmen zur Begründung eines
            Beschäftigungsverhältnisses).
          </p>
          <p>
            Der jeweilige Betrieb ist in diesem Zusammenhang für die
            Entscheidung über die Bewerbung Verantwortlicher im Sinne der
            DSGVO; wir stellen als technischer Dienstleister lediglich die
            Plattform bereit.
          </p>
        </section>

        <section className="flex flex-col gap-1">
          <h2 className="font-medium text-gray-900">
            4. Eingesetzte Dienstleister (Auftragsverarbeiter)
          </h2>
          <p>
            Zum Betrieb dieser Plattform setzen wir folgende Dienstleister
            ein, die in unserem Auftrag Daten verarbeiten:
          </p>
          <ul className="list-disc list-inside flex flex-col gap-1">
            <li>
              <strong>Supabase</strong> (Datenbank, Authentifizierung,
              Speicherung) — Serverstandort Frankfurt am Main (EU).
            </li>
            <li>
              <strong>Vercel Inc.</strong> (Hosting der Webanwendung), USA —
              Datenübermittlung erfolgt auf Grundlage von
              EU-Standardvertragsklauseln.
            </li>
            <li>
              <strong>Resend</strong> (Versand von Status-Benachrichtigungen
              per E-Mail).
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-1">
          <h2 className="font-medium text-gray-900">
            5. Lokale Speicherung / Cookies
          </h2>
          <p>
            Zur Aufrechterhaltung deines Logins speichert die Anwendung ein
            Sitzungs-Token im lokalen Speicher deines Browsers (localStorage).
            Dies ist für die Funktion des Dashboards technisch notwendig.
          </p>
        </section>

        <section className="flex flex-col gap-1">
          <h2 className="font-medium text-gray-900">6. Speicherdauer</h2>
          <p>
            Daten werden gespeichert, solange dies für die Bearbeitung der
            Bewerbung bzw. die Nutzung des Dashboards erforderlich ist, oder
            bis der jeweilige Betrieb bzw. Nutzer die Löschung veranlasst.
          </p>
        </section>

        <section className="flex flex-col gap-1">
          <h2 className="font-medium text-gray-900">
            7. Rechte der betroffenen Personen
          </h2>
          <p>
            Du hast das Recht auf Auskunft, Berichtigung, Löschung,
            Einschränkung der Verarbeitung, Datenübertragbarkeit sowie
            Widerspruch gegen die Verarbeitung deiner Daten. Wende dich dazu
            an die oben genannte Kontakt-E-Mail-Adresse. Außerdem besteht ein
            Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde.
          </p>
        </section>
      </div>
    </div>
  )
}
