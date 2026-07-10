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

// Markenfarben
const GREEN = "#16302a";
const GREEN_LIGHT = "#1f4838";
const CREAM = "#f2ead9";

// Logo-Markenzeichen als eingebettetes SVG (in unterstützenden Clients
// sichtbar; wo nicht, bleibt der Schriftzug „Crewwerk").
const logoMark = `
  <svg width="54" height="32" viewBox="0 0 40 24" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;">
    <circle cx="12" cy="4" r="2.5" fill="${CREAM}" />
    <circle cx="24" cy="4" r="2.5" fill="${CREAM}" />
    <circle cx="13" cy="16" r="7" fill="none" stroke="${CREAM}" stroke-width="4.5" />
    <circle cx="23" cy="16" r="7" fill="none" stroke="${CREAM}" stroke-width="4.5" />
  </svg>`;

function buildEmailHtml(opts: {
  joinLink: string;
  company: string;
  roleLabel: string;
  locationName: string | null;
}): string {
  const { joinLink, company, roleLabel, locationName } = opts;
  const locationRow = locationName
    ? `<tr>
         <td style="padding:4px 0;color:#6b7280;font-size:14px;">Filiale</td>
         <td style="padding:4px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${locationName}</td>
       </tr>`
    : "";

  return `
  <!-- Preheader (Vorschautext) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Du wurdest zu ${company} bei Crewwerk eingeladen.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f2;margin:0;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:480px;max-width:92%;background-color:#ffffff;border-radius:12px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;box-shadow:0 1px 4px rgba(0,0,0,0.06);">

          <!-- Kopf / Logo -->
          <tr>
            <td align="center" style="background-color:${GREEN};padding:28px 24px;">
              ${logoMark}
              <div style="color:${CREAM};font-size:24px;font-weight:bold;letter-spacing:0.3px;margin-top:6px;">Crewwerk</div>
              <div style="color:${CREAM};opacity:0.7;font-size:12px;margin-top:2px;">Gemeinsam mehr erreichen.</div>
            </td>
          </tr>

          <!-- Inhalt -->
          <tr>
            <td style="padding:32px 32px 8px 32px;">
              <h1 style="margin:0 0 12px 0;color:${GREEN};font-size:20px;">Du wurdest eingeladen</h1>
              <p style="margin:0 0 20px 0;color:#374151;font-size:15px;line-height:1.5;">
                Du wurdest eingeladen, <strong>${company}</strong> bei Crewwerk beizutreten.
                Aktiviere deinen Zugang und wähle dabei ein eigenes Passwort.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                style="background-color:#f9fafb;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
                ${locationRow}
                <tr>
                  <td style="padding:4px 0;color:#6b7280;font-size:14px;">Berechtigung</td>
                  <td style="padding:4px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${roleLabel}</td>
                </tr>
              </table>

              <!-- CTA-Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 8px auto;">
                <tr>
                  <td align="center" style="border-radius:8px;background-color:${GREEN};">
                    <a href="${joinLink}"
                      style="display:inline-block;padding:14px 28px;color:${CREAM};font-size:15px;font-weight:bold;text-decoration:none;border-radius:8px;">
                      Zugang aktivieren
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Fallback-Link -->
          <tr>
            <td style="padding:0 32px 28px 32px;">
              <p style="margin:16px 0 0 0;color:#9ca3af;font-size:12px;line-height:1.5;">
                Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br>
                <a href="${joinLink}" style="color:${GREEN_LIGHT};word-break:break-all;">${joinLink}</a>
              </p>
              <p style="margin:16px 0 0 0;color:#9ca3af;font-size:12px;">
                Falls du diese Einladung nicht erwartet hast, kannst du diese E-Mail ignorieren.
              </p>
            </td>
          </tr>

          <!-- Fuß -->
          <tr>
            <td align="center" style="background-color:#f9fafb;padding:16px 24px;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">Crewwerk · crewwerk.de</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>`;
}

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
        html: buildEmailHtml({
          joinLink,
          company,
          roleLabel,
          locationName: record.location_name,
        }),
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
