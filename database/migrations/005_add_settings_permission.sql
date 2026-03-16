-- =====================================================
-- Add settings.manage permission for custom fields
-- =====================================================

-- Add the permission
INSERT INTO permissions (name, description, category) 
VALUES (
  'settings.manage',
  'Manage system settings including custom fields',
  'settings'
) ON CONFLICT (name) DO NOTHING;

-- Grant to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
AND p.name = 'settings.manage'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Also grant to any user who has crm.admin permission (super users)
INSERT INTO role_permissions (role_id, permission_id)
SELECT DISTINCT rp.role_id, p.id
FROM role_permissions rp
INNER JOIN permissions p_admin ON rp.permission_id = p_admin.id
CROSS JOIN permissions p
WHERE p_admin.name = 'crm.admin'
AND p.name = 'settings.manage'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Verify the permission was added
SELECT 
  r.name as role_name,
  p.name as permission_name,
  p.description
FROM role_permissions rp
INNER JOIN roles r ON rp.role_id = r.id
INNER JOIN permissions p ON rp.permission_id = p.id
WHERE p.name = 'settings.manage'
ORDER BY r.name;