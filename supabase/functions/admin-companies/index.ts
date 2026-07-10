// Betreiber-Übersicht: listet alle Firmen mit Zugangs-Kontingent und
// Belegung (nur Firma + Zahlen, KEINE Einzelpersonen/Bewerberdaten) und
// erlaubt dem Plattform-Admin, das Kontingent einer Firma anzupassen.
// Nur für Plattform-Admins (serverseitig via service_role geprüft).

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

    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData.user) return json({ error: "Nicht angemeldet" }, 401);

    const { data: isAdmin } = await admin
      .from("platform_admins")
      .select("id")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (!isAdmin) return json({ error: "Kein Zugriff" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "list");

    if (action === "set_seats") {
      const tenantId = String(body.tenant_id ?? "");
      const seatLimit = Math.max(1, Math.floor(Number(body.seat_limit) || 0));
      if (!tenantId || !seatLimit) {
        return json({ error: "tenant_id und seat_limit erforderlich" }, 400);
      }
      const { error } = await admin
        .from("tenants")
        .update({ seat_limit: seatLimit })
        .eq("id", tenantId);
      if (error) return json({ error: "Kontingent konnte nicht geändert werden" }, 500);
      return json({ ok: true }, 200);
    }

    // action "list": Firmen mit Kontingent + Belegung.
    const { data: tenants, error: tErr } = await admin
      .from("tenants")
      .select("id, name, seat_limit")
      .order("name");
    if (tErr || !tenants) return json({ error: "Firmen konnten nicht geladen werden" }, 500);

    // Belegung je Firma (Nutzer + offene Einladungen) einsammeln.
    const companies = [];
    for (const t of tenants) {
      const [{ count: users }, { count: pending }] = await Promise.all([
        admin.from("users").select("id", { count: "exact", head: true }).eq("tenant_id", t.id),
        admin.from("invitations").select("id", { count: "exact", head: true })
          .eq("tenant_id", t.id).is("accepted_at", null),
      ]);
      companies.push({
        id: t.id,
        name: t.name,
        seat_limit: t.seat_limit,
        used: (users ?? 0) + (pending ?? 0),
      });
    }

    return json({ ok: true, companies }, 200);
  } catch (e) {
    console.error("admin-companies Fehler:", e);
    return json({ error: "Serverfehler" }, 500);
  }
});
