-- =====================================================
-- Fix Role Name Constraint for Custom Roles
-- Allow custom role names with spaces and capitals
-- =====================================================

-- Remove the restrictive role_name_format constraint
ALTER TABLE roles DROP CONSTRAINT IF EXISTS role_name_format;

-- Add a more flexible constraint
-- Allow: letters, numbers, spaces, hyphens, underscores
-- Prevent: empty strings, leading/trailing spaces
ALTER TABLE roles ADD CONSTRAINT role_name_valid 
  CHECK (
    name IS NOT NULL 
    AND length(trim(name)) > 0 
    AND length(name) <= 100
    AND name = trim(name)
  );

COMMENT ON CONSTRAINT role_name_valid ON roles IS 'Role names must be non-empty, trimmed, and max 100 chars';

-- Verify existing roles still pass
SELECT 
  name,
  CASE 
    WHEN length(trim(name)) > 0 AND name = trim(name) THEN '✓ Valid'
    ELSE '✗ Invalid'
  END as status
FROM roles
ORDER BY name;

SELECT 'Role name constraint updated successfully!' AS status;