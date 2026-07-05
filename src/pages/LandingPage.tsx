import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { DemoPreview } from '../components/landing/DemoPreview'
import { AccessRequestForm } from '../components/landing/AccessRequestForm'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const steps = [
  {
    number: '1',
    title: 'Stelle ausschreiben',
    text: 'Lege eine Stellenausschreibung an und teile den automatisch erzeugten Bewerbungslink — oder nimm Bewerbungen ganz ohne Stellenbezug entgegen.',
  },
  {
    number: '2',
    title: 'Bewerbungen erhalten',
    text: 'Bewerber:innen bewerben sich über ein einfaches öffentliches Formular. Alles landet automatisch, sauber sortiert, in deinem Dashboard.',
  },
  {
    number: '3',
    title: 'Status verwalten',
    text: 'Ändere den Status per Klick — dein:e Bewerber:in wird automatisch per E-Mail informiert und kann den Stand jederzeit ohne Login abrufen.',
  },
]

function DecorativeRings({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 24"
      fill="none"
      aria-hidden="true"
      className={className}
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
  )
}

export function LandingPage() {
  useDocumentTitle()

  return (
    <div className="flex flex-col bg-white">
      <header className="bg-crewwerk px-6 py-4 flex justify-between items-center">
        <Logo size="sm" variant="light" />
        <Link
          to="/login"
          className="text-sm text-crewwerk-cream border border-crewwerk-cream/40 rounded-full px-5 py-1.5 hover:bg-crewwerk-cream hover:text-crewwerk transition-colors"
        >
          Login
        </Link>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-crewwerk px-6 pt-20 pb-24">
        <DecorativeRings className="pointer-events-none absolute -right-24 -bottom-40 w-[34rem] text-crewwerk-cream/[0.06]" />
        <DecorativeRings className="pointer-events-none absolute -left-32 -top-24 w-[26rem] rotate-12 text-crewwerk-cream/[0.05]" />

        <div className="relative max-w-3xl mx-auto flex flex-col items-center text-center gap-7">
          <span className="text-xs font-medium tracking-widest uppercase text-crewwerk-cream/70 border border-crewwerk-cream/25 rounded-full px-4 py-1.5">
            Geschlossene Beta
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-crewwerk-cream leading-tight tracking-tight">
            Bewerbungen auf einen Blick.
            <br />
            <span className="text-crewwerk-cream/60">
              Für dein ganzes Team.
            </span>
          </h1>
          <p className="text-crewwerk-cream/75 max-w-xl text-lg leading-relaxed">
            Crewwerk ist die schlanke Bewerbermanagement-Plattform für
            Betriebe ohne eigene HR-Abteilung. Alle Bewerbungen an einem Ort
            — und deine Bewerber:innen sehen ihren Status jederzeit selbst,
            ganz ohne Login.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="#zugang"
              className="bg-crewwerk-cream text-crewwerk font-semibold rounded-full px-8 py-3.5 hover:bg-white transition-colors shadow-lg shadow-black/20"
            >
              Zugang anfragen
            </a>
            <a
              href="#demo"
              className="text-crewwerk-cream font-medium rounded-full px-8 py-3.5 border border-crewwerk-cream/30 hover:border-crewwerk-cream/70 transition-colors"
            >
              Demo ansehen
            </a>
          </div>
        </div>
      </section>

      {/* So funktioniert's */}
      <section className="px-6 py-24 max-w-5xl mx-auto w-full flex flex-col gap-14">
        <div className="text-center flex flex-col gap-3">
          <span className="text-xs font-medium tracking-widest uppercase text-crewwerk/60">
            So funktioniert's
          </span>
          <h2 className="text-3xl font-bold text-crewwerk tracking-tight">
            In drei Schritten startklar
          </h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className="group bg-white border border-gray-200 rounded-2xl p-8 flex flex-col gap-4 hover:border-crewwerk/30 hover:shadow-lg hover:shadow-crewwerk/5 transition-all"
            >
              <span className="w-10 h-10 rounded-full bg-crewwerk-cream text-crewwerk font-bold flex items-center justify-center group-hover:bg-crewwerk group-hover:text-crewwerk-cream transition-colors">
                {step.number}
              </span>
              <h3 className="font-semibold text-gray-900 text-lg">
                {step.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo */}
      <section id="demo" className="px-6 py-24 bg-crewwerk-cream/40 scroll-mt-6">
        <div className="max-w-5xl mx-auto flex flex-col gap-12">
          <div className="text-center flex flex-col gap-3">
            <span className="text-xs font-medium tracking-widest uppercase text-crewwerk/60">
              Live-Demo
            </span>
            <h2 className="text-3xl font-bold text-crewwerk tracking-tight">
              So sieht's aus
            </h2>
            <p className="text-gray-600">
              Eine Demo mit Beispieldaten — probier's aus, es passiert nichts
              Echtes.
            </p>
          </div>
          <DemoPreview />
        </div>
      </section>

      {/* Zugang anfragen */}
      <section id="zugang" className="px-6 py-24 scroll-mt-6">
        <div className="relative overflow-hidden max-w-4xl mx-auto bg-crewwerk rounded-3xl px-6 py-16 flex flex-col items-center gap-8">
          <DecorativeRings className="pointer-events-none absolute -right-16 -bottom-24 w-80 text-crewwerk-cream/[0.07]" />

          <div className="relative text-center flex flex-col gap-3 max-w-md">
            <h2 className="text-3xl font-bold text-crewwerk-cream tracking-tight">
              Aktuell in geschlossener Testphase
            </h2>
            <p className="text-sm text-crewwerk-cream/70 leading-relaxed">
              Wir testen Crewwerk gerade mit einer kleinen Gruppe von
              Betrieben. Trag dich ein — wir melden uns per E-Mail bei dir.
            </p>
          </div>
          <div className="relative w-full flex justify-center">
            <AccessRequestForm />
          </div>
        </div>
      </section>
    </div>
  )
}
