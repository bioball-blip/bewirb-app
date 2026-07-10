-- Paket B: Zugänge sperren (umkehrbar) und löschen (endgültig).
--
-- "suspended" kennzeichnet gesperrte Zugänge. Ein gesperrter Zugang:
--   - verliert sofort jeden Datenzugriff (auth_tenant_id() liefert für ihn
--     null -> alle mandantenbezogenen RLS-Regeln greifen ins Leere),
--   - gibt seinen Sitzplatz frei (zählt nicht mehr gegen das Kontingent).
-- Zusätzlich wird der Login serverseitig gesperrt (Auth-Bann in der Edge
-- Function owner-manage-user). Löschen entfernt den Zugang ganz.

alter table public.users
  add column suspended boolean not null default false;

-- Gesperrte Nutzer bekommen keinen tenant_id mehr -> kein Zugriff.
create or replace function public.auth_tenant_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select tenant_id from public.users where id = auth.uid() and suspended = false
$$;

-- Sitzplatz-Zählung: gesperrte Nutzer zählen nicht mehr mit.
create or replace function public.enforce_seat_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer;
  v_used integer;
begin
  select seat_limit into v_limit from public.tenants where id = new.tenant_id;

  select
    (select count(*) from public.users
       where tenant_id = new.tenant_id and suspended = false)
    + (select count(*) from public.invitations
       where tenant_id = new.tenant_id and accepted_at is null)
  into v_used;

  if v_used >= v_limit then
    raise exception 'seat_limit_reached';
  end if;

  return new;
end;
$$;
