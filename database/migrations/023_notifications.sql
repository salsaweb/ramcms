-- =====================================================
-- Janzu Community Portal - Notifications
-- =====================================================

BEGIN;

-- 1. Create Notification Type Enum
DO $$ BEGIN
    CREATE TYPE app_notification_type AS ENUM ('system', 'session_request', 'feedback', 'certification', 'event');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    type app_notification_type NOT NULL DEFAULT 'system',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link_url VARCHAR(255),
    
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for quick unread badge counting
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- 3. Triggers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'notifications_updated_at') THEN
        CREATE TRIGGER notifications_updated_at
            BEFORE UPDATE ON notifications
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
END $$;

-- 4. Insert Permissions into RBAC
INSERT INTO permissions (name, description, resource, action) VALUES
    ('notifications.read', 'Read own notifications', 'notifications', 'read'),
    ('notifications.update', 'Mark notifications as read', 'notifications', 'update')
ON CONFLICT (name) DO NOTHING;

-- 5. Seed Permissions into Default Roles
DO $$ 
DECLARE 
  v_admin_role_id INT := 1;
  v_manager_role_id INT := 2;
  v_practitioner_role_id INT := 3;
  v_user_role_id INT := 4; 
  -- Generic injection logic
  rec RECORD;
BEGIN
  -- Every role in the system should be able to read and update their own notifications.
  FOR rec IN SELECT id FROM roles LOOP
     INSERT INTO role_permissions (role_id, permission_id)
     SELECT rec.id, id FROM permissions WHERE resource = 'notifications'
     ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

COMMIT;
