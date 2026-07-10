-- Paket D: Hinweis für den Inhaber, wenn eine Filiale einen Status ändert.
--
-- unseen_status_change wird automatisch true, sobald jemand, der NICHT der
-- Inhaber ist (also ein Filial-Zugang), den Status einer Bewerbung ändert.
-- Der Inhaber sieht daraufhin einen roten Punkt; beim Öffnen der Bewerbung
-- setzt die Oberfläche das Kennzeichen wieder zurück.

alter table public.applications
  add column unseen_status_change boolean not null default false;

create or replace function public.mark_unseen_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Nur bei echter Statusänderung durch einen Nicht-Inhaber markieren.
  if new.status is distinct from old.status
     and coalesce(public.auth_role(), '') <> 'owner' then
    new.unseen_status_change := true;
  end if;
  return new;
end;
$$;

create trigger applications_mark_unseen
  before update on public.applications
  for each row
  execute function public.mark_unseen_status_change();
