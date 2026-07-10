-- Plattform-Super-Admin (Betreiber-Ebene): kann neue Firmen onboarden
-- (Betrieb + Filialen anlegen, Inhaber einladen). Bewusst KEIN pauschaler
-- Zugriff auf Bewerberdaten - die Mandanten-Regeln (RLS) bleiben strikt.
-- Super-Admin-Aktionen laufen ausschließlich über die abgesicherte Edge
-- Function admin-create-company (service_role), nicht über breite RLS-Rechte.

-- Liste der Plattform-Admins. Eine Zeile wird vorab mit der freigegebenen
-- E-Mail angelegt (id = null); beim ersten Login dieser Person wird die id
-- gesetzt (siehe handle_new_user). So kann sich niemand ungefragt selbst
-- zum Admin machen.
create table public.platform_admins (
  id uuid unique references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;
-- Keine Client-Policies: Zugriff nur über security-definer-Funktionen bzw.
-- die Edge Function (service_role). Anon/authenticated kommen nicht heran.
revoke all on public.platform_admins from anon, authenticated;

-- Prüf-Funktion für die Oberfläche: Ist der eingeloggte Nutzer Plattform-Admin?
create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.platform_admins where id = auth.uid())
$$;

grant execute on function public.is_platform_admin() to authenticated;

-- Onboarding-Einladungen dürfen die Rolle 'owner' (Inhaber) vergeben.
alter table public.invitations drop constraint if exists invitations_role_check;
alter table public.invitations
  add constraint invitations_role_check check (role in ('owner', 'editor', 'viewer'));

-- handle_new_user erweitern: Plattform-Admin-Konto beansprucht seine
-- vorab freigegebene Zeile und legt KEINEN Betrieb an.
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
  invite_token text;
  inv public.invitations%rowtype;
begin
  -- 0) Plattform-Admin: vorab freigegebene E-Mail (noch nicht beansprucht).
  if exists (
    select 1 from public.platform_admins where email = new.email and id is null
  ) then
    update public.platform_admins set id = new.id
    where email = new.email and id is null;
    return new; -- kein Betrieb, kein users-Eintrag
  end if;

  -- 1) Einladungs-Weg: gültiger Token -> bestehendem Betrieb beitreten.
  invite_token := new.raw_user_meta_data ->> 'invite_token';
  if invite_token is not null and invite_token <> '' then
    select * into inv
    from public.invitations
    where token = invite_token and accepted_at is null;

    if not found then
      raise exception 'invite_invalid';
    end if;

    insert into public.users (id, tenant_id, email, role, location_id)
    values (new.id, inv.tenant_id, new.email, inv.role, inv.location_id);

    update public.invitations set accepted_at = now() where id = inv.id;
    return new;
  end if;

  -- 2) Normaler Weg: neuen Betrieb anlegen (mit optionalem Einladungscode).
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
