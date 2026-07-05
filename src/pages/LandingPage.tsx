import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { DemoPreview } from '../components/landing/DemoPreview'
import { AccessRequestForm } from '../components/landing/AccessRequestForm'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const steps = [
  {
    title: '1. Stelle ausschreiben',
    text: 'Lege eine Stellenausschreibung an und teile den automatisch erzeugten Bewerbungslink — oder nimm Bewerbungen ganz ohne Stellenbezug entgegen.',
  },
  {
    title: '2. Bewerbungen erhalten',
    text: 'Bewerber:innen bewerben sich über ein einfaches öffentliches Formular. Alles landet automatisch, sauber sortiert, in deinem Dashboard.',
  },
  {
    title: '3. Status verwalten',
    text: 'Ändere den Status per Klick — dein:e Bewerber:in wird automatisch per E-Mail informiert und kann den Stand jederzeit ohne Login abrufen.',
  },
]

export function LandingPage() {
  useDocumentTitle()

  return (
    <div className="flex flex-col bg-white">
      <header className="bg-crewwerk px-4 py-4 flex justify-between items-center">
        <Logo size="sm" variant="light" />
        <Link
          to="/login"
          className="text-sm text-crewwerk-cream underline"
        >
          Login
        </Link>
      </header>

      <section className="bg-crewwerk px-4 py-16 flex flex-col items-center text-center gap-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-crewwerk-cream max-w-2xl">
          Bewerbungen auf einen Blick. Für dein ganzes Team.
        </h1>
        <p className="text-crewwerk-cream/80 max-w-xl">
          Crewwerk ist die schlanke Bewerbermanagement-Plattform für Betriebe
          ohne eigene HR-Abteilung. Alle Bewerbungen an einem Ort — und deine
          Bewerber:innen sehen ihren Status jederzeit selbst, ganz ohne
          Login.
        </p>
        <a
          href="#zugang"
          className="bg-crewwerk-cream text-crewwerk font-medium rounded px-6 py-3 hover:opacity-90"
        >
          Zugang anfragen
        </a>
      </section>

      <section className="px-4 py-16 max-w-5xl mx-auto w-full flex flex-col gap-10">
        <h2 className="text-2xl font-semibold text-crewwerk text-center">
          So funktioniert's
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div
              key={step.title}
              className="bg-white shadow rounded-lg p-6 flex flex-col gap-2"
            >
              <h3 className="font-semibold text-gray-900">{step.title}</h3>
              <p className="text-sm text-gray-600">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-16 bg-crewwerk-cream/30">
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          <div className="text-center flex flex-col gap-2">
            <h2 className="text-2xl font-semibold text-crewwerk">
              So sieht's aus
            </h2>
            <p className="text-sm text-gray-600">
              Eine Demo mit Beispieldaten — probier's aus, es passiert
              nichts Echtes.
            </p>
          </div>
          <DemoPreview />
        </div>
      </section>

      <section
        id="zugang"
        className="px-4 py-16 flex flex-col items-center gap-6"
      >
        <div className="text-center flex flex-col gap-2 max-w-md">
          <h2 className="text-2xl font-semibold text-crewwerk">
            Aktuell in geschlossener Testphase
          </h2>
          <p className="text-sm text-gray-600">
            Wir testen Crewwerk gerade mit einer kleinen Gruppe von
            Betrieben. Trag dich ein — wir melden uns per E-Mail bei dir.
          </p>
        </div>
        <AccessRequestForm />
      </section>
    </div>
  )
}
