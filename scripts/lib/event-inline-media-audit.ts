// Metadata only: dry runs never download image contents or upload anything.
export const INLINE_MEDIA_AUDIT_SQL = `with recursive walk as (
  select id,created_at,array[]::text[] as path,data as value from event_history
  union all
  select w.id,w.created_at,w.path||v.key,v.value from walk w
  cross join lateral (
    select key,value from jsonb_each(case when jsonb_typeof(w.value)='object' then w.value else '{}'::jsonb end)
    union all select (ordinality-1)::text,value from jsonb_array_elements(case when jsonb_typeof(w.value)='array' then w.value else '[]'::jsonb end) with ordinality
  ) v
) select id,created_at,path,octet_length(value#>>'{}') as bytes,
  substring(value#>>'{}' from '^data:([^;,]+)') as mime,md5(value#>>'{}') as signature,
  (value#>>'{}') ~* '^data:' as starts_data
from walk where jsonb_typeof(value)='string' and (value#>>'{}') ~* 'data:image/|^data:application/pdf|^blob:' order by id,path`;
