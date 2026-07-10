// Betreiber-Onboarding: legt eine neue Firma (Betrieb) samt optionaler
// Filialen an und lädt den Inhaber per E-Mail ein. Ausschließlich für
// Plattform-Admins – die Funktion prüft das serverseitig mit dem
// service_role-Schlüssel. Normale Mandanten-Regeln (RLS) bleiben unberührt.

import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(obj: unknown, status: number) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    if (!jwt) return json({ error: "Nicht angemeldet" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // 1) Aufrufer identifizieren und als Plattform-Admin prüfen.
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData.user) return json({ error: "Nicht angemeldet" }, 401);

    const { data: isAdmin } = await admin
      .from("platform_admins")
      .select("id")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (!isAdmin) return json({ error: "Kein Zugriff" }, 403);

    // 2) Eingaben prüfen.
    const body = await req.json().catch(() => ({}));
    const companyName = String(body.companyName ?? "").trim();
    const ownerEmail = String(body.ownerEmail ?? "").trim();
    const locations: string[] = Array.isArray(body.locations)
      ? body.locations.map((l: unknown) => String(l).trim()).filter(Boolean)
      : [];

    if (!companyName || !ownerEmail) {
      return json({ error: "Firmenname und Inhaber-E-Mail sind erforderlich" }, 400);
    }

    // 3) Firma anlegen.
    const { data: tenant, error: tErr } = await admin
      .from("tenants")
      .insert({ name: companyName })
      .select("id")
      .single();
    if (tErr || !tenant) return json({ error: "Firma konnte nicht angelegt werden" }, 500);

    // 4) Optionale Filialen anlegen.
    if (locations.length > 0) {
      const rows = locations.map((name) => ({ tenant_id: tenant.id, name }));
      const { error: lErr } = await admin.from("locations").insert(rows);
      if (lErr) return json({ error: "Filialen konnten nicht angelegt werden" }, 500);
    }

    // 5) Inhaber einladen (löst die Einladungs-E-Mail über den Trigger aus).
    const { data: inv, error: iErr } = await admin
      .from("invitations")
      .insert({ tenant_id: tenant.id, email: ownerEmail, role: "owner", location_id: null })
      .select("token")
      .single();
    if (iErr || !inv) return json({ error: "Inhaber-Einladung fehlgeschlagen" }, 500);

    return json({ ok: true, tenant_id: tenant.id, token: inv.token }, 200);
  } catch (e) {
    console.error("admin-create-company Fehler:", e);
    return json({ error: "Serverfehler" }, 500);
  }
});
