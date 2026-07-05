-- Automatischer E-Mail-Versand bei Statusänderung.
--
-- Ruft bei jeder echten Statusänderung (siehe WHEN-Klausel unten) über
-- die pg_net-Erweiterung die Edge Function "send-status-email" per HTTP
-- auf. Der Zugangsschlüssel dafür liegt NICHT hier im Klartext, sondern
-- in Supabase Vault unter dem Namen 'edge_function_service_key' (siehe
-- separat ausgeführter, nicht versionierter SQL-Befehl).
create extension if not exists pg_net;

create or replace function public.notify_status_change()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  service_key text;
begin
  select decrypted_secret into service_key
  from vault.decrypted_secrets
  where name = 'edge_function_service_key';

  -- net.http_post arbeitet asynchron: die Anfrage wird nur "in die
  -- Warteschlange gestellt", der Trigger wartet NICHT auf die Antwort
  -- von Resend. Absicht: falls Resend mal langsam ist oder ausfällt,
  -- soll das Ändern eines Status im Dashboard trotzdem sofort
  -- funktionieren und nicht blockieren.
  perform net.http_post(
    url := 'https://jzdslbzgqutjolvykdrt.supabase.co/functions/v1/send-status-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apiKey', service_key
    ),
    body := jsonb_build_object(
      'type', 'UPDATE',
      'table', 'applications',
      'record', to_jsonb(new),
      'old_record', to_jsonb(old)
    )
  );

  return new;
end;
$$;

create trigger applications_notify_status_change
  after update of status on public.applications
  for each row
  when (old.status is distinct from new.status)
  execute function public.notify_status_change();
