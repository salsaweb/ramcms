# 👥 User & Role Management Documentation

## Overview

The Enterprise CMS now includes **comprehensive user and role management** functionality, allowing administrators to manage user permissions through an intuitive web interface.

## 🎯 Key Features

✅ **User Management** - View all users, manage their roles and status  
✅ **Role Assignment** - Assign/remove roles from users  
✅ **Permission Editor** - Visually edit role permissions  
✅ **User Status Control** - Activate/deactivate user accounts  
✅ **Audit Logging** - All role changes are logged  
✅ **Permission-Based Access** - Only users with `users.manage_roles` can access

## 🔐 Required Permission

To access user and role management features, users need:

- **`users.manage_roles`** - Full access to assign roles and edit permissions

## 📂 New Pages

### 1. Users List (`/dashboard/users`)

- Shows all users in the system
- Click on any user to manage their roles
- **Permission Required**: `users.read`

### 2. User Detail (`/dashboard/users/[id]`)

- View user information
- Assign/remove roles
- View effective permissions
- Activate/deactivate user
- **Permission Required**: `users.manage_roles`

### 3. Roles List (`/dashboard/roles`)

- Shows all available roles
- See permission count for each role
- Click to edit role permissions
- **Permission Required**: `users.manage_roles`

### 4. Role Editor (`/dashboard/roles/[id]`)

- Visual permission editor
- Group permissions by resource
- Select/deselect permissions
- Warning for system roles
- **Permission Required**: `users.manage_roles`

## 🎨 UI Components

All new components are in `/components/users/`:

1. **`assign-role-form.tsx`** - Form to assign roles to users
2. **`remove-role-button.tsx`** - Button with confirmation to remove roles
3. **`user-status-toggle.tsx`** - Toggle to activate/deactivate users
4. **`role-permissions-editor.tsx`** - Full-featured permission editor

## 🔄 Server Actions

New actions in `/app/actions/user-management.ts`:

```typescript
// Get user with all roles and permissions
getUserWithPermissions(userId: string)

// Get all roles with permission counts
getAllRoles()

// Get all permissions grouped by resource
getAllPermissions()

// Assign a role to a user
assignRoleToUser({ userId, roleId })

// Remove a role from a user
removeRoleFromUser({ userId, roleId })

// Activate or deactivate a user
updateUserStatus(userId: string, isActive: boolean)

// Get role with all its permissions
getRoleWithPermissions(roleId: number)

// Update all permissions for a role
updateRolePermissions(roleId: number, permissionIds: number[])
```

## 📋 Usage Examples

### Assigning a Role to a User

**Via UI:**

1. Go to `/dashboard/users`
2. Click on a user's name
3. In the "Assigned Roles" section, select a role from dropdown
4. Click "Assign Role"

**Via Code:**

```typescript
import { assignRoleToUser } from "@/app/actions/user-management";

const result = await assignRoleToUser({
  userId: "user-uuid-here",
  roleId: 2, // e.g., sales_rep role
});
```

### Editing Role Permissions

**Via UI:**

1. Go to `/dashboard/roles`
2. Click on a role
3. Check/uncheck permissions
4. Click "Save Changes"

**Via Code:**

```typescript
import { updateRolePermissions } from "@/app/actions/user-management";

// Grant only posts.read and posts.create to a role
const result = await updateRolePermissions(
  roleId,
  [1, 2], // permission IDs
);
```

### Deactivating a User

**Via UI:**

1. Go to `/dashboard/users/[user-id]`
2. Click "Deactivate User" button

**Via Code:**

```typescript
import { updateUserStatus } from "@/app/actions/user-management";

const result = await updateUserStatus("user-uuid", false);
```

## 🛡️ Security Features

### 1. Permission Checks

All actions require `users.manage_roles` permission:

```typescript
const session = await requirePermission("users.manage_roles");
```

### 2. Self-Protection

Users cannot deactivate their own accounts:

```typescript
if (userId === adminId && !isActive) {
  return { error: "You cannot deactivate your own account" };
}
```

### 3. Audit Logging

All role changes are logged:

```typescript
await supabaseAdmin.from("audit_logs").insert({
  user_id: adminId,
  action: "user.role_assigned",
  resource_type: "users",
  resource_id: userId,
  metadata: { role_id, role_name },
});
```

### 4. System Role Warnings

When editing system roles (admin, editor, etc.), users see a warning:

```
⚠️ System Role
This is a system role. Modifying its permissions may affect core
application functionality. Proceed with caution.
```

## 🎯 Default Roles & Permissions

### Admin Role

**Permissions**: ALL (including `users.manage_roles`)

- Can manage all users
- Can edit all role permissions
- Can assign/remove any role

### Sales Rep Role

**Permissions**: Full CRM + limited user management

- Can view users (`users.read`)
- Cannot manage roles

### Editor Role

**Permissions**: Content management

- Can view users (`users.read`)
- Cannot manage roles

### Author Role

**Permissions**: Limited content

- Cannot view users
- Cannot manage roles

## 🚀 Installation

### 1. Add the Permission

```bash
psql $DATABASE_URL -f database/seeds/004_add_manage_roles_permission.sql
```

This adds:

- `users.manage_roles` permission
- Grants it to admin role
- Verification checks

### 2. Restart Server

```bash
npm run dev
```

### 3. Access Management

