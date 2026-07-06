type ApplicationForPdf = {
  applicant_name: string
  applicant_email: string
  status: string
  created_at: string
  phone: string | null
  location: string | null
  available_from: string | null
  desired_working_time: string | null
  work_experience: string | null
  education: string | null
  languages: string | null
  applicant_message: string | null
  job_postings: { title: string } | null
}

const statusLabels: Record<string, string> = {
  eingegangen: 'Eingegangen',
  gelesen: 'Gelesen',
  eingeladen: 'Eingeladen',
  angenommen: 'Angenommen',
  abgelehnt: 'Abgelehnt',
}

const workingTimeLabels: Record<string, string> = {
  vollzeit: 'Vollzeit',
  teilzeit: 'Teilzeit',
  aushilfe: 'Aushilfe',
  egal: 'Egal',
}

// Baut eine druckfertige PDF einer Bewerbung und löst den Download aus.
// jsPDF wird erst hier dynamisch geladen, damit die Bibliothek nicht im
// Haupt-Bundle (u. a. der öffentlichen Landingpage) landet.
export async function downloadApplicationPdf(
  application: ApplicationForPdf,
  tenantName: string | null,
) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 48
  const contentWidth = pageWidth - marginX * 2
  const bottomLimit = pageHeight - 56
  let y = 56

  // Neue Seite anlegen, wenn der nächste Block nicht mehr passt.
  function ensureSpace(needed: number) {
    if (y + needed > bottomLimit) {
      doc.addPage()
      y = 56
    }
  }

  // Kopf: Betrieb + Titel
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(22, 48, 42)
  doc.text('Bewerbung', marginX, y)
  y += 20

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(90, 90, 90)
  const headerLine = [
    tenantName ? `Betrieb: ${tenantName}` : null,
    `Eingegangen am ${new Date(application.created_at).toLocaleDateString('de-DE')}`,
  ]
    .filter(Boolean)
    .join('   ·   ')
  doc.text(headerLine, marginX, y)
  y += 16

  doc.setDrawColor(220, 220, 220)
  doc.line(marginX, y, pageWidth - marginX, y)
  y += 24

  function field(label: string, value: string | null | undefined) {
    if (!value) return
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(120, 120, 120)
    ensureSpace(30)
    doc.text(label.toUpperCase(), marginX, y)
    y += 14

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(20, 20, 20)
    const lines = doc.splitTextToSize(value, contentWidth) as string[]
    for (const line of lines) {
      ensureSpace(16)
      doc.text(line, marginX, y)
      y += 16
    }
    y += 10
  }

  field('Name', application.applicant_name)
  field('E-Mail', application.applicant_email)
  field('Telefon', application.phone)
  field('Wohnort', application.location)
  field(
    'Beworben auf',
    application.job_postings?.title ?? 'Initiativbewerbung',
  )
  field('Status', statusLabels[application.status] ?? application.status)
  field('Verfügbar ab', application.available_from)
  field(
    'Gewünschte Arbeitszeit',
    application.desired_working_time &&
      application.desired_working_time !== 'egal'
      ? (workingTimeLabels[application.desired_working_time] ??
          application.desired_working_time)
      : null,
  )
  field('Berufserfahrung', application.work_experience)
  field('Ausbildung & Abschlüsse', application.education)
  field('Sprachen', application.languages)
  field('Nachricht an den Betrieb', application.applicant_message)

  const safeName = application.applicant_name
    .replace(/[^a-z0-9äöüß ]/gi, '')
    .trim()
    .replace(/\s+/g, '_')
  doc.save(`Bewerbung_${safeName || 'Bewerber'}.pdf`)
}
