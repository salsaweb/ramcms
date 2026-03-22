-- =====================================================
-- Migration 009: API Authentication & Authorization System
-- =====================================================
-- Description: Complete API authentication system with RBAC integration
-- Dependencies: Requires existing RBAC tables (users, roles, permissions, user_roles, role_permissions)
-- =====================================================

BEGIN;

-- =====================================================
-- 1. API KEYS TABLE
-- =====================================================
-- Stores API keys for third-party authentication
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  key VARCHAR(255) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE api_keys IS 'API keys for third-party authentication';
COMMENT ON COLUMN api_keys.name IS 'Human-readable name for the API key (e.g., "Production API", "Testing Key")';
COMMENT ON COLUMN api_keys.key IS 'The actual API key string (should be hashed in production)';
COMMENT ON COLUMN api_keys.is_active IS 'Whether the key is currently active';
COMMENT ON COLUMN api_keys.expires_at IS 'Optional expiration date for the key';
COMMENT ON COLUMN api_keys.last_used_at IS 'Last time this key was used successfully';

-- =====================================================
-- 2. API SESSIONS TABLE
-- =====================================================
-- Stores temporary session tokens for Bearer authentication
CREATE TABLE IF NOT EXISTS api_sessions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE api_sessions IS 'Bearer token sessions for API authentication';
COMMENT ON COLUMN api_sessions.token IS 'The Bearer token string';
COMMENT ON COLUMN api_sessions.expires_at IS 'When this session expires';

-- =====================================================
-- 3. API USAGE LOGS TABLE
-- =====================================================
-- Tracks API usage for monitoring, analytics, and billing
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id SERIAL PRIMARY KEY,
  api_key_id INTEGER REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status INTEGER,
  ip_address INET,
  user_agent TEXT,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE api_usage_logs IS 'API usage tracking for monitoring and analytics';
COMMENT ON COLUMN api_usage_logs.endpoint IS 'API endpoint that was called';
COMMENT ON COLUMN api_usage_logs.method IS 'HTTP method (GET, POST, PUT, DELETE, etc.)';
COMMENT ON COLUMN api_usage_logs.status IS 'HTTP status code returned';

-- =====================================================
-- 4. ADD CREATED_BY TO CONTACTS
-- =====================================================
-- Track which user created each contact via API
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

COMMENT ON COLUMN contacts.created_by IS 'User who created this contact via API';

-- =====================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_api_sessions_token ON api_sessions(token);
CREATE INDEX IF NOT EXISTS idx_api_sessions_user ON api_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_api_sessions_active ON api_sessions(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_key ON api_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created ON api_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_endpoint ON api_usage_logs(endpoint);

-- =====================================================
-- 6. CREATE CLEANUP FUNCTION
-- =====================================================
-- Function to remove expired sessions automatically
CREATE OR REPLACE FUNCTION cleanup_expired_api_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM api_sessions
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_api_sessions IS 'Removes expired API sessions (run periodically via cron)';

-- =====================================================
-- 7. ENSURE API PERMISSIONS EXIST
-- =====================================================
-- Insert API-related permissions if they don't exist
INSERT INTO permissions (name, description, category)
VALUES 
  ('contacts.create', 'Create new contacts via API', 'contacts'),
  ('contacts.read', 'Read contacts via API', 'contacts'),
  ('contacts.update', 'Update contacts via API', 'contacts'),
  ('contacts.delete', 'Delete contacts via API', 'contacts'),
  ('companies.create', 'Create new companies via API', 'companies'),
  ('companies.read', 'Read companies via API', 'companies'),
  ('companies.update', 'Update companies via API', 'companies'),
  ('companies.delete', 'Delete companies via API', 'companies')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 8. GRANT API PERMISSIONS TO ADMIN ROLE
-- =====================================================
-- Ensure admin role has all API permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
AND p.name IN (
  'contacts.create', 'contacts.read', 'contacts.update', 'contacts.delete',
  'companies.create', 'companies.read', 'companies.update', 'companies.delete'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- =====================================================
-- 9. CREATE HELPER VIEW
-- =====================================================
-- View to see API keys with user details and permission count
CREATE OR REPLACE VIEW api_keys_with_details AS
SELECT 
  ak.id,
  ak.name,
  ak.key,
  ak.is_active,
  ak.expires_at,
  ak.last_used_at,
  ak.created_at,
  u.email as user_email,
  COUNT(DISTINCT p.id) as permission_count
FROM api_keys ak
JOIN users u ON ak.user_id = u.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN role_permissions rp ON ur.role_id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
GROUP BY ak.id, ak.name, ak.key, ak.is_active, ak.expires_at, ak.last_used_at, ak.created_at, u.email;

COMMENT ON VIEW api_keys_with_details IS 'API keys with user details and permission counts';

-- =====================================================
-- 10. CREATE AUDIT TRIGGER (OPTIONAL)
-- =====================================================
-- Trigger to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_api_keys_timestamp ON api_keys;
CREATE TRIGGER trigger_update_api_keys_timestamp
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_api_keys_updated_at();

-- =====================================================
-- 11. VERIFICATION QUERIES
-- =====================================================
-- Check that everything was created successfully
DO $$
DECLARE
  v_table_count INTEGER;
  v_index_count INTEGER;
  v_permission_count INTEGER;
BEGIN
  -- Check tables
  SELECT COUNT(*) INTO v_table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('api_keys', 'api_sessions', 'api_usage_logs');

  IF v_table_count < 3 THEN
    RAISE EXCEPTION 'Not all tables were created. Expected 3, found %', v_table_count;
  END IF;

  -- Check indexes
  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND indexname LIKE 'idx_api_%';

  IF v_index_count < 9 THEN
    RAISE WARNING 'Expected at least 9 indexes, found %', v_index_count;
  END IF;

  -- Check permissions
  SELECT COUNT(*) INTO v_permission_count
  FROM permissions
  WHERE category IN ('contacts', 'companies')
  AND name LIKE '%create' OR name LIKE '%read' OR name LIKE '%update' OR name LIKE '%delete';

  IF v_permission_count < 8 THEN
    RAISE WARNING 'Expected at least 8 API permissions, found %', v_permission_count;
  END IF;

  RAISE NOTICE '✅ All tables created successfully';
  RAISE NOTICE '✅ % indexes created', v_index_count;
  RAISE NOTICE '✅ % API permissions available', v_permission_count;
END $$;

COMMIT;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
SELECT 
  '✅ Migration 009 completed successfully!' as status,
  NOW() as completed_at;

-- =====================================================
-- POST-MIGRATION INSTRUCTIONS
-- =====================================================
-- 1. Generate API key for a user:
--    npm run generate-api-key <user_id> "Key Name" 365
--
-- 2. Grant permissions to user via role:
--    INSERT INTO user_roles (user_id, role_id)
--    SELECT '<user_id>', id FROM roles WHERE name = 'admin';
--
-- 3. Test API:
--    curl -X POST http://localhost:3000/api/crm/contacts \
--      -H "Content-Type: application/json" \
--      -H "x-api-key: YOUR_KEY_HERE" \
--      -d '{"first_name":"John","last_name":"Doe","email":"john@example.com"}'
--
-- 4. View API keys:
--    SELECT * FROM api_keys_with_details;
--
-- 5. Monitor usage:
--    SELECT endpoint, method, COUNT(*) as request_count
--    FROM api_usage_logs
--    GROUP BY endpoint, method
--    ORDER BY request_count DESC;
-- =====================================================