import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function ImpressumPage() {
  useDocumentTitle('Impressum')

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-2xl mx-auto bg-white shadow rounded-lg p-8 flex flex-col gap-4 text-sm text-gray-700">
        <h1 className="text-2xl font-semibold text-gray-900">Impressum</h1>

        <div>
          <p className="font-medium text-gray-900">Angaben gemäß § 5 TMG</p>
          <p>
            Marc Lünser
            <br />
            Ostpreußenring 113
            <br />
            21339 Lüneburg
          </p>
        </div>

        <div>
          <p className="font-medium text-gray-900">Kontakt</p>
          <p>E-Mail: marcluenser@gmx.de</p>
        </div>

        <div>
          <p className="font-medium text-gray-900">
            Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
          </p>
          <p>Marc Lünser (Anschrift wie oben)</p>
        </div>

        <div>
          <p className="font-medium text-gray-900">Haftung für Inhalte</p>
          <p>
            Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten
            nach den allgemeinen Gesetzen verantwortlich. Wir sind jedoch
            nicht verpflichtet, übermittelte oder gespeicherte fremde
            Informationen zu überwachen oder nach Umständen zu forschen, die
            auf eine rechtswidrige Tätigkeit hinweisen.
          </p>
        </div>

        <div>
          <p className="font-medium text-gray-900">Haftung für Links</p>
          <p>
            Diese Seite kann Links zu externen Webseiten Dritter enthalten,
            auf deren Inhalte wir keinen Einfluss haben. Für die Inhalte der
            verlinkten Seiten ist stets der jeweilige Anbieter verantwortlich.
          </p>
        </div>
      </div>
    </div>
  )
}
