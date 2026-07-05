-- Registrierung nur mit gültigem Einladungscode - für die Testphase mit
-- wenigen bekannten Testern, ohne die öffentliche Registrierungsseite
-- ganz abzuschalten.
--
-- Der Code selbst liegt in Supabase Vault (Name 'signup_invite_code'),
-- nicht hier im Migrationscode - so lässt er sich jederzeit ändern,
-- ohne diese Funktion neu zu schreiben. Ist noch kein Code im Tresor
-- hinterlegt (expected_code ist null), wird NICHT gesperrt - das
-- verhindert, dass wir uns versehentlich selbst aussperren, bevor der
-- Code einmalig gesetzt wurde.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  new_tenant_id uuid;
  expected_code text;
  provided_code text;
begin
  select decrypted_secret into expected_code
  from vault.decrypted_secrets
  where name = 'signup_invite_code';

  provided_code := new.raw_user_meta_data ->> 'invite_code';

  if expected_code is not null and provided_code is distinct from expected_code then
    raise exception 'invite_code_invalid';
  end if;

  insert into public.tenants (name)
  values (coalesce(new.raw_user_meta_data ->> 'tenant_name', new.email))
  returning id into new_tenant_id;

  insert into public.users (id, tenant_id, email, role)
  values (new.id, new_tenant_id, new.email, 'owner');

  return new;
end;
$$;
