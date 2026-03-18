-- =====================================================
-- EMERGENCY FIX: Grant RBAC Permissions to Admin
-- Run this if you're getting forbidden errors
-- =====================================================

-- Check current admin permissions
SELECT 
  r.name as role_name,
  COUNT(p.id) as permission_count,
  STRING_AGG(p.name, ', ' ORDER BY p.name) as permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'admin'
GROUP BY r.name;

-- Grant roles.* permissions to admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
AND p.name IN (
  'roles.read',
  'roles.create',
  'roles.update',
  'roles.delete',
  'permissions.read'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Verify permissions were granted
SELECT 
  r.name as role_name,
  p.name as permission_name
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'admin'
AND p.name LIKE 'roles.%'
ORDER BY p.name;

-- Expected output:
-- admin | roles.create
-- admin | roles.delete
-- admin | roles.read
-- admin | roles.update

SELECT 'Permissions granted successfully! Please refresh your browser.' AS status;