-- Etappe 3a: Bewerbungen automatisch der richtigen Filiale zuordnen.
--
-- - Bewerbung auf eine Stelle  -> Filiale wird von der Stelle übernommen.
-- - Initiativbewerbung über einen filialspezifischen Link -> die im Link
--   übergebene Filiale wird übernommen, ABER serverseitig geprüft, dass sie
--   zum selben Betrieb gehört (sonst verworfen). So kann der Client keine
--   fremde Filiale unterschieben.
create or replace function public.set_application_location()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.job_posting_id is not null then
    select location_id into new.location_id
    from public.job_postings
    where id = new.job_posting_id;
  end if;

  if new.location_id is not null and not exists (
    select 1 from public.locations
    where id = new.location_id and tenant_id = new.tenant_id
  ) then
    new.location_id := null;
  end if;

  return new;
end;
$$;

create trigger applications_set_location
  before insert on public.applications
  for each row
  execute function public.set_application_location();

-- Anonyme Bewerber dürfen die (vom Link vorgeschlagene) Filiale mitschicken;
-- der Trigger oben validiert sie. Grants sind additiv.
grant insert (location_id) on public.applications to anon;
