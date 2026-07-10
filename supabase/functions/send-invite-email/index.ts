// Wird von einem Supabase Database Webhook (pg_net) aufgerufen, sobald der
// Chef eine Einladung anlegt (Tabelle invitations). Schickt der eingeladenen
// Person eine E-Mail mit dem Einladungslink, über den sie ihren Zugang mit
// eigenem Passwort aktiviert.

import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

type InvitationRow = {
  email: string;
  role: string;
  token: string;
  tenant_name: string | null;
  location_name: string | null;
};

type WebhookPayload = {
  type: "INSERT";
  table: string;
  record: InvitationRow;
};

const roleLabels: Record<string, string> = {
  editor: "Bearbeiten",
  viewer: "Nur ansehen",
};

export default {
  fetch: withSupabase({ auth: ["secret"] }, async (req) => {
    const payload: WebhookPayload = await req.json();
    const { record } = payload;

    const appUrl = Deno.env.get("PUBLIC_APP_URL");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!appUrl || !resendApiKey) {
      console.error("Fehlende Umgebungsvariable PUBLIC_APP_URL oder RESEND_API_KEY");
      return Response.json({ error: "Server-Konfiguration unvollständig" }, { status: 500 });
    }

    const joinLink = `${appUrl}/register?token=${record.token}`;
    const roleLabel = roleLabels[record.role] ?? record.role;
    const company = record.tenant_name ?? "einem Betrieb";
    const locationLine = record.location_name
      ? `<li><strong>Filiale:</strong> ${record.location_name}</li>`
      : "";

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Crewwerk <noreply@crewwerk.de>",
        to: [record.email],
        subject: `Einladung zu ${company} bei Crewwerk`,
        html: `
          <p>Hallo,</p>
          <p>du wurdest eingeladen, <strong>${company}</strong> bei Crewwerk beizutreten.</p>
          <ul>
            ${locationLine}
            <li><strong>Berechtigung:</strong> ${roleLabel}</li>
          </ul>
          <p>Klicke auf den folgenden Link und wähle ein eigenes Passwort, um deinen Zugang zu aktivieren:</p>
          <p><a href="${joinLink}">Zugang aktivieren</a></p>
          <p>Falls du diese Einladung nicht erwartet hast, kannst du diese E-Mail ignorieren.</p>
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
