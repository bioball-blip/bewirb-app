-- Härtung (Sicherheits-Audit Punkt 1): Die tenant-gebundenen Policies
-- liefen auf Rolle "public" (schließt anon ein). Funktional sicher, da
-- auth_tenant_id() für anon null ist – aber sauberer explizit auf
-- "authenticated" beschränkt. Die öffentlichen Formular-Policies (anon)
-- bleiben unverändert.
alter policy "tenant members manage their applications" on public.applications to authenticated;
alter policy "tenant members manage their job postings" on public.job_postings to authenticated;
alter policy "tenant members view status history of their applications" on public.status_history to authenticated;
alter policy "tenant members can view their tenant" on public.tenants to authenticated;
alter policy "tenant members can update their tenant" on public.tenants to authenticated;
alter policy "tenant members can view colleagues" on public.users to authenticated;
