-- Etappe 2b-2: Einladung automatisch per E-Mail verschicken.
--
-- Gleiches Muster wie notify_beta_request: bei einer neuen Einladung ruft
-- ein asynchroner pg_net-Aufruf die Edge Function send-invite-email auf,
-- die der eingeladenen Person den Einladungslink mailt.
--
-- WICHTIG: Existiert kein 'edge_function_service_key' im Vault (z. B. im
-- Dev-Projekt, das keine E-Mail-Infrastruktur hat), wird NICHTS gesendet -
-- so löst das Anlegen einer Einladung dort keine (ins Leere laufenden)
-- Aufrufe aus. Auf Produktion ist der Schlüssel gesetzt und die Mail geht raus.
create or replace function public.notify_invitation()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  service_key text;
  v_tenant_name text;
  v_location_name text;
begin
  select decrypted_secret into service_key
  from vault.decrypted_secrets
  where name = 'edge_function_service_key';

  -- Ohne Schlüssel (Dev) keine Mail auslösen.
  if service_key is null then
    return new;
  end if;

  select name into v_tenant_name from public.tenants where id = new.tenant_id;
  select name into v_location_name from public.locations where id = new.location_id;

  perform net.http_post(
    url := 'https://jzdslbzgqutjolvykdrt.supabase.co/functions/v1/send-invite-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apiKey', service_key
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'invitations',
      'record', to_jsonb(new)
        || jsonb_build_object(
             'tenant_name', v_tenant_name,
             'location_name', v_location_name
           )
    )
  );

  return new;
end;
$$;

create trigger invitations_notify
  after insert on public.invitations
  for each row
  execute function public.notify_invitation();
