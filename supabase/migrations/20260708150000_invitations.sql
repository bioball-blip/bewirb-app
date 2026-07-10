-- Etappe 2b-1: Einladungen für Filial-Zugänge.
--
-- Der Chef (owner) legt eine Einladung an (E-Mail + Filiale + Rolle). Dabei
-- entsteht ein geheimer, einmalig gültiger Token. Die eingeladene Person
-- registriert sich über den Einladungslink mit eigenem Passwort und wird
-- durch den Token automatisch dem richtigen Betrieb + Filiale + Rolle
-- zugeordnet (statt einen neuen Betrieb anzulegen).

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  location_id uuid references public.locations(id) on delete cascade,
  role text not null check (role in ('editor', 'viewer')),
  -- langer Zufalls-Token für den Einladungslink; praktisch nicht zu erraten.
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.invitations enable row level security;

-- Nur der Chef des jeweiligen Betriebs darf Einladungen sehen/anlegen/löschen.
create policy "owners view invitations"
  on public.invitations for select to authenticated
  using (tenant_id = public.auth_tenant_id() and public.auth_role() = 'owner');
create policy "owners create invitations"
  on public.invitations for insert to authenticated
  with check (
    tenant_id = public.auth_tenant_id()
    and public.auth_role() = 'owner'
    and (
      location_id is null
      or exists (
        select 1 from public.locations l
        where l.id = location_id and l.tenant_id = public.auth_tenant_id()
      )
    )
  );
create policy "owners delete invitations"
  on public.invitations for delete to authenticated
  using (tenant_id = public.auth_tenant_id() and public.auth_role() = 'owner');

-- Öffentliche Leseansicht einer Einladung per Token (für die Beitrittsseite),
-- ohne die ganze Tabelle freizugeben. security definer + fixierter search_path.
create or replace function public.get_invitation(p_token text)
returns table (email text, role text, tenant_name text, location_name text)
language sql
security definer
stable
set search_path = public
as $$
  select i.email, i.role, t.name, l.name
  from public.invitations i
  join public.tenants t on t.id = i.tenant_id
  left join public.locations l on l.id = i.location_id
  where i.token = p_token and i.accepted_at is null
$$;

grant execute on function public.get_invitation(text) to anon, authenticated;

-- handle_new_user erweitern: Wird bei der Registrierung ein gültiger
-- invite_token mitgeschickt, tritt die Person dem eingeladenen Betrieb bei
-- (Filiale + Rolle aus der Einladung) statt einen neuen Betrieb anzulegen.
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
