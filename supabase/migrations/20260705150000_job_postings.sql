-- Stellenausschreibungen ("Gesuche"): Bewerber sollen sich entweder auf
-- eine konkrete offene Stelle bewerben können, oder allgemein
-- (Initiativbewerbung) beim Betrieb.

create table public.job_postings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'offen' check (status in ('offen', 'geschlossen')),
  created_at timestamptz not null default now()
);

alter table public.job_postings enable row level security;

-- Mitarbeiter verwalten (lesen, anlegen, ändern, löschen) nur die
-- Stellenausschreibungen des eigenen Betriebs - gleiches Muster wie bei
-- applications.
create policy "tenant members manage their job postings"
  on public.job_postings for all
  using (tenant_id = public.auth_tenant_id())
  with check (tenant_id = public.auth_tenant_id());

-- applications bekommt eine optionale Verknüpfung zur Stelle. NULL
-- bedeutet "Initiativbewerbung" (keine konkrete Stelle).
alter table public.applications
  add column job_posting_id uuid references public.job_postings(id) on delete set null;

-- Öffentliche, eng zugeschnittene Lesefunktionen für die Bewerbungsseiten
-- (gleiches Prinzip wie get_application_status/get_tenant_name: eine
-- Funktion statt einer RLS-Policy für anon, damit nur genau die
-- benötigten Felder herauskommen).

-- Details zu EINER offenen Stelle (für /apply/job/:id).
create or replace function public.get_open_job_posting(p_job_posting_id uuid)
returns table (title text, description text, tenant_id uuid)
language sql
security definer
stable
set search_path = public
as $$
  select title, description, tenant_id
  from public.job_postings
  where id = p_job_posting_id and status = 'offen'
$$;

-- Liste aller offenen Stellen EINES Betriebs (für /apply/:tenantId, um
-- dort zusätzlich zur Initiativbewerbung offene Stellen anzuzeigen).
create or replace function public.list_open_job_postings(p_tenant_id uuid)
returns table (id uuid, title text)
language sql
security definer
stable
set search_path = public
as $$
  select id, title
  from public.job_postings
  where tenant_id = p_tenant_id and status = 'offen'
  order by created_at desc
$$;

revoke all on function public.get_open_job_posting(uuid) from public;
revoke all on function public.list_open_job_postings(uuid) from public;
grant execute on function public.get_open_job_posting(uuid) to anon, authenticated;
grant execute on function public.list_open_job_postings(uuid) to anon, authenticated;

-- Anonyme Bewerber dürfen jetzt auch job_posting_id mitschicken.
revoke insert on public.applications from anon;
grant insert (tenant_id, applicant_name, applicant_email, job_posting_id)
  on public.applications to anon;

-- Insert-Policy verschärfen: falls job_posting_id gesetzt ist, muss sie
-- auf eine WIRKLICH offene Stelle DESSELBEN Betriebs verweisen - sonst
-- könnte jemand eine Bewerbung an eine geschlossene oder fremde Stelle
-- hängen.
drop policy "anyone can submit an application" on public.applications;
create policy "anyone can submit an application"
  on public.applications for insert
  to anon
  with check (
    status = 'eingegangen'
    and (
      job_posting_id is null
      or exists (
        select 1 from public.job_postings jp
        where jp.id = applications.job_posting_id
        and jp.tenant_id = applications.tenant_id
        and jp.status = 'offen'
      )
    )
  );
