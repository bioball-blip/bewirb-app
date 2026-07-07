import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export function FeedbackButton({ tenantId }: { tenantId: string | null }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  function close() {
    setOpen(false)
    // kurz verzögert zurücksetzen, damit man den Wechsel nicht sieht
    setTimeout(() => {
      setMessage('')
      setError(null)
      setSubmitted(false)
    }, 200)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!tenantId) return

    setError(null)
    setSubmitting(true)

    const { error } = await supabase.from('feedback').insert({
      tenant_id: tenantId,
      message,
    })

    setSubmitting(false)

    if (error) {
      setError('Feedback konnte nicht gesendet werden. Bitte versuche es erneut.')
      return
    }

    setSubmitted(true)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-crewwerk-cream underline"
      >
        Feedback
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
          onClick={close}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4"
            onClick={(event) => event.stopPropagation()}
          >
            {submitted ? (
              <div className="flex flex-col items-center gap-3 text-center py-4">
                <span className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-6 h-6"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <p className="text-gray-900 font-semibold">
                  Danke für dein Feedback!
                </p>
                <p className="text-gray-500 text-sm">
                  Wir lesen jede Rückmeldung und verbessern Crewwerk laufend.
                </p>
                <button
                  onClick={close}
                  className="mt-2 bg-crewwerk text-crewwerk-cream rounded-full px-6 py-2 text-sm hover:bg-crewwerk-light transition-colors"
                >
                  Schließen
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Feedback geben
                    </h2>
                    <p className="text-xs text-gray-500">
                      Was läuft gut, was fehlt, was stört? Wir freuen uns über
                      jede Rückmeldung.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Schließen"
                    className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                  >
                    ×
                  </button>
                </div>

                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Dein Feedback …"
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-crewwerk focus:ring-2 focus:ring-crewwerk/15 resize-none"
                />

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting || !tenantId}
                  className="self-end bg-crewwerk text-crewwerk-cream rounded-full px-6 py-2.5 text-sm font-medium hover:bg-crewwerk-light transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Wird gesendet…' : 'Feedback senden'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
