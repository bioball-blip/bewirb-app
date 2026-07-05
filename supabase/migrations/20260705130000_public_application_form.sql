-- Öffentliches Bewerbungsformular: anonyme Nutzer dürfen eine neue
-- Bewerbung für ein bestehendes Hotel ANLEGEN - aber nichts lesen oder
-- ändern (das bleibt weiterhin nur den Mitarbeitern des jeweiligen
-- Tenants vorbehalten, siehe erste Migration).

-- Spalten-Rechte: anon darf beim INSERT nur GENAU diese drei Spalten
-- überhaupt mitschicken. status, unique_token, id, created_at,
-- updated_at bleiben tabu - das gilt unabhängig von unserem Formular,
-- selbst bei einem direkten API-Aufruf.
grant insert (tenant_id, applicant_name, applicant_email)
  on public.applications to anon;

-- RLS-Policy: erlaubt das INSERT selbst. Dass tenant_id auf ein
-- tatsächlich existierendes Hotel zeigen muss, erzwingt schon der
-- Fremdschlüssel auf tenants - nicht diese Regel.
create policy "anyone can submit an application"
  on public.applications for insert
  to anon
  with check (true);

-- Damit die öffentliche Formularseite weiß, für welches Hotel sie
-- gerade eine Bewerbung entgegennimmt (Anzeige des Hotelnamens), ohne
-- die ganze tenants-Tabelle für anon zu öffnen: dieselbe Idee wie bei
-- get_application_status - eine eng zugeschnittene Funktion statt
-- einer Tabellen-Policy.
create or replace function public.get_tenant_name(p_tenant_id uuid)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select name from public.tenants where id = p_tenant_id
$$;

revoke all on function public.get_tenant_name(uuid) from public;
grant execute on function public.get_tenant_name(uuid) to anon, authenticated;
