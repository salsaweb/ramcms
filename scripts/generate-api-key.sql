-- =====================================================
-- Generate API Key Script
-- =====================================================
-- Usage: psql $DATABASE_URL -f scripts/generate-api-key.sql
-- Then update the variables below before running
-- =====================================================

-- VARIABLES TO UPDATE:
-- Replace these values with your actual data
\set user_id '8418eb1d-21c6-458c-9464-ac22339c53bb'
\set key_name 'Test API Key'
\set expires_days 365

-- Generate API key
WITH new_key AS (
  INSERT INTO api_keys (user_id, name, key, expires_at, is_active)
  VALUES (
    :'user_id',
    :'key_name',
    'sk_live_' || md5(random()::text || clock_timestamp()::text),
    CASE 
      WHEN :'expires_days'::int > 0 
      THEN NOW() + (:'expires_days'::int || ' days')::interval
      ELSE NULL
    END,
    TRUE
  )
  RETURNING *
)
SELECT 
  '✅ API Key created successfully!' AS status,
  '' AS separator,
  'Name: ' || name AS key_name,
  'Key: ' || key AS api_key,
  'User ID: ' || user_id AS user_id,
  'Expires: ' || COALESCE(expires_at::text, 'Never') AS expires_at,
  '' AS separator2,
  '⚠️  SAVE THIS KEY - it will not be shown again!' AS warning
FROM new_key;