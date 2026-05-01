-- =====================================================
-- Obrys CRM — Seed RBAC Permissions for Customers & Orders
-- Seed 009
-- =====================================================

-- Insert permissions (ignore if already exist)
INSERT INTO permissions (name, description, resource, action) VALUES
    ('customers.create',   'Create new customers', 'customers', 'create'),
    ('customers.read',     'View customer list and profiles', 'customers', 'read'),
    ('customers.update',   'Edit customer details', 'customers', 'update'),
    ('customers.delete',   'Delete customers', 'customers', 'delete'),
    ('orders.create',      'Create new orders', 'orders', 'create'),
    ('orders.read',        'View all orders', 'orders', 'read'),
    ('orders.update',      'Edit order details', 'orders', 'update'),
    ('orders.delete',      'Delete orders', 'orders', 'delete')
ON CONFLICT (name) DO NOTHING;

-- Grant all customer/order permissions to the admin role
-- (assumes role name 'admin' — adjust if your admin role name differs)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND p.name IN (
      'customers.create',
      'customers.read',
      'customers.update',
      'customers.delete',
      'orders.create',
      'orders.read',
      'orders.update',
      'orders.delete'
  )
ON CONFLICT DO NOTHING;
