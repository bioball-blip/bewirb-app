-- Verbindet Supabase Auth (auth.users) mit unserem eigenen Schema:
-- bei jeder neuen Registrierung automatisch einen Tenant anlegen und
-- den neuen Nutzer als "owner" damit verknüpfen.
--
-- "security definer" ist hier bewusst nötig: unsere RLS-Policies
-- erlauben normalen Nutzern kein direktes INSERT in tenants/users
-- (siehe vorige Migration). Diese eine Funktion bekommt erhöhte
-- Rechte, um genau das an dieser kontrollierten Stelle trotzdem zu
-- tun - der Client selbst kann weiterhin nicht direkt schreiben.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_tenant_id uuid;
begin
  insert into public.tenants (name)
  values (coalesce(new.raw_user_meta_data ->> 'tenant_name', new.email))
  returning id into new_tenant_id;

  insert into public.users (id, tenant_id, email, role)
  values (new.id, new_tenant_id, new.email, 'owner');

  return new;
end;
$$;

-- Läuft automatisch nach jedem INSERT in die (von Supabase verwaltete)
-- auth.users-Tabelle, also nach jeder erfolgreichen Registrierung.
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
