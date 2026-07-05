// Wird von einem Supabase Database Webhook aufgerufen, sobald sich
// applications.status ändert (siehe Migration
// 20260705120000_status_change_webhook.sql für die Webhook-Konfiguration
// bzw. die Anleitung im Dashboard, falls per UI angelegt).
//
// Der Webhook schickt den Datensatz VOR und NACH der Änderung mit -
// wir bauen daraus die E-Mail an den Bewerber, inklusive Magic Link
// zur öffentlichen Statusseite (/status/:token).

import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

const statusLabels: Record<string, string> = {
  eingegangen: "Eingegangen",
  gelesen: "Gelesen",
  eingeladen: "Eingeladen",
  angenommen: "Angenommen",
  abgelehnt: "Abgelehnt",
};

type ApplicationRow = {
  applicant_name: string;
  applicant_email: string;
  status: string;
  unique_token: string;
};

type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: ApplicationRow;
  old_record: ApplicationRow | null;
};

export default {
  fetch: withSupabase({ auth: ["secret"] }, async (req) => {
    const payload: WebhookPayload = await req.json();
    const { record, old_record } = payload;

    // Sicherheitsnetz: nur reagieren, wenn sich der Status wirklich
    // geändert hat (sollte durch die Webhook-Konfiguration auf die
    // status-Spalte schon gefiltert sein, aber schadet nicht doppelt
    // geprüft).
    if (!old_record || record.status === old_record.status) {
      return Response.json({ skipped: true });
    }

    const appUrl = Deno.env.get("PUBLIC_APP_URL");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!appUrl || !resendApiKey) {
      console.error("Fehlende Umgebungsvariable PUBLIC_APP_URL oder RESEND_API_KEY");
      return Response.json({ error: "Server-Konfiguration unvollständig" }, { status: 500 });
    }

    const statusLabel = statusLabels[record.status] ?? record.status;
    const magicLink = `${appUrl}/status/${record.unique_token}`;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Crewwerk <noreply@crewwerk.de>",
        to: [record.applicant_email],
        subject: `Update zu deiner Bewerbung: ${statusLabel}`,
        html: `
          <p>Hallo ${record.applicant_name},</p>
          <p>der Status deiner Bewerbung hat sich geändert auf: <strong>${statusLabel}</strong></p>
          <p><a href="${magicLink}">Hier kannst du jederzeit den aktuellen Status einsehen</a></p>
        `,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend-Fehler:", emailResult);
      return Response.json({ error: emailResult }, { status: 502 });
    }

    return Response.json({ sent: true, id: emailResult.id });
  }),
};
