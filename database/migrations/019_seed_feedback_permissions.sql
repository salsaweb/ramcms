-- =====================================================
-- Janzu Community Portal - Seed Feedback Permissions
-- =====================================================

DO $$
DECLARE
    admin_role_id INT;
    practitioner_role_id INT;
BEGIN
    -- Insert new permissions if they don't exist
    INSERT INTO permissions (name, description, resource, action) VALUES
        ('feedback.create', 'Create new feedback', 'feedback', 'create'),
        ('feedback.read', 'Read feedback', 'feedback', 'read'),
        ('feedback.update', 'Update existing feedback', 'feedback', 'update'),
        ('feedback.delete', 'Delete feedback', 'feedback', 'delete')
    ON CONFLICT (name) DO NOTHING;

    -- Get Role IDs
    SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
    SELECT id INTO practitioner_role_id FROM roles WHERE name = 'practitioner';

    -- Assign to admin
    IF admin_role_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT admin_role_id, id FROM permissions WHERE resource = 'feedback'
        ON CONFLICT DO NOTHING;
    END IF;

    -- Assign to practitioner
    IF practitioner_role_id IS NOT NULL THEN
        -- Practitioners only get read and create
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT practitioner_role_id, id FROM permissions WHERE resource = 'feedback' AND action IN ('read', 'create')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
