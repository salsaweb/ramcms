-- =====================================================
-- Seed Custom RBAC Permissions
-- =====================================================

-- Add roles.* permissions
INSERT INTO permissions (name, description, resource, action) VALUES
  ('roles.read', 'View roles and their permissions', 'roles', 'read'),
  ('roles.create', 'Create new custom roles', 'roles', 'create'),
  ('roles.update', 'Modify existing roles', 'roles', 'update'),
  ('roles.delete', 'Delete custom roles', 'roles', 'delete'),
  ('permissions.read', 'View all available permissions', 'permissions', 'read'),
  ('permissions.create', 'Create new permissions', 'permissions', 'create'),
  ('permissions.update', 'Modify existing permissions', 'permissions', 'update'),
  ('permissions.delete', 'Delete permissions', 'permissions', 'delete')
ON CONFLICT (name) DO NOTHING;

-- Grant to admin role
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

-- Make dangerous permission management permissions actually dangerous
UPDATE permissions
SET is_dangerous = TRUE, requires_confirmation = TRUE
WHERE name IN (
  'permissions.create',
  'permissions.update',
  'permissions.delete',
  'roles.delete'
);

-- Set role colors and icons for default roles
UPDATE roles SET 
  color = '#EF4444',
  icon = '👑',
  sort_order = 1
WHERE name = 'admin';

UPDATE roles SET 
  color = '#3B82F6',
  icon = '👤',
  sort_order = 2
WHERE name = 'user';

-- Verification
SELECT 
  r.name as role_name,
  COUNT(p.id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
GROUP BY r.name
ORDER BY r.name;