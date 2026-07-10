-- Etappe 3b: Öffentliche Bewerbungsseite darf den Namen einer Filiale
-- anzeigen (für filialspezifische Initiativ-Links /apply/:tenant?loc=...),
-- ohne die ganze locations-Tabelle für Anonyme freizugeben.
-- Gibt den Namen nur zurück, wenn die Filiale wirklich zu dem Betrieb gehört.
create or replace function public.get_location_name(
  p_tenant_id uuid,
  p_location_id uuid
)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select name
  from public.locations
  where id = p_location_id and tenant_id = p_tenant_id
$$;

grant execute on function public.get_location_name(uuid, uuid) to anon, authenticated;
