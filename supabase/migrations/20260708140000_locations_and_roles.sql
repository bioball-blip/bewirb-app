-- Etappe 1 der Mehr-Filialen-Struktur: Filialen (locations) als Ebene
-- UNTER dem Betrieb (tenant), plus feinere Rollen und Sicherheitsregeln.
--
-- Rollenmodell:
--   owner  = Hauptzugang (Chef): sieht/bearbeitet ALLES im Betrieb,
--            verwaltet Filialen & Zugänge. location_id ist NULL.
--   editor = Filial-Zugang, der die EIGENE Filiale sehen UND bearbeiten darf.
--   viewer = Filial-Zugang, der die EIGENE Filiale nur ANSEHEN darf.
--
-- Bewerbungen/Stellen bekommen eine Filiale (location_id). Filial-Zugänge
-- sehen nur Datensätze ihrer eigenen Filiale; der Chef sieht alle.

-- ============================================================
-- 1) Filialen
-- ============================================================
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.locations enable row level security;

-- ============================================================
-- 2) Nutzer: Filiale + neues Rollenmodell
-- ============================================================
alter table public.users
  add column location_id uuid references public.locations(id) on delete set null;

-- Bestehende Konten sind allesamt Betriebsinhaber -> zu 'owner' machen,
-- bevor die strengere Rollen-Prüfung greift.
update public.users set role = 'owner' where role in ('admin', 'staff');

alter table public.users drop constraint if exists users_role_check;
alter table public.users
  add constraint users_role_check check (role in ('owner', 'editor', 'viewer'));

-- ============================================================
-- 3) Filiale an Stellen & Bewerbungen
-- ============================================================
alter table public.job_postings
  add column location_id uuid references public.locations(id) on delete set null;
alter table public.applications
  add column location_id uuid references public.locations(id) on delete set null;

-- ============================================================
-- 4) RLS-Hilfsfunktionen: Rolle und Filiale des eingeloggten Nutzers.
-- security definer + fixierter search_path, analog zu auth_tenant_id().
-- ============================================================
create or replace function public.auth_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.users where id = auth.uid()
$$;

create or replace function public.auth_location_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select location_id from public.users where id = auth.uid()
$$;

-- ============================================================
-- 5) Sicherheitsregeln (RLS)
-- ============================================================

-- --- Filialen -------------------------------------------------
-- Alle Mitglieder des Betriebs dürfen die Filialen sehen ...
create policy "members view locations"
  on public.locations for select to authenticated
  using (tenant_id = public.auth_tenant_id());
-- ... aber nur der Chef darf Filialen anlegen/ändern/löschen.
create policy "owners insert locations"
  on public.locations for insert to authenticated
  with check (tenant_id = public.auth_tenant_id() and public.auth_role() = 'owner');
create policy "owners update locations"
  on public.locations for update to authenticated
  using (tenant_id = public.auth_tenant_id() and public.auth_role() = 'owner')
  with check (tenant_id = public.auth_tenant_id() and public.auth_role() = 'owner');
create policy "owners delete locations"
  on public.locations for delete to authenticated
  using (tenant_id = public.auth_tenant_id() and public.auth_role() = 'owner');

-- --- Bewerbungen ---------------------------------------------
-- Die bisherige "alles erlaubt"-Regel wird durch feine Regeln ersetzt.
-- (Die anonyme Insert-Regel "anyone can submit an application" bleibt.)
drop policy "tenant members manage their applications" on public.applications;

-- Sehen: Chef sieht alle; Filiale sieht nur die eigene.
create policy "view applications"
  on public.applications for select to authenticated
  using (
    tenant_id = public.auth_tenant_id()
    and (public.auth_role() = 'owner' or location_id = public.auth_location_id())
  );
-- Anlegen (im Dashboard): Chef überall, editor nur in eigener Filiale.
create policy "insert applications"
  on public.applications for insert to authenticated
  with check (
    tenant_id = public.auth_tenant_id()
    and (
      public.auth_role() = 'owner'
      or (public.auth_role() = 'editor' and location_id = public.auth_location_id())
    )
  );
-- Bearbeiten: Chef überall, editor nur eigene Filiale. viewer NIE.
create policy "update applications"
  on public.applications for update to authenticated
  using (
    tenant_id = public.auth_tenant_id()
    and (
      public.auth_role() = 'owner'
      or (public.auth_role() = 'editor' and location_id = public.auth_location_id())
    )
  )
  with check (
    tenant_id = public.auth_tenant_id()
    and (
      public.auth_role() = 'owner'
      or (public.auth_role() = 'editor' and location_id = public.auth_location_id())
    )
  );
-- Löschen: wie Bearbeiten (Chef oder editor der eigenen Filiale).
create policy "delete applications"
  on public.applications for delete to authenticated
  using (
    tenant_id = public.auth_tenant_id()
    and (
      public.auth_role() = 'owner'
      or (public.auth_role() = 'editor' and location_id = public.auth_location_id())
    )
  );

-- --- Statusverlauf: gleiche Sichtbarkeit wie die Bewerbung ----
drop policy "tenant members view status history of their applications" on public.status_history;
create policy "view status history"
  on public.status_history for select to authenticated
  using (
    exists (
      select 1 from public.applications a
      where a.id = status_history.application_id
        and a.tenant_id = public.auth_tenant_id()
        and (public.auth_role() = 'owner' or a.location_id = public.auth_location_id())
    )
  );

-- --- Audit-Log: nur der Chef ---------------------------------
drop policy "tenant members read their audit log" on public.audit_log;
create policy "owners read audit log"
  on public.audit_log for select to authenticated
  using (tenant_id = public.auth_tenant_id() and public.auth_role() = 'owner');

-- --- Stellen: sehen alle, verwalten nur der Chef -------------
drop policy "tenant members manage their job postings" on public.job_postings;
create policy "view job postings"
  on public.job_postings for select to authenticated
  using (tenant_id = public.auth_tenant_id());
create policy "owners insert job postings"
  on public.job_postings for insert to authenticated
  with check (tenant_id = public.auth_tenant_id() and public.auth_role() = 'owner');
create policy "owners update job postings"
  on public.job_postings for update to authenticated
  using (tenant_id = public.auth_tenant_id() and public.auth_role() = 'owner')
  with check (tenant_id = public.auth_tenant_id() and public.auth_role() = 'owner');
create policy "owners delete job postings"
  on public.job_postings for delete to authenticated
  using (tenant_id = public.auth_tenant_id() and public.auth_role() = 'owner');

-- --- Betrieb umbenennen: nur der Chef ------------------------
drop policy "tenant members can update their tenant" on public.tenants;
create policy "owners update tenant"
  on public.tenants for update to authenticated
  using (id = public.auth_tenant_id() and public.auth_role() = 'owner')
  with check (id = public.auth_tenant_id() and public.auth_role() = 'owner');
