ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_signup_source text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS product_scopes text[];
ALTER TABLE users ALTER COLUMN product_scopes SET DEFAULT ARRAY['snap']::text[];

WITH gymnastics_users AS (
  SELECT DISTINCT eh.user_id
  FROM event_history eh
  WHERE eh.user_id IS NOT NULL
    AND (
      lower(coalesce(eh.data->>'category', '')) LIKE '%gymnastics%'
      OR lower(coalesce(eh.data->>'templateId', '')) LIKE '%gymnastics%'
      OR lower(coalesce(eh.data->>'createdVia', '')) LIKE '%meet-discovery%'
    )
)
UPDATE users u
SET product_scopes = ARRAY['snap', 'gymnastics']::text[],
    primary_signup_source = coalesce(u.primary_signup_source, 'legacy')
FROM gymnastics_users gu
WHERE u.id = gu.user_id
  AND (u.product_scopes IS NULL OR cardinality(u.product_scopes) = 0);

UPDATE users
SET product_scopes = ARRAY['snap']::text[],
    primary_signup_source = coalesce(primary_signup_source, 'legacy')
WHERE product_scopes IS NULL OR cardinality(product_scopes) = 0;

UPDATE users
SET primary_signup_source = 'legacy'
WHERE primary_signup_source IS NULL OR btrim(primary_signup_source) = '';
