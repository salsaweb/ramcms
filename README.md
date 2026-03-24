# 🏢 Ram CMS - Production-Ready Authentication & RBAC System

A complete Next.js CMS with enterprise-grade authentication and role-based access control (RBAC).

## 🎯 Core Features

- **Authentication**: Auth.js v5 with Credentials Provider (Email + Password)
- **Authorization**: Permission-based RBAC (NOT role-based checks)
- **Session Management**: Stateless JWT sessions with embedded permissions
- **Database**: PostgreSQL (Supabase) with direct SQL access
- **Security**: Multi-layer enforcement (Middleware → Server Actions → Database)
- **Audit Logging**: Complete activity tracking

## 🏗️ Architecture Principles

### Authorization Model

```
Users → Roles → Permissions
         ↓
    Check PERMISSIONS only
```

**CRITICAL RULE**: Never check roles in business logic.

```typescript
// ❌ WRONG
if (user.role === 'admin') { ... }

// ✅ RIGHT
if (hasPermission(user, 'posts.delete')) { ... }
```

### Security Layers

1. **Middleware** (Route-level) - Coarse-grained, first defense
2. **Server Actions** (Data-level) - Fine-grained, **FINAL AUTHORITY**
3. **Client Components** (UI-only) - Visual feedback only

### Permission Naming Convention

Format: `resource.action`

Examples:

- `posts.create`
- `posts.update`
- `posts.delete`
- `posts.publish`
- `users.manage_roles`
- `settings.manage`

## 📦 Tech Stack

| Layer          | Technology              |
| -------------- | ----------------------- |
| Framework      | Next.js 15 (App Router) |
| Language       | TypeScript (Strict)     |
| Authentication | Auth.js v5 (NextAuth)   |
| Database       | Supabase (PostgreSQL)   |
| Session        | JWT (Stateless)         |
| Validation     | Zod                     |
| Hashing        | bcryptjs                |

## 🚀 Quick Start

### 1. Prerequisites

```bash
Node.js >= 18.0.0
PostgreSQL database (Supabase recommended)
```

### 2. Installation

```bash
# Clone repository
git clone <repository-url>
cd ramcms

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### 3. Configure Environment

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

**Generate NEXTAUTH_SECRET**:

```bash
openssl rand -base64 32
```

### 4. Database Setup

```bash
# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

This creates:

- 4 base roles: `admin`, `editor`, `author`, `viewer`
- 16 permissions across all resources
- Default admin user: `admin@cms.local` / `Admin@123`

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## 📁 Project Structure

```
ramcms/
├── app/
│   ├── api/auth/[...nextauth]/   # Auth.js handler
│   ├── actions/                  # Server Actions
│   │   ├── auth.ts              # Registration, password
│   │   ├── posts.ts             # Post management
│   │   └── users.ts             # User management
│   ├── (dashboard)/             # Protected routes
│   └── auth/                    # Login/Register pages
├── lib/
│   ├── auth/
│   │   ├── password.ts          # Hashing utilities
│   │   └── session.ts           # Session helpers
│   ├── rbac/
│   │   ├── permissions.ts       # Permission resolution
│   │   └── guards.ts            # Server Action guards
│   ├── supabase/
│   │   └── admin.ts             # Service role client
│   └── validations/
│       └── schemas.ts           # Zod schemas
├── database/
│   ├── migrations/              # SQL migrations
│   └── seeds/                   # Initial data
├── middleware.ts                # Route protection
└── types/
    └── next-auth.d.ts          # Type augmentation
```

## 🔐 Database Schema

### Core Tables

**users** - Identity (maps to Auth.js session.user.id)

```sql
id UUID PRIMARY KEY
email VARCHAR(255) UNIQUE
password_hash VARCHAR(255)
name VARCHAR(255)
is_active BOOLEAN
```

**roles** - Role definitions

```sql
id SERIAL PRIMARY KEY
name VARCHAR(50) UNIQUE
is_system BOOLEAN
```

**permissions** - Atomic capabilities

```sql
id SERIAL PRIMARY KEY
name VARCHAR(100) UNIQUE  -- Format: resource.action
resource VARCHAR(50)
action VARCHAR(50)
```

**user_roles** - User → Role mapping
**role_permissions** - Role → Permission mapping

### Content Tables

**posts** - Blog posts/articles
**categories** - Post categorization
**tags** - Post tagging
**audit_logs** - Activity tracking

## 🛡️ RBAC Implementation Guide

### Define Permissions in Code

```typescript
import { PERMISSIONS } from "@/lib/rbac/permissions";

// Use constants, never hardcode strings
const canDelete = PERMISSIONS.POSTS_DELETE;
```

### Protect Server Actions

```typescript
"use server";

import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/permissions";

export async function deletePost(postId: string) {
  // Check permission - throws if missing
  await requirePermission(PERMISSIONS.POSTS_DELETE);

  // Business logic here...
}
```

### Check Ownership + Permission Override

```typescript
import { requireOwnershipOrPermission } from "@/lib/rbac/guards";

export async function updatePost(postId: string, data: any) {
  // Fetch post
  const post = await getPost(postId);

  // Allow owner OR anyone with posts.update permission
  await requireOwnershipOrPermission(post.author_id, PERMISSIONS.POSTS_UPDATE);

  // Update logic...
}
```

### Client-Side Permission Checks (UI Only)

```typescript
'use client';

import { useSession } from 'next-auth/react';

export default function PostActions({ postId }: Props) {
  const { data: session } = useSession();

  const canDelete = session?.user?.permissions.includes('posts.delete');

  return (
    <>
      {canDelete && (
        <button onClick={() => deletePost(postId)}>Delete</button>
      )}
    </>
  );
}
```

## 🔄 Common Operations

### Create New Permission

1. Add to database:

```sql
INSERT INTO permissions (name, description, resource, action)
VALUES ('billing.manage', 'Manage billing settings', 'billing', 'manage');
```

2. Assign to role:

```sql
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin' AND p.name = 'billing.manage';
```

3. Add to code constants:

```typescript
// lib/rbac/permissions.ts
export const PERMISSIONS = {
  // ...
  BILLING_MANAGE: "billing.manage",
} as const;
```

### Add New Role

```sql
INSERT INTO roles (name, description, is_system)
VALUES ('moderator', 'Content moderation', FALSE);

-- Assign permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'moderator'
AND p.name IN ('posts.read', 'posts.update', 'posts.publish');
```

### Assign Role to User

```typescript
import { assignUserRole } from "@/lib/rbac/permissions";

await assignUserRole(userId, roleId, assignedByUserId);
```

## 🔒 Security Best Practices

### ✅ DO

- Always validate inputs with Zod
- Use `requirePermission()` in all Server Actions
- Check permissions, never roles
- Use HttpOnly cookies (handled by Auth.js)
- Hash all passwords with bcrypt
- Log sensitive operations to audit_logs
- Use absolute imports (`@/lib/...`)

### ❌ DON'T

- Never use Supabase Auth (we use custom users table)
- Never check `user.role === 'admin'`
- Never trust client-side permission checks
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client
- Never store sensitive data in localStorage
- Never use `auth.users` table

## 📊 Default Admin Credentials

**IMPORTANT**: Change immediately in production!

```
Email: admin@cms.local
Password: Admin@123
```

## 🧪 Testing Permissions

```typescript
// Test user permissions
import { getUserPermissions } from "@/lib/rbac/permissions";

const permissions = await getUserPermissions(userId);
console.log(permissions);
// ['posts.create', 'posts.update', ...]
```

## 📝 Adding New Resources

Example: Add "Comments" feature

1. **Create table**:

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id),
  user_id UUID REFERENCES users(id),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

2. **Define permissions**:

```sql
INSERT INTO permissions (name, resource, action) VALUES
('comments.create', 'comments', 'create'),
('comments.update', 'comments', 'update'),
('comments.delete', 'comments', 'delete'),
('comments.moderate', 'comments', 'moderate');
```

3. **Assign to roles**:

```sql
-- Authors can create/edit own comments
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'author'
AND p.name IN ('comments.create', 'comments.update');

-- Moderators can delete/moderate
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'moderator'
AND p.name IN ('comments.moderate', 'comments.delete');
```

4. **Create Server Actions**:

```typescript
// app/actions/comments.ts
"use server";

export async function createComment(data: CommentInput) {
  await requirePermission("comments.create");
  // Implementation...
}

export async function deleteComment(commentId: string) {
  await requirePermission("comments.delete");
  // Implementation...
}
```

## 🚀 Deployment

### Environment Variables

Set these in your hosting platform:

```env
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-domain.com
```

### Build

```bash
npm run build
npm start
```

### Vercel

```bash
vercel --prod
```

## 📚 Additional Resources

- [Auth.js Documentation](https://authjs.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [RBAC Best Practices](https://en.wikipedia.org/wiki/Role-based_access_control)

## 🤝 Support

For issues, questions, or contributions:

- Review the code comments
- Check the audit_logs table for debugging
- Verify permissions with `getUserPermissions()`

---

**Built with security-first principles and production-ready practices.**
