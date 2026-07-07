-- Sicherheits-Audit Punkt 4 + 5: unveränderliches Audit-Log für
-- Bewerbungen. Protokolliert Anlegen, Statuswechsel und LÖSCHEN – jeweils
-- mit Akteur (auth.uid()), Zeitpunkt und Tenant. Bewusst OHNE PII
-- (nur application_id + Status), damit das Log auch nach einer
-- DSGVO-Löschung der Bewerbung bestehen bleibt, ohne selbst personen-
-- bezogene Daten aufzubewahren.
--
-- application_id ist bewusst KEIN Fremdschlüssel (kein on delete cascade),
-- sonst würde das Löschen der Bewerbung den Audit-Eintrag mitlöschen.
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  actor_id uuid,
  action text not null check (action in ('created', 'status_changed', 'deleted')),
  application_id uuid,
  details text,
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;

-- Nur lesen, nur der eigene Tenant. Keine Schreib-Policy für Clients ->
-- Einträge entstehen ausschließlich über den security-definer-Trigger.
revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;

create policy "tenant members read their audit log"
  on public.audit_log for select
  to authenticated
  using (tenant_id = public.auth_tenant_id());

create or replace function public.log_application_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.audit_log (tenant_id, actor_id, action, application_id, details)
    values (new.tenant_id, auth.uid(), 'created', new.id, new.status);
    return new;
  elsif (tg_op = 'UPDATE') then
    if new.status is distinct from old.status then
      insert into public.audit_log (tenant_id, actor_id, action, application_id, details)
      values (new.tenant_id, auth.uid(), 'status_changed', new.id,
              old.status || ' -> ' || new.status);
    end if;
    return new;
  elsif (tg_op = 'DELETE') then
    insert into public.audit_log (tenant_id, actor_id, action, application_id, details)
    values (old.tenant_id, auth.uid(), 'deleted', old.id, old.status);
    return old;
  end if;
  return null;
end;
$$;

create trigger applications_audit_insert
  after insert on public.applications
  for each row execute function public.log_application_audit();

create trigger applications_audit_update
  after update on public.applications
  for each row execute function public.log_application_audit();

create trigger applications_audit_delete
  after delete on public.applications
  for each row execute function public.log_application_audit();
