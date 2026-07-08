-- Bewerbungsformular überarbeitet: zwei neue Felder (angestrebte Stelle
-- als Freitext, Gehaltsvorstellung). Die alten Spalten location,
-- desired_working_time und education bleiben erhalten, damit bereits
-- eingegangene Bewerbungen nichts verlieren - sie werden nur nicht mehr
-- über das öffentliche Formular abgefragt.
alter table public.applications
  add column desired_position text,
  add column salary_expectation text;

-- Anonyme Bewerber dürfen die neuen Felder beim Absenden mitschicken.
-- Grants sind additiv, daher erst die bestehende Insert-Freigabe
-- zurücknehmen und dann mit der aktuellen Spaltenliste neu setzen.
-- location, desired_working_time und education stehen bewusst NICHT mehr
-- in der Liste (werden vom neuen Formular nicht mehr gesendet).
revoke insert on public.applications from anon;
grant insert (
  tenant_id,
  applicant_name,
  applicant_email,
  job_posting_id,
  phone,
  desired_position,
  available_from,
  salary_expectation,
  languages,
  work_experience,
  applicant_message
) on public.applications to anon;
