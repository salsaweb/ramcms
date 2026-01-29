-- =====================================================
-- Add User Role Management Permission
-- =====================================================

-- Add the users.manage_roles permission
INSERT INTO permissions (name, description, resource, action) VALUES
('users.manage_roles', 'Assign and remove roles from users', 'users', 'manage_roles')
ON CONFLICT (name) DO NOTHING;

-- Grant this permission to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin'
AND p.name = 'users.manage_roles'
ON CONFLICT DO NOTHING;

-- Verification
DO $$
DECLARE
    perm_exists BOOLEAN;
    admin_has_perm BOOLEAN;
BEGIN
    -- Check if permission exists
    SELECT EXISTS(SELECT 1 FROM permissions WHERE name = 'users.manage_roles') INTO perm_exists;
    
    -- Check if admin has it
    SELECT EXISTS(
        SELECT 1 
        FROM role_permissions rp
        INNER JOIN permissions p ON rp.permission_id = p.id
        INNER JOIN roles r ON rp.role_id = r.id
        WHERE r.name = 'admin' AND p.name = 'users.manage_roles'
    ) INTO admin_has_perm;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'User Role Management Permission';
    RAISE NOTICE '========================================';
    
    IF perm_exists THEN
        RAISE NOTICE '✓ Permission "users.manage_roles" exists';
    ELSE
        RAISE NOTICE '✗ Permission "users.manage_roles" NOT found';
    END IF;
    
    IF admin_has_perm THEN
        RAISE NOTICE '✓ Admin role has "users.manage_roles" permission';
    ELSE
        RAISE NOTICE '✗ Admin role DOES NOT have "users.manage_roles" permission';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;