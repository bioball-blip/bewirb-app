-- Erweitert Bewerbungen um Lebenslauf-Felder (Vorlage). Alle neuen
-- Felder sind optional; bei Erfahrung/Ausbildung bewusst kein
-- Datumszwang (Freitext). "desired_working_time" = gewünschte
-- Arbeitszeit der bewerbenden Person (unabhängig von der
-- Beschäftigungsart, die das Hotel bei der Stelle angibt).
alter table public.applications
  add column phone text,
  add column location text,
  add column available_from text,
  add column desired_working_time text
    check (desired_working_time in ('vollzeit', 'teilzeit', 'aushilfe', 'egal')),
  add column work_experience text,
  add column education text,
  add column languages text,
  add column applicant_message text;

-- Anonyme Bewerber dürfen die neuen Felder beim Absenden mitschicken.
-- Erst die bestehende Spalten-Freigabe zurücknehmen, dann neu mit den
-- zusätzlichen Spalten setzen (Grants sind additiv, daher revoke zuerst).
revoke insert on public.applications from anon;
grant insert (
  tenant_id,
  applicant_name,
  applicant_email,
  job_posting_id,
  phone,
  location,
  available_from,
  desired_working_time,
  work_experience,
  education,
  languages,
  applicant_message
) on public.applications to anon;
