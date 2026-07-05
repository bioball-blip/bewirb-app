-- Sicherheitskorrektur zur vorigen Migration: die Insert-Policy für
-- applications prüfte per EXISTS direkt gegen job_postings - aber
-- job_postings hat selbst RLS aktiv, und für anon sind dort keine
-- Zeilen sichtbar. Die Prüfung "gibt es diese offene Stelle?" lieferte
-- für anon deshalb immer "nein", selbst wenn die Stelle existiert und
-- offen ist. Gleiches Muster wie bei auth_tenant_id(): eine security
-- definer Hilfsfunktion umgeht das kontrolliert.
create or replace function public.job_posting_is_open(
  p_job_posting_id uuid,
  p_tenant_id uuid
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.job_postings
    where id = p_job_posting_id
    and tenant_id = p_tenant_id
    and status = 'offen'
  )
$$;

drop policy "anyone can submit an application" on public.applications;
create policy "anyone can submit an application"
  on public.applications for insert
  to anon
  with check (
    status = 'eingegangen'
    and (
      job_posting_id is null
      or public.job_posting_is_open(job_posting_id, tenant_id)
    )
  );
