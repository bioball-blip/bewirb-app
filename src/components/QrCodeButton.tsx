import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

export function QrCodeButton({
  url,
  subtitle,
}: {
  url: string
  subtitle?: string | null
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-crewwerk underline"
      >
        QR-Code
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4 print:bg-white print:static print:block"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4 print:shadow-none print:max-w-none"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Druckbereich: das Plakat zum Aufhängen */}
            <div
              id="qr-print-area"
              className="flex flex-col items-center gap-4 text-center border border-gray-200 rounded-xl p-6 print:border-0"
            >
              <div className="flex items-center gap-2 text-crewwerk">
                <svg
                  viewBox="0 0 40 24"
                  fill="none"
                  className="w-8"
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
                <span className="text-lg font-bold">Crewwerk</span>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-xl font-bold text-gray-900">
                  Jetzt bewerben
                </p>
                {subtitle && (
                  <p className="text-sm text-gray-600">{subtitle}</p>
                )}
              </div>

              <div className="p-3 bg-white border border-gray-200 rounded-xl">
                <QRCodeSVG value={url} size={200} level="M" />
              </div>

              <p className="text-sm text-gray-500">
                Scan den Code mit deiner Handykamera und bewirb dich in
                wenigen Minuten — ganz ohne Anschreiben.
              </p>
            </div>

            {/* Bedienelemente (werden beim Drucken ausgeblendet) */}
            <div className="flex gap-2 justify-end print:hidden">
              <button
                onClick={() => setOpen(false)}
                className="text-sm text-gray-500 rounded-full px-4 py-2 hover:bg-gray-100"
              >
                Schließen
              </button>
              <button
                onClick={() => window.print()}
                className="text-sm font-medium bg-crewwerk text-crewwerk-cream rounded-full px-5 py-2 hover:bg-crewwerk-light"
              >
                Drucken
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
