-- Erweiterter Status-Workflow + automatische Verlaufsprotokollierung.

-- 1) Erst die alte Check-Regel entfernen - sie kennt die neuen Statuswerte
--    noch nicht und würde das Ummappen im nächsten Schritt blockieren.
alter table public.applications drop constraint applications_status_check;

-- 2) Bestehende Testdaten auf den neuen Workflow ummappen.
update public.applications set status = 'gelesen' where status = 'in_pruefung';
update public.applications set status = 'eingeladen' where status = 'interview';

-- 3) Jetzt, wo alle Zeilen gültige neue Werte haben, die strengere Regel
--    mit dem finalen Status-Workflow scharf schalten.
alter table public.applications add constraint applications_status_check
  check (status in ('eingegangen', 'gelesen', 'eingeladen', 'angenommen', 'abgelehnt'));

-- 3) Bei jeder echten Statusänderung automatisch einen Verlaufseintrag
--    anlegen (alter Status, neuer Status, Zeitpunkt).
--
-- "security definer" ist hier bewusst wichtig: normale Hotel-Nutzer
-- dürfen laut unseren RLS-Policies NICHT direkt in status_history
-- schreiben (siehe erste Migration - status_history hat nur eine
-- SELECT-Policy). Das ist Absicht: der Verlauf soll ausschließlich durch
-- echte, über die App gemachte Statusänderungen entstehen, nicht durch
-- frei einfügbare, potenziell gefälschte Einträge. Diese eine Funktion
-- bekommt erhöhte Rechte, um genau das kontrolliert zu tun.
--
-- "when (old.status is distinct from new.status)" sorgt dafür, dass der
-- Trigger nur bei einer *tatsächlichen* Statusänderung feuert - nicht
-- bei jedem beliebigen Update der Zeile (z.B. wenn später mal nur der
-- Name korrigiert wird).
create or replace function public.log_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.status_history (application_id, old_status, new_status)
  values (old.id, old.status, new.status);
  return new;
end;
$$;

create trigger applications_log_status_change
  after update on public.applications
  for each row
  when (old.status is distinct from new.status)
  execute function public.log_status_change();
