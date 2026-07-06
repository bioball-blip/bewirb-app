-- Feedback von Testbetrieben während der Beta-Phase. Eingeloggte
-- Dashboard-Nutzer können Feedback hinterlassen; der Betreiber wird per
-- E-Mail benachrichtigt.
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

-- Nur eingeloggte Nutzer dürfen Feedback anlegen, und nur im Namen des
-- eigenen Betriebs (tenant_id muss zum eingeloggten Nutzer passen) -
-- gleiches Mandanten-Muster wie bei applications.
revoke insert on public.feedback from anon, authenticated;
grant insert (tenant_id, message) on public.feedback to authenticated;

create policy "tenant members can submit feedback"
  on public.feedback for insert
  to authenticated
  with check (tenant_id = public.auth_tenant_id());

-- Benachrichtigung per E-Mail bei jedem neuen Feedback - gleiches Muster
-- wie der Zugangsanfragen-Webhook. Der Betriebsname wird hier
-- nachgeschlagen und dem Webhook-Body beigelegt, damit die Mail direkt
-- zeigt, von welchem Betrieb das Feedback kommt.
create or replace function public.notify_feedback()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  service_key text;
  v_tenant_name text;
begin
  select decrypted_secret into service_key
  from vault.decrypted_secrets
  where name = 'edge_function_service_key';

  select name into v_tenant_name
  from public.tenants
  where id = new.tenant_id;

  perform net.http_post(
    url := 'https://jzdslbzgqutjolvykdrt.supabase.co/functions/v1/send-feedback-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apiKey', service_key
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'feedback',
      'record', to_jsonb(new) || jsonb_build_object('tenant_name', v_tenant_name)
    )
  );

  return new;
end;
$$;

create trigger feedback_notify
  after insert on public.feedback
  for each row
  execute function public.notify_feedback();
