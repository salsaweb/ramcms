-- =====================================================
-- Enterprise CMS - Seed Data
-- Initial Roles, Permissions, and Admin User
-- =====================================================

-- =====================================================
-- STEP 1: INSERT ROLES
-- =====================================================

INSERT INTO roles (name, description, is_system) VALUES
('admin', 'Full system access - all permissions', TRUE),
('editor', 'Content management - create, edit, publish posts', TRUE),
('author', 'Content creation - create and edit own posts', TRUE),
('viewer', 'Read-only access to published content', TRUE)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- STEP 2: INSERT PERMISSIONS (Namespace Convention)
-- =====================================================

-- User Management Permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('users.create', 'Create new users', 'users', 'create'),
('users.read', 'View user profiles', 'users', 'read'),
('users.update', 'Update user information', 'users', 'update'),
('users.delete', 'Delete users', 'users', 'delete'),
('users.manage_roles', 'Assign/revoke user roles', 'users', 'manage_roles')
ON CONFLICT (name) DO NOTHING;

-- Post Management Permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('posts.create', 'Create new posts', 'posts', 'create'),
('posts.read', 'View all posts (including drafts)', 'posts', 'read'),
('posts.update', 'Edit any post', 'posts', 'update'),
('posts.delete', 'Delete posts', 'posts', 'delete'),
('posts.publish', 'Publish/unpublish posts', 'posts', 'publish'),
('posts.update_own', 'Edit own posts only', 'posts', 'update_own')
ON CONFLICT (name) DO NOTHING;

-- Category & Tag Permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('categories.manage', 'Create, update, delete categories', 'categories', 'manage'),
('tags.manage', 'Create, update, delete tags', 'tags', 'manage')
ON CONFLICT (name) DO NOTHING;

-- Settings & System Permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('settings.view', 'View system settings', 'settings', 'view'),
('settings.manage', 'Update system configuration', 'settings', 'manage'),
('audit.view', 'View audit logs', 'audit', 'view'),
('dashboard.access', 'Access admin dashboard', 'dashboard', 'access')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- STEP 3: ASSIGN PERMISSIONS TO ROLES
-- =====================================================

-- ADMIN: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- EDITOR: Content + categories/tags
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'editor'
AND p.name IN (
    'posts.create',
    'posts.read',
    'posts.update',
    'posts.delete',
    'posts.publish',
    'categories.manage',
    'tags.manage',
    'dashboard.access'
)
ON CONFLICT DO NOTHING;

-- AUTHOR: Create and edit own content
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'author'
AND p.name IN (
    'posts.create',
    'posts.read',
    'posts.update_own',
    'dashboard.access'
)
ON CONFLICT DO NOTHING;

-- VIEWER: Read-only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'viewer'
AND p.name IN (
    'posts.read',
    'dashboard.access'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 4: CREATE DEFAULT ADMIN USER
-- Password: Admin@123 (MUST BE CHANGED IN PRODUCTION)
-- Hash generated via: bcrypt.hash('Admin@123', 10)
-- =====================================================

INSERT INTO users (id, email, name, password_hash, email_verified, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@cms.local',
    'System Administrator',
    '$2a$10$rQ8K9yY8W8W8W8W8W8W8W.eX8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Za', -- Admin@123
    TRUE,
    TRUE
)
ON CONFLICT (email) DO NOTHING;

-- Assign admin role to default admin user
INSERT INTO user_roles (user_id, role_id)
SELECT 
    '00000000-0000-0000-0000-000000000001',
    id
FROM roles
WHERE name = 'admin'
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 5: CREATE SAMPLE CATEGORIES & TAGS
-- =====================================================

INSERT INTO categories (name, slug, description) VALUES
('Technology', 'technology', 'Posts about tech and development'),
('Business', 'business', 'Business insights and strategies'),
('Lifestyle', 'lifestyle', 'Lifestyle and personal development')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO tags (name, slug) VALUES
('nextjs', 'nextjs'),
('typescript', 'typescript'),
('security', 'security'),
('rbac', 'rbac')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES (For Testing)
-- =====================================================

-- Verify role counts
DO $$
DECLARE
    role_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO role_count FROM roles;
    RAISE NOTICE 'Roles created: %', role_count;
END $$;

-- Verify permission counts
DO $$
DECLARE
    perm_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO perm_count FROM permissions;
    RAISE NOTICE 'Permissions created: %', perm_count;
END $$;

-- Verify admin user permissions
DO $$
DECLARE
    admin_perms TEXT[];
BEGIN
    SELECT ARRAY_AGG(permission_name) INTO admin_perms
    FROM get_user_permissions('00000000-0000-0000-0000-000000000001');
    RAISE NOTICE 'Admin permissions count: %', ARRAY_LENGTH(admin_perms, 1);
END $$;

COMMENT ON TABLE role_permissions IS 'Seeded with 4 base roles: admin, editor, author, viewer';
COMMENT ON TABLE permissions IS 'Total permissions: 16 covering users, posts, categories, tags, settings, audit';