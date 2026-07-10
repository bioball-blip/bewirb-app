// Inhaber-Verwaltung von Zugängen: sperren (umkehrbar), entsperren, löschen.
// Prüft serverseitig (service_role), dass der Aufrufer der Inhaber (owner)
// DESSELBEN Betriebs ist wie der Zielnutzer, und verhindert Aktionen am
// eigenen Konto.

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

const BAN_FOREVER = "876000h"; // ~100 Jahre

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
    const callerId = userData.user.id;

    // Aufrufer muss Inhaber (owner) sein.
    const { data: caller } = await admin
      .from("users")
      .select("tenant_id, role, suspended")
      .eq("id", callerId)
      .maybeSingle();
    if (!caller || caller.role !== "owner" || caller.suspended) {
      return json({ error: "Kein Zugriff" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");
    const targetId = String(body.user_id ?? "");
    if (!targetId) return json({ error: "user_id erforderlich" }, 400);
    if (targetId === callerId) {
      return json({ error: "Das eigene Konto kann nicht geändert werden" }, 400);
    }

    // Ziel muss im selben Betrieb sein.
    const { data: target } = await admin
      .from("users")
      .select("id, tenant_id, suspended")
      .eq("id", targetId)
      .maybeSingle();
    if (!target || target.tenant_id !== caller.tenant_id) {
      return json({ error: "Nutzer nicht gefunden" }, 404);
    }

    if (action === "suspend") {
      await admin.auth.admin.updateUserById(targetId, { ban_duration: BAN_FOREVER });
      await admin.from("users").update({ suspended: true }).eq("id", targetId);
      return json({ ok: true }, 200);
    }

    if (action === "unsuspend") {
      // Vor dem Entsperren prüfen, dass noch ein Sitzplatz frei ist.
      const { data: tenant } = await admin
        .from("tenants").select("seat_limit").eq("id", caller.tenant_id).single();
      const [{ count: activeUsers }, { count: pending }] = await Promise.all([
        admin.from("users").select("id", { count: "exact", head: true })
          .eq("tenant_id", caller.tenant_id).eq("suspended", false),
        admin.from("invitations").select("id", { count: "exact", head: true })
          .eq("tenant_id", caller.tenant_id).is("accepted_at", null),
      ]);
      if ((activeUsers ?? 0) + (pending ?? 0) >= (tenant?.seat_limit ?? 0)) {
        return json({ error: "seat_limit_reached" }, 409);
      }
      await admin.auth.admin.updateUserById(targetId, { ban_duration: "none" });
      await admin.from("users").update({ suspended: false }).eq("id", targetId);
      return json({ ok: true }, 200);
    }

    if (action === "delete") {
      // Löscht den Auth-Nutzer; der public.users-Eintrag entfällt per Kaskade.
      const { error } = await admin.auth.admin.deleteUser(targetId);
      if (error) return json({ error: "Löschen fehlgeschlagen" }, 500);
      return json({ ok: true }, 200);
    }

    return json({ error: "Unbekannte Aktion" }, 400);
  } catch (e) {
    console.error("owner-manage-user Fehler:", e);
    return json({ error: "Serverfehler" }, 500);
  }
});
