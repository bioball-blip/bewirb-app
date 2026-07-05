-- Sicherheitskorrektur: die Insert-Policy galt nur für die Rolle "anon"
-- (nicht eingeloggte Besucher). Ein bereits eingeloggter Tester, der die
-- Landingpage besucht, sendet Anfragen aber als "authenticated" - dafür
-- gab es keine Regel, also griff die Standard-Sperre von RLS. Jetzt für
-- beide Rollen freigegeben.
revoke insert on public.beta_requests from anon, authenticated;
grant insert (name, email, tenant_name)
  on public.beta_requests to anon, authenticated;

drop policy "anyone can submit a beta request" on public.beta_requests;
create policy "anyone can submit a beta request"
  on public.beta_requests for insert
  to anon, authenticated
  with check (true);
