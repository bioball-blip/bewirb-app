-- Zugangsanfragen von der Landingpage: Interessent:innen hinterlassen
-- Name/E-Mail/Betrieb, der Betreiber wird per E-Mail benachrichtigt, um
-- den Einladungscode manuell zu vergeben (kontrollierte Beta-Phase).
create table public.beta_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  tenant_name text,
  created_at timestamptz not null default now()
);

alter table public.beta_requests enable row level security;

-- Gleiches Muster wie beim öffentlichen Bewerbungsformular: erst die
-- breite Standard-Berechtigung von anon zurücknehmen, dann gezielt nur
-- die drei Eingabe-Spalten freigeben.
revoke insert on public.beta_requests from anon;
grant insert (name, email, tenant_name) on public.beta_requests to anon;

create policy "anyone can submit a beta request"
  on public.beta_requests for insert
  to anon
  with check (true);

-- Benachrichtigung per E-Mail bei jeder neuen Anfrage - gleiches Muster
-- wie der Statusänderungs-Webhook: asynchroner pg_net-Aufruf einer
-- Edge Function, Zugangsschlüssel aus Supabase Vault.
create or replace function public.notify_beta_request()
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

  perform net.http_post(
    url := 'https://jzdslbzgqutjolvykdrt.supabase.co/functions/v1/send-beta-request-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apiKey', service_key
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'beta_requests',
      'record', to_jsonb(new)
    )
  );

  return new;
end;
$$;

create trigger beta_requests_notify
  after insert on public.beta_requests
  for each row
  execute function public.notify_beta_request();
