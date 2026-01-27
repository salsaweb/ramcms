## Create complete project structure for enterprise CMS

```bash
mkdir -p cms/{app/{api/auth/\[...nextauth\],\(dashboard\)/{posts,users,settings},auth/{login,register}},lib/{auth,rbac,supabase,validations},middleware,types,database/{migrations,seeds},components/{ui,auth,dashboard},public}
```

# 📊 Phase 1: Database Schema & Migrations

- Create comprehensive database migration SQL with all RBAC tables and constraints **database/migrations/001_initial_schema.sql**
- Create seed data with roles, permissions, and admin user **database/seeds/001_initial_data.sql**

# 🔧 Phase 2: Core Library & Utilities

- Create Supabase admin client with SERVICE_ROLE_KEY access **lib/supabase/admin.ts**
- Create password hashing utilities using bcryptjs **lib/auth/password.ts**
- Create Zod validation schemas for auth and CMS entities **lib/validations/schemas.ts**

# 🔐 Phase 3: RBAC Permission System

- Create RBAC permissions resolution logic **lib/rbac/permissions.ts**
- Create permission guard utilities for Server Actions **lib/rbac/guard.ts**

# 🔑 Phase 4: Auth.js Configuration

- Create NextAuth type augmentation for session extensions **types/next-auth.d.ts**
- Create Auth.js configuration with Credentials provider and JWT session strategy **app/api/auth/[...nextauth]/route.ts**
- Create session utility functions for server components **lib/auth/session.ts**

# 🛡️ Phase 5: Middleware & Server Actions

- Create Next.js middleware for route-level permission enforcement **middleware.ts**
- Create user registration Server Action with proper validation and RBAC assignment **app/actions/auth.ts**
- Create comprehensive post management Server Actions with RBAC enforcement **app/actions/posts.ts**
- Create user management Server Actions with RBAC controls **app/actions/users.ts**

# 📦 Phase 6: Configuration Files

- Create package.json with all required dependencies **package.json**
- Create TypeScript configuration with strict mode and type checking **tsconfig.json**
- Create environment variables template **.env.example**
- Create Next.js configuration with strict settings **next.config.js**

# 📚 Phase 7: Documentation & README

- Create comprehensive README with setup instructions and architecture overview **README.md**
- Create comprehensive deployment guide **DEPLOYMENT.md**
- Create security audit checklist and best practices document **SECURITY.md**
- Create automated setup script for quick deployment **setup.sh**
- Make setup script executable

```bash
chmod +x setup.sh
```

- Create project index with quick navigation **INDEX.md**
- Copy complete CMS project to outputs and count files

```bash
cp -r /home/cms-enterprise /mnt/user-data/outputs/ && cd /mnt/user-data/outputs/cms-enterprise && find . -type f -name "*.ts" -o -name "*.sql" -o -name "*.md" -o -name "*.json" -o -name "*.js" -o -name "*.sh" | wc -l
```

- Count total lines of code

```bash
cd /mnt/user-data/outputs/cms-enterprise && find . -type f \( -name "*.ts" -o -name "*.sql" -o -name "*.md" \) -exec wc -l {} + | tail -1
```

- Create final project summary and quick start guide **PROJECT_SUMMARY.md**
