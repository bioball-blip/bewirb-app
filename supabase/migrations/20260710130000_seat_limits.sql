-- Paket A: Zugangs-Kontingent (Sitzplätze) pro Firma.
--
-- seat_limit = maximale Anzahl Zugänge einer Firma INKLUSIVE Inhaber.
-- "Belegt" = vorhandene Nutzer + noch offene (nicht angenommene) Einladungen.
-- Neue, selbst registrierte Firmen starten mit 1 Zugang (Solo); der
-- Betreiber (Super-Admin) kann das Kontingent pro Firma erhöhen.

alter table public.tenants
  add column seat_limit integer not null default 1;

-- Bestehende Firmen großzügig setzen, damit nichts blockiert wird.
update public.tenants set seat_limit = 25;

-- Serverseitige Sperre: verhindert, dass mehr Einladungen erstellt werden,
-- als das Kontingent zulässt. Greift für Inhaber-Einladungen (TeamPage) und
-- fürs Onboarding gleichermaßen und kann vom Client nicht umgangen werden.
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
    (select count(*) from public.users where tenant_id = new.tenant_id)
    + (select count(*) from public.invitations
       where tenant_id = new.tenant_id and accepted_at is null)
  into v_used;

  if v_used >= v_limit then
    raise exception 'seat_limit_reached';
  end if;

  return new;
end;
$$;

create trigger invitations_enforce_seat_limit
  before insert on public.invitations
  for each row
  execute function public.enforce_seat_limit();
