-- Sicherheitskorrektur zur vorigen Migration: die spaltenspezifische
-- Rechtevergabe griff NICHT, weil "anon" von Supabase standardmäßig
-- schon volle INSERT-Rechte auf die ganze Tabelle hat - ein
-- zusätzliches, engeres GRANT kommt nur oben drauf, statt die
-- bestehenden Rechte zu ersetzen. Ein Test hat aufgedeckt, dass eine
-- anonyme Anfrage trotzdem direkt status = 'angenommen' setzen konnte.

-- 1) Die breite INSERT-Berechtigung von anon zurücknehmen, damit die
--    folgende spaltenspezifische Freigabe überhaupt etwas einschränkt.
revoke insert on public.applications from anon;
grant insert (tenant_id, applicant_name, applicant_email)
  on public.applications to anon;

-- 2) Verteidigung in der Tiefe: die RLS-Regel prüft jetzt zusätzlich
--    den tatsächlichen Wert von status. Bleibt sicher, selbst falls
--    sich an den Tabellenrechten künftig nochmal etwas ändert.
drop policy "anyone can submit an application" on public.applications;
create policy "anyone can submit an application"
  on public.applications for insert
  to anon
  with check (status = 'eingegangen');

-- Testdatensatz des Angriffsversuchs von eben wieder entfernen.
delete from public.applications where applicant_email = 'angreifer@example.com';
