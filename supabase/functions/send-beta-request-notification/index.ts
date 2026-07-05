// Wird von einem Supabase Database Webhook (pg_net) aufgerufen, sobald
// jemand über die Landingpage eine Zugangsanfrage einreicht (Tabelle
// beta_requests). Schickt eine Benachrichtigungs-Mail an den Betreiber,
// damit er den Beta-Zugangscode manuell vergeben kann.

import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

type BetaRequestRow = {
  name: string;
  email: string;
  tenant_name: string | null;
};

type WebhookPayload = {
  type: "INSERT";
  table: string;
  record: BetaRequestRow;
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

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Crewwerk <noreply@crewwerk.de>",
        to: [NOTIFY_EMAIL],
        subject: `Neue Zugangsanfrage: ${record.name}`,
        html: `
          <p>Neue Zugangsanfrage über die Crewwerk-Landingpage:</p>
          <ul>
            <li><strong>Name:</strong> ${record.name}</li>
            <li><strong>E-Mail:</strong> ${record.email}</li>
            <li><strong>Betrieb:</strong> ${record.tenant_name ?? "-"}</li>
          </ul>
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
