-- =====================================================
-- Janzu Community Portal - Seed Session Permissions
-- =====================================================

DO $$
DECLARE
    admin_role_id INT;
    practitioner_role_id INT;
BEGIN
    -- Insert new permissions if they don't exist
    INSERT INTO permissions (name, description, resource, action) VALUES
        ('sessions.create', 'Create new sessions', 'sessions', 'create'),
        ('sessions.read', 'Read sessions', 'sessions', 'read'),
        ('sessions.update', 'Update existing sessions', 'sessions', 'update'),
        ('sessions.delete', 'Delete sessions', 'sessions', 'delete')
    ON CONFLICT (name) DO NOTHING;

    -- Get Role IDs
    SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
    SELECT id INTO practitioner_role_id FROM roles WHERE name = 'practitioner';

    -- Assign to admin
    IF admin_role_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT admin_role_id, id FROM permissions WHERE resource = 'sessions'
        ON CONFLICT DO NOTHING;
    END IF;

    -- Assign to practitioner
    IF practitioner_role_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT practitioner_role_id, id FROM permissions WHERE resource = 'sessions'
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
