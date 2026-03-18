-- =====================================================
-- Custom RBAC System Migration
-- Allow users to create custom roles and manage permissions
-- =====================================================

-- =====================================================
-- ADD ROLE MANAGEMENT FIELDS
-- =====================================================

-- Add system flag to roles (system roles can't be deleted)
ALTER TABLE roles 
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS color VARCHAR(20),
ADD COLUMN IF NOT EXISTS icon VARCHAR(50),
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Update existing roles to be system roles
UPDATE roles 
SET is_system = TRUE 
WHERE name IN ('admin', 'user');

-- Add metadata to roles
COMMENT ON COLUMN roles.is_system IS 'System roles cannot be deleted or renamed';
COMMENT ON COLUMN roles.color IS 'Display color for role badge (hex or named color)';
COMMENT ON COLUMN roles.icon IS 'Icon identifier for role';

-- =====================================================
-- PERMISSION CATEGORIES & METADATA
-- =====================================================

-- Add more metadata to permissions
ALTER TABLE permissions
ADD COLUMN IF NOT EXISTS is_dangerous BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS requires_confirmation BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS parent_permission VARCHAR(100);

-- Mark dangerous permissions
UPDATE permissions 
SET is_dangerous = TRUE,
    requires_confirmation = TRUE
WHERE name IN (
  'users.delete',
  'roles.delete',
  'permissions.delete',
  'system.reset',
  'audit.delete'
);

COMMENT ON COLUMN permissions.is_dangerous IS 'Dangerous permissions require extra confirmation';
COMMENT ON COLUMN permissions.requires_confirmation IS 'Require user confirmation before granting';
COMMENT ON COLUMN permissions.parent_permission IS 'Parent permission for hierarchical permissions';

-- =====================================================
-- ROLE TEMPLATES (for quick role creation)
-- =====================================================

CREATE TABLE IF NOT EXISTS role_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  template_permissions JSONB NOT NULL, -- Array of permission names
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_role_templates_active ON role_templates(is_active);

COMMENT ON TABLE role_templates IS 'Pre-defined role templates for quick role creation';

-- =====================================================
-- PERMISSION GROUPS (for organized UI)
-- =====================================================

CREATE TABLE IF NOT EXISTS permission_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_permission_groups_order ON permission_groups(sort_order);

-- Link permissions to groups
ALTER TABLE permissions
ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES permission_groups(id) ON DELETE SET NULL;

-- =====================================================
-- ROLE HIERARCHY (for role inheritance)
-- =====================================================

CREATE TABLE IF NOT EXISTS role_hierarchy (
  parent_role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  child_role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (parent_role_id, child_role_id),
  CONSTRAINT no_self_reference CHECK (parent_role_id != child_role_id)
);

CREATE INDEX IF NOT EXISTS idx_role_hierarchy_parent ON role_hierarchy(parent_role_id);
CREATE INDEX IF NOT EXISTS idx_role_hierarchy_child ON role_hierarchy(child_role_id);

COMMENT ON TABLE role_hierarchy IS 'Child roles inherit all permissions from parent roles';

-- =====================================================
-- CUSTOM ROLE AUDIT LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS role_audit_log (
  id SERIAL PRIMARY KEY,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'permission_added', 'permission_removed'
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  changes JSONB, -- Store what changed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_role_audit_role ON role_audit_log(role_id);
CREATE INDEX IF NOT EXISTS idx_role_audit_date ON role_audit_log(created_at DESC);

COMMENT ON TABLE role_audit_log IS 'Audit trail for all role changes';

-- =====================================================
-- SEED PERMISSION GROUPS
-- =====================================================

INSERT INTO permission_groups (name, description, sort_order, icon) VALUES
  ('Users & Authentication', 'User management and authentication', 1, '👥'),
  ('CRM', 'Customer Relationship Management', 2, '📊'),
  ('Settings', 'System and application settings', 3, '⚙️'),
  ('Reports & Analytics', 'Reporting and analytics access', 4, '📈'),
  ('Administration', 'Administrative functions', 5, '🔧')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- ASSIGN PERMISSIONS TO GROUPS
-- =====================================================

-- Use resource column instead of category
UPDATE permissions SET group_id = (SELECT id FROM permission_groups WHERE name = 'Users & Authentication')
WHERE resource = 'users' OR resource = 'auth';

UPDATE permissions SET group_id = (SELECT id FROM permission_groups WHERE name = 'CRM')
WHERE resource IN ('contacts', 'companies', 'deals', 'tasks', 'activities');

UPDATE permissions SET group_id = (SELECT id FROM permission_groups WHERE name = 'Settings')
WHERE resource = 'settings';

UPDATE permissions SET group_id = (SELECT id FROM permission_groups WHERE name = 'Reports & Analytics')
WHERE resource = 'reports' OR name LIKE 'crm.reports%';

UPDATE permissions SET group_id = (SELECT id FROM permission_groups WHERE name = 'Administration')
WHERE resource = 'admin' OR name LIKE 'roles.%' OR name LIKE 'permissions.%';

-- =====================================================
-- SEED ROLE TEMPLATES
-- =====================================================

INSERT INTO role_templates (name, description, template_permissions) VALUES
  (
    'Sales Representative',
    'Full access to CRM with contact and deal management',
    '["contacts.read", "contacts.create", "contacts.update", "companies.read", "companies.create", "deals.read", "deals.create", "deals.update", "tasks.read", "tasks.create", "tasks.update", "activities.read", "activities.create"]'::jsonb
  ),
  (
    'Sales Manager',
    'Sales rep permissions plus team management and reporting',
    '["contacts.read", "contacts.create", "contacts.update", "contacts.delete", "companies.read", "companies.create", "companies.update", "deals.read", "deals.create", "deals.update", "deals.close", "tasks.read", "tasks.create", "tasks.update", "tasks.assign", "activities.read", "activities.create", "crm.reports"]'::jsonb
  ),
  (
    'Marketing User',
    'Contact management and campaign access',
    '["contacts.read", "contacts.create", "contacts.update", "companies.read", "activities.read", "activities.create"]'::jsonb
  ),
  (
    'Support Agent',
    'Read-only CRM access with task management',
    '["contacts.read", "companies.read", "deals.read", "tasks.read", "tasks.create", "tasks.update", "activities.read", "activities.create"]'::jsonb
  ),
  (
    'Read-Only User',
    'View-only access to CRM',
    '["contacts.read", "companies.read", "deals.read", "tasks.read", "activities.read"]'::jsonb
  )
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get all permissions for a role (including inherited)
CREATE OR REPLACE FUNCTION get_role_permissions(p_role_id INTEGER)
RETURNS TABLE(permission_id INTEGER, permission_name VARCHAR) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE role_tree AS (
    -- Base case: the role itself
    SELECT p_role_id as role_id
    
    UNION
    
    -- Recursive case: parent roles
    SELECT rh.parent_role_id
    FROM role_hierarchy rh
    INNER JOIN role_tree rt ON rh.child_role_id = rt.role_id
  )
  SELECT DISTINCT p.id, p.name
  FROM role_tree rt
  INNER JOIN role_permissions rp ON rt.role_id = rp.role_id
  INNER JOIN permissions p ON rp.permission_id = p.id
  ORDER BY p.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if role name is available
CREATE OR REPLACE FUNCTION is_role_name_available(p_name VARCHAR, p_exclude_id INTEGER DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM roles 
    WHERE LOWER(name) = LOWER(p_name)
    AND (p_exclude_id IS NULL OR id != p_exclude_id)
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to create role from template
CREATE OR REPLACE FUNCTION create_role_from_template(
  p_template_id INTEGER,
  p_role_name VARCHAR,
  p_role_description TEXT,
  p_created_by UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_new_role_id INTEGER;
  v_template RECORD;
  v_permission_name VARCHAR;
BEGIN
  -- Get template
  SELECT * INTO v_template
  FROM role_templates
  WHERE id = p_template_id AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found or inactive';
  END IF;
  
  -- Check if role name is available
  IF NOT is_role_name_available(p_role_name) THEN
    RAISE EXCEPTION 'Role name already exists';
  END IF;
  
  -- Create role
  INSERT INTO roles (name, description, is_system)
  VALUES (p_role_name, p_role_description, FALSE)
  RETURNING id INTO v_new_role_id;
  
  -- Assign permissions from template
  FOR v_permission_name IN 
    SELECT jsonb_array_elements_text(v_template.template_permissions)
  LOOP
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_new_role_id, p.id
    FROM permissions p
    WHERE p.name = v_permission_name
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  -- Audit log
  INSERT INTO role_audit_log (role_id, action, changed_by, changes)
  VALUES (
    v_new_role_id,
    'created',
    p_created_by,
    jsonb_build_object(
      'template_id', p_template_id,
      'template_name', v_template.name
    )
  );
  
  RETURN v_new_role_id;
END;
$$ LANGUAGE plpgsql;

-- Function to safely delete a role
CREATE OR REPLACE FUNCTION delete_custom_role(
  p_role_id INTEGER,
  p_deleted_by UUID,
  p_reassign_to_role_id INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_role RECORD;
  v_user_count INTEGER;
BEGIN
  -- Get role details
  SELECT * INTO v_role FROM roles WHERE id = p_role_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Role not found';
  END IF;
  
  -- Cannot delete system roles
  IF v_role.is_system THEN
    RAISE EXCEPTION 'Cannot delete system role';
  END IF;
  
  -- Count users with this role
  SELECT COUNT(*) INTO v_user_count
  FROM user_roles
  WHERE role_id = p_role_id;
  
  -- If users exist and no reassignment role provided, error
  IF v_user_count > 0 AND p_reassign_to_role_id IS NULL THEN
    RAISE EXCEPTION 'Role has % users. Provide reassignment role.', v_user_count;
  END IF;
  
  -- Reassign users if needed
  IF v_user_count > 0 THEN
    UPDATE user_roles
    SET role_id = p_reassign_to_role_id
    WHERE role_id = p_role_id;
  END IF;
  
  -- Audit log
  INSERT INTO role_audit_log (role_id, action, changed_by, changes)
  VALUES (
    p_role_id,
    'deleted',
    p_deleted_by,
    jsonb_build_object(
      'user_count', v_user_count,
      'reassigned_to', p_reassign_to_role_id
    )
  );
  
  -- Delete role
  DELETE FROM roles WHERE id = p_role_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to clone a role
CREATE OR REPLACE FUNCTION clone_role(
  p_source_role_id INTEGER,
  p_new_role_name VARCHAR,
  p_new_role_description TEXT,
  p_cloned_by UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_new_role_id INTEGER;
  v_source_role RECORD;
BEGIN
  -- Get source role
  SELECT * INTO v_source_role FROM roles WHERE id = p_source_role_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source role not found';
  END IF;
  
  -- Check name availability
  IF NOT is_role_name_available(p_new_role_name) THEN
    RAISE EXCEPTION 'Role name already exists';
  END IF;
  
  -- Create new role
  INSERT INTO roles (name, description, is_system, color, icon)
  VALUES (
    p_new_role_name,
    p_new_role_description,
    FALSE,
    v_source_role.color,
    v_source_role.icon
  )
  RETURNING id INTO v_new_role_id;
  
  -- Copy permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_new_role_id, permission_id
  FROM role_permissions
  WHERE role_id = p_source_role_id;
  
  -- Audit log
  INSERT INTO role_audit_log (role_id, action, changed_by, changes)
  VALUES (
    v_new_role_id,
    'created',
    p_cloned_by,
    jsonb_build_object(
      'cloned_from_role_id', p_source_role_id,
      'cloned_from_role_name', v_source_role.name
    )
  );
  
  RETURN v_new_role_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- UPDATE TRIGGERS
-- =====================================================

CREATE TRIGGER role_templates_updated_at
  BEFORE UPDATE ON role_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- VIEWS FOR EASY QUERYING
-- =====================================================

-- View: Roles with permission count
CREATE OR REPLACE VIEW roles_with_stats AS
SELECT 
  r.id,
  r.name,
  r.description,
  r.is_system,
  r.color,
  r.icon,
  r.sort_order,
  COUNT(DISTINCT rp.permission_id) as permission_count,
  COUNT(DISTINCT ur.user_id) as user_count,
  r.created_at,
  r.updated_at
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN user_roles ur ON r.id = ur.role_id
GROUP BY r.id, r.name, r.description, r.is_system, r.color, r.icon, r.sort_order, r.created_at, r.updated_at;

-- View: Permissions grouped
CREATE OR REPLACE VIEW permissions_grouped AS
SELECT 
  p.id,
  p.name,
  p.description,
  p.resource,
  p.action,
  p.is_dangerous,
  p.requires_confirmation,
  pg.id as group_id,
  pg.name as group_name,
  pg.icon as group_icon,
  pg.sort_order as group_sort_order
FROM permissions p
LEFT JOIN permission_groups pg ON p.group_id = pg.id
ORDER BY pg.sort_order, p.resource, p.name;

COMMENT ON VIEW roles_with_stats IS 'Roles with permission and user counts';
COMMENT ON VIEW permissions_grouped IS 'Permissions organized by groups';

-- Grant access to views
-- GRANT SELECT ON roles_with_stats TO authenticated;
-- GRANT SELECT ON permissions_grouped TO authenticated;