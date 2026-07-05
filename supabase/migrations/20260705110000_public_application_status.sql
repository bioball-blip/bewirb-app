-- Öffentliche, rein lesende Statusabfrage für Bewerber über ihren
-- Magic-Link-Token - bewusst OHNE neue RLS-Policy auf applications.
--
-- Eine RLS-Policy wie "using (unique_token = ...)" wäre hier die
-- falsche Wahl: RLS entscheidet, welche Zeilen für eine Rolle generell
-- sichtbar sind - unabhängig davon, welchen WHERE-Filter der Aufrufer
-- benutzt hat. Ein Angreifer könnte die Supabase-REST-Schnittstelle
-- direkt ansprechen, nicht nur über unsere App-Oberfläche. Deshalb:
-- eine einzelne, eng zugeschnittene Funktion statt einer Tabellen-Policy.
create or replace function public.get_application_status(p_token text)
returns table (
  applicant_name text,
  status text,
  updated_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select applicant_name, status, updated_at
  from public.applications
  where unique_token = p_token
$$;

-- Standardmäßig dürfte JEDE Rolle eine neu angelegte Funktion aufrufen.
-- Wir entziehen das erst explizit wieder und geben es dann bewusst nur
-- den zwei Rollen, die es wirklich brauchen sollen - lieber einmal zu
-- ausdrücklich als aus Versehen zu offen.
revoke all on function public.get_application_status(text) from public;
grant execute on function public.get_application_status(text) to anon, authenticated;
