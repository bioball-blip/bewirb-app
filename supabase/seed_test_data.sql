-- Testdaten für "Bewirb." - NICHT für Produktion gedacht, nur zum
-- manuellen Ausprobieren im Dashboard.
--
-- Läuft im SQL Editor mit vollen Rechten (nicht als eingeloggter
-- Hotel-Nutzer), deshalb greifen unsere RLS-Policies hier gar nicht -
-- das SQL Editor-Fenster "sieht" alles. Genau deshalb ist das nur zum
-- Testen: später entstehen echte Bewerbungen über die öffentliche
-- Bewerbungsseite, nicht per Hand im SQL Editor.
insert into public.applications (tenant_id, applicant_name, applicant_email, status)
select id, 'Anna Musterfrau', 'anna.musterfrau@example.com', 'eingegangen'
from public.tenants where name = 'Testhotel Alpenblick'
union all
select id, 'Max Beispiel', 'max.beispiel@example.com', 'in_pruefung'
from public.tenants where name = 'Testhotel Alpenblick'
union all
select id, 'Lea Test', 'lea.test@example.com', 'interview'
from public.tenants where name = 'Testhotel Alpenblick';

-- Testbewerbung für den zweiten Test-Tenant, gefunden über die
-- verknüpfte users-Zeile (robuster als über den Tenant-Namen zu gehen,
-- da dieser Tenant automatisch nach der E-Mail-Adresse benannt wurde).
insert into public.applications (tenant_id, applicant_name, applicant_email, status)
select u.tenant_id, 'Peter Sonnenschein', 'peter.sonnenschein@example.com', 'angenommen'
from public.users u
where u.email = 'bioball70+bewirbtest2@gmail.com';
