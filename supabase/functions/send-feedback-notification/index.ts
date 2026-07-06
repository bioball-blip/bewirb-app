// Wird von einem Supabase Database Webhook (pg_net) aufgerufen, sobald
// ein Testbetrieb im Dashboard Feedback hinterlässt (Tabelle feedback).
// Schickt eine Benachrichtigungs-Mail an den Betreiber.

import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

type FeedbackRow = {
  message: string;
  tenant_name: string | null;
  created_at: string;
};

type WebhookPayload = {
  type: "INSERT";
  table: string;
  record: FeedbackRow;
};

const NOTIFY_EMAIL = "marcluenser@gmx.de";

export default {
  fetch: withSupabase({ auth: ["secret"] }, async (req) => {
    const payload: WebhookPayload = await req.json();
    const { record } = payload;

    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error("Fehlende Umgebungsvariable RESEND_API_KEY");
      return Response.json({ error: "Server-Konfiguration unvollständig" }, { status: 500 });
    }

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Crewwerk <noreply@crewwerk.de>",
        to: [NOTIFY_EMAIL],
        subject: `Neues Feedback von ${record.tenant_name ?? "einem Betrieb"}`,
        html: `
          <p>Neues Feedback über das Crewwerk-Dashboard:</p>
          <p><strong>Betrieb:</strong> ${escapeHtml(record.tenant_name ?? "-")}</p>
          <p style="white-space: pre-wrap; border-left: 3px solid #16302a; padding-left: 12px; color: #333;">${escapeHtml(record.message)}</p>
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
