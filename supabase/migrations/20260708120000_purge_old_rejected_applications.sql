-- DSGVO-Aufbewahrung: abgelehnte Bewerbungen automatisch löschen, sobald
-- die Ablehnung länger als 6 Monate zurückliegt.
--
-- WARUM 6 Monate: deckt in Deutschland die Frist ab, in der abgelehnte
-- Bewerber:innen typischerweise noch AGG-Ansprüche geltend machen können.
-- Danach gibt es keinen legitimen Grund mehr, die (personenbezogenen)
-- Bewerbungsdaten aufzubewahren -> "Speicherbegrenzung" (Art. 5 DSGVO).
--
-- WIE der Ablehnzeitpunkt bestimmt wird: aus status_history (der letzte
-- Wechsel nach 'abgelehnt'). Falls dazu kein Verlaufseintrag existiert,
-- Fallback auf updated_at. Dieser Fallback kann eine Löschung höchstens
-- VERZÖGERN, nie verfrühen - das ist die sichere Richtung.
--
-- Das Löschen kaskadiert über die Fremdschlüssel auf status_history und
-- feuert den bestehenden Audit-Delete-Trigger. Da der Cron-Job ohne
-- eingeloggten Nutzer läuft, ist auth.uid() = NULL -> im Audit-Log
-- erkennbar als automatische Aufbewahrungslöschung (actor_id IS NULL).

-- pg_cron erlaubt zeitgesteuerte Jobs direkt in der Datenbank (wie ein
-- Cronjob im Betriebssystem, nur innerhalb von Postgres).
create extension if not exists pg_cron;

create or replace function public.purge_old_rejected_applications()
returns integer
language plpgsql
security definer
set search_path = public
as $fn$
declare
  deleted_count integer;
begin
  with to_delete as (
    select a.id
    from public.applications a
    where a.status = 'abgelehnt'
      and coalesce(
            (
              select max(sh.changed_at)
              from public.status_history sh
              where sh.application_id = a.id
                and sh.new_status = 'abgelehnt'
            ),
            a.updated_at
          ) < now() - interval '6 months'
  )
  delete from public.applications a
  using to_delete d
  where a.id = d.id;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$fn$;

-- Nur der Job-Planer (postgres) darf diese Funktion ausführen - kein
-- Client soll sie über die API aufrufen können.
revoke all on function public.purge_old_rejected_applications() from anon, authenticated;

-- Täglich um 03:00 UTC ausführen. Beim erneuten Einspielen der Migration
-- zuerst einen eventuell vorhandenen gleichnamigen Job entfernen, damit
-- er nicht doppelt angelegt wird.
do $do$
begin
  if exists (select 1 from cron.job where jobname = 'purge-old-rejected-applications') then
    perform cron.unschedule('purge-old-rejected-applications');
  end if;
end
$do$;

select cron.schedule(
  'purge-old-rejected-applications',
  '0 3 * * *',
  $cmd$ select public.purge_old_rejected_applications(); $cmd$
);