Visit `/dashboard/roles` or `/dashboard/users` as an admin user.

## 📊 UI Features

### User Detail Page

**Information Displayed:**

- User email, name, status
- Member since date
- All assigned roles
- All effective permissions (computed from roles)

**Actions Available:**

- Assign new roles
- Remove existing roles
- Activate/deactivate user

### Role Editor Page

**Features:**

- Permission grouping by resource
- Bulk select/deselect by resource
- Visual checkboxes for each permission
- Real-time count of selected permissions
- Unsaved changes indicator
- Success/error messages

**Resource Groups:**

- dashboard
- posts
- users
- contacts
- companies
- deals
- tasks
- activities
- templates
- crm
- settings

### Permission Organization

Permissions are displayed as:

```
Resource: contacts
├─ contacts.create - Create new contacts
├─ contacts.read - View contacts
├─ contacts.update - Update contact information
├─ contacts.delete - Delete contacts
├─ contacts.import - Import contacts from CSV
└─ contacts.export - Export contacts to CSV
```

## 🔍 Checking User Permissions

### Via UI

1. Go to `/dashboard/users/[user-id]`
2. Scroll to "Effective Permissions" card
3. See all permissions from all roles

### Via SQL

```sql
-- Get all permissions for a user
SELECT * FROM get_user_permissions('user-uuid-here');

-- Get all users with a specific permission
SELECT DISTINCT u.email, u.name
FROM users u
INNER JOIN user_roles ur ON u.id = ur.user_id
INNER JOIN role_permissions rp ON ur.role_id = rp.role_id
INNER JOIN permissions p ON rp.permission_id = p.id
WHERE p.name = 'users.manage_roles';
```

## 🎓 Best Practices

### 1. Use Roles, Not Direct Permissions

✅ **DO**: Assign users to roles  
❌ **DON'T**: Try to assign permissions directly to users

The system uses Role-Based Access Control (RBAC). Users inherit permissions from roles.

### 2. Be Careful with System Roles

System roles (admin, editor, author, sales_rep) are marked with `is_system = true`.

While you can edit their permissions, be careful as it affects all users with that role.

### 3. Create Custom Roles for Specific Needs

Coming soon: ability to create custom roles for specific organizational needs.

### 4. Regular Permission Audits

Periodically review:

- Who has admin access
- Which roles have sensitive permissions
- Inactive users who still have roles

### 5. Deactivate, Don't Delete

Instead of deleting users:

- Deactivate their accounts
- Preserve audit logs
- Keep historical data intact

## 📈 Navigation Updates

The dashboard navigation now includes:

- **Users** - View all users (requires `users.read`)
- **Roles** - Manage roles and permissions (requires `users.manage_roles`)

Only users with appropriate permissions see these menu items.

## 🔄 Migration Path

### For Existing Installations

1. **Run Permission Seed**

```bash
psql $DATABASE_URL -f database/seeds/004_add_manage_roles_permission.sql
```

2. **Verify Admin Has Permission**

```bash
psql $DATABASE_URL -c "SELECT * FROM get_user_permissions('admin-user-uuid');"
```

Should include `users.manage_roles`.

3. **Access Features**
   Navigate to `/dashboard/users` or `/dashboard/roles`.

## 🆘 Troubleshooting

### Problem: "Roles menu not visible"

**Solution**: User needs `users.manage_roles` permission

```sql
-- Check if user has the permission
SELECT * FROM get_user_permissions('user-uuid');

-- Grant admin role if needed
INSERT INTO user_roles (user_id, role_id)
SELECT 'user-uuid', id FROM roles WHERE name = 'admin';
```

### Problem: "Cannot assign roles"

**Solution**: Ensure permission seed has been run

```bash
psql $DATABASE_URL -f database/seeds/004_add_manage_roles_permission.sql
```

### Problem: "Changes not saving"

**Check**:

1. Browser console for errors
2. Server logs for permission errors
3. User has `users.manage_roles` permission

### Problem: "User has roles but no permissions"

**Cause**: The role has no permissions assigned

**Fix**: Go to `/dashboard/roles/[role-id]` and assign permissions

## 📝 Audit Logging

All user management actions are logged in the `audit_logs` table:

```sql
-- View recent role changes
SELECT
  al.action,
  u.email as admin_email,
  al.resource_id as user_id,
  al.metadata,
  al.created_at
FROM audit_logs al
INNER JOIN users u ON al.user_id = u.id
WHERE al.action LIKE 'user.role_%'
ORDER BY al.created_at DESC
LIMIT 20;
```

**Logged Actions:**

- `user.role_assigned` - When a role is assigned to a user
- `user.role_removed` - When a role is removed from a user
- `user.activated` - When a user is activated
- `user.deactivated` - When a user is deactivated
- `role.permissions_updated` - When role permissions are changed

## 🎉 Summary

The user and role management system provides:

✅ **Complete UI** for managing users and roles  
✅ **Visual permission editor** for roles  
✅ **Role assignment** for users  
✅ **Security controls** (permission checks, audit logs)  
✅ **User status management** (activate/deactivate)  
✅ **System role protection** (warnings)  
✅ **Real-time updates** (revalidation)

**All through a clean, intuitive interface!** 🎯

---

**Default Admin Access:**

- Email: `admin@cms.local`
- Password: `Admin@123`
- Has all permissions including `users.manage_roles`

**Change this password in production!** 🔐
