-- Erweitert Stellenausschreibungen um die Felder für eine vollständige
-- Ausschreibung: Beschäftigungsart, Standort, Gehaltsangabe.
-- "description" existierte schon (aus der ersten job_postings-
-- Migration), wurde aber im Formular noch nicht genutzt.
alter table public.job_postings
  add column employment_type text
    check (employment_type in ('vollzeit', 'teilzeit', 'aushilfe', 'ausbildung')),
  add column location text,
  add column salary_range text;

-- Öffentliche Lesefunktionen entsprechend erweitern. "create or replace"
-- reicht nicht, weil sich die Rückgabespalten ändern - Postgres verlangt
-- dafür ein explizites drop zuerst.
drop function public.get_open_job_posting(uuid);
drop function public.list_open_job_postings(uuid);

create or replace function public.get_open_job_posting(p_job_posting_id uuid)
returns table (
  title text,
  description text,
  employment_type text,
  location text,
  salary_range text,
  tenant_id uuid
)
language sql
security definer
stable
set search_path = public
as $$
  select title, description, employment_type, location, salary_range, tenant_id
  from public.job_postings
  where id = p_job_posting_id and status = 'offen'
$$;

create or replace function public.list_open_job_postings(p_tenant_id uuid)
returns table (
  id uuid,
  title text,
  employment_type text,
  location text
)
language sql
security definer
stable
set search_path = public
as $$
  select id, title, employment_type, location
  from public.job_postings
  where tenant_id = p_tenant_id and status = 'offen'
  order by created_at desc
$$;
