-- Kernschema für "Bewirb.": Mandanten (tenants), Dashboard-Nutzer,
-- Bewerbungen und deren Statusverlauf.
--
-- Ersetzt die Test-Tabelle "hotels" aus dem allerersten Verbindungstest.
drop table if exists public.hotels;

-- pgcrypto liefert gen_random_bytes(), das wir für den zufälligen
-- Magic-Link-Token brauchen (gen_random_uuid() ist in Postgres schon
-- eingebaut, gen_random_bytes() kommt aber aus dieser Extension).
create extension if not exists pgcrypto;

-- ============================================================
-- tenants: ein Hotel-/Gastro-Betrieb = ein Mandant
-- ============================================================
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.tenants enable row level security;

-- ============================================================
-- users: Dashboard-Zugänge der Hotel-Mitarbeiter.
--
-- "id" verweist bewusst auf auth.users(id) (die interne Login-Tabelle
-- von Supabase Auth), statt eine eigene ID zu vergeben. So ist die ID
-- eines eingeloggten Nutzers (auth.uid()) direkt der Schlüssel, mit
-- dem wir hier seinen tenant_id nachschlagen können.
-- ============================================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  role text not null default 'staff' check (role in ('owner', 'admin', 'staff')),
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

-- ============================================================
-- applications: einzelne Bewerbungen.
--
-- unique_token: langer Zufallswert für den Magic Link, über den
-- Bewerber:innen ihren Status ohne Login abrufen. 32 zufällige Bytes,
-- als Hex-Text gespeichert (64 Zeichen) - praktisch nicht zu erraten.
-- ============================================================
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  applicant_name text not null,
  applicant_email text not null,
  status text not null default 'eingegangen'
    check (status in ('eingegangen', 'in_pruefung', 'interview', 'angenommen', 'abgelehnt')),
  unique_token text not null unique default encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.applications enable row level security;

-- updated_at soll sich automatisch aktualisieren, statt dass jede
-- Codestelle, die eine Bewerbung ändert, daran denken muss.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger applications_set_updated_at
  before update on public.applications
  for each row
  execute function public.set_updated_at();

-- ============================================================
-- status_history: Verlauf der Statusänderungen einer Bewerbung.
-- Hat selbst keine tenant_id - die Zugehörigkeit ergibt sich über
-- application_id -> applications.tenant_id.
-- ============================================================
create table public.status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_at timestamptz not null default now()
);

alter table public.status_history enable row level security;

-- ============================================================
-- Hilfsfunktion für RLS: liefert den tenant_id des gerade
-- eingeloggten Nutzers.
--
-- "security definer" heißt: die Funktion läuft mit den Rechten der
-- Person, die sie erstellt hat, nicht mit den eingeschränkten Rechten
-- der aufrufenden Person. Das ist nötig, weil sonst ein Henne-Ei-
-- Problem entstünde: um tenant_id nachzuschlagen, müsste man die
-- users-Tabelle lesen dürfen - aber ob man das darf, hängt laut
-- unserer users-Policy wiederum von tenant_id ab.
-- "set search_path = public" verhindert, dass jemand die Funktion
-- durch eine gleichnamige Tabelle/Funktion in einem anderen Schema
-- austricksen könnte.
-- ============================================================
create or replace function public.auth_tenant_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select tenant_id from public.users where id = auth.uid()
$$;

-- ============================================================
-- RLS-Policies: strikte Mandantentrennung.
--
-- Eine Policy ist eine Regel der Form "für welche Zeilen ist
-- SELECT/INSERT/UPDATE/DELETE erlaubt". Ohne passende Policy bleibt
-- eine Tabelle mit aktiviertem RLS für normale Nutzer komplett leer/
-- unveränderbar - das haben wir schon beim "hotels"-Test gesehen.
-- ============================================================

-- tenants: man sieht/bearbeitet nur den eigenen Betrieb
create policy "tenant members can view their tenant"
  on public.tenants for select
  using (id = public.auth_tenant_id());

create policy "tenant members can update their tenant"
  on public.tenants for update
  using (id = public.auth_tenant_id())
  with check (id = public.auth_tenant_id());

-- users: Mitarbeiter sehen ihre Kolleg:innen im selben Betrieb.
-- Anlegen/Ändern von Zugängen läuft bewusst NICHT über diese Policy,
-- sondern später über eine abgesicherte Edge Function - sonst könnte
-- sich z.B. jemand selbst zu "owner" hochstufen.
create policy "tenant members can view colleagues"
  on public.users for select
  using (tenant_id = public.auth_tenant_id());

-- applications: volle Verwaltung (lesen, anlegen, ändern, löschen),
-- aber immer nur innerhalb des eigenen Betriebs.
create policy "tenant members manage their applications"
  on public.applications for all
  using (tenant_id = public.auth_tenant_id())
  with check (tenant_id = public.auth_tenant_id());

-- status_history: Sichtbarkeit über die zugehörige Bewerbung geprüft.
create policy "tenant members view status history of their applications"
  on public.status_history for select
  using (
    exists (
      select 1 from public.applications
      where applications.id = status_history.application_id
      and applications.tenant_id = public.auth_tenant_id()
    )
  );
