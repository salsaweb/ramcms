# 📑 Enterprise CMS - Documentation Index

Quick navigation to all project documentation and resources.

## 🚀 Getting Started

1. **[README.md](./README.md)** - Main project overview
   - Architecture principles
   - Tech stack
   - Quick start guide
   - RBAC implementation

2. **[Setup Script](./setup.sh)** - Automated installation
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

## 🗄️ Database

### Migrations

- **[001_initial_schema.sql](./database/migrations/001_initial_schema.sql)**
  - Core tables: users, roles, permissions, posts
  - RBAC join tables
  - Audit logging
  - Helper functions

### Seeds

- **[001_initial_data.sql](./database/seeds/001_initial_data.sql)**
  - 4 base roles (admin, editor, author, viewer)
  - 16 permissions across all resources
  - Default admin user
  - Sample categories and tags

## 🔧 Core Libraries

### Authentication

- **[lib/auth/password.ts](./lib/auth/password.ts)** - bcrypt hashing utilities
- **[lib/auth/session.ts](./lib/auth/session.ts)** - Server session helpers

### Authorization

- **[lib/rbac/permissions.ts](./lib/rbac/permissions.ts)** - Permission resolution
- **[lib/rbac/guards.ts](./lib/rbac/guards.ts)** - Server Action protection

### Database

- **[lib/supabase/admin.ts](./lib/supabase/admin.ts)** - Service role client

### Validation

- **[lib/validations/schemas.ts](./lib/validations/schemas.ts)** - Zod schemas

## 🛠️ Server Actions

- **[app/actions/auth.ts](./app/actions/auth.ts)** - Registration, password management
- **[app/actions/posts.ts](./app/actions/posts.ts)** - Post CRUD operations
- **[app/actions/users.ts](./app/actions/users.ts)** - User management (admin)

## ⚙️ Configuration

- **[app/api/auth/[...nextauth]/route.ts](./app/api/auth/[...nextauth]/route.ts)** - Auth.js setup
- **[middleware.ts](./middleware.ts)** - Route-level permission enforcement
- **[types/next-auth.d.ts](./types/next-auth.d.ts)** - Type augmentation
- **[package.json](./package.json)** - Dependencies and scripts
- **[tsconfig.json](./tsconfig.json)** - TypeScript configuration
- **[next.config.js](./next.config.js)** - Next.js configuration
- **[.env.example](./.env.example)** - Environment variables template

## 📚 Documentation

### Deployment

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide
  - Vercel (recommended)
  - AWS (EC2 + RDS)
  - Docker
  - CI/CD pipelines
  - Monitoring setup

### Security

- **[SECURITY.md](./SECURITY.md)** - Security audit checklist
  - Pre-production checklist
  - Common vulnerabilities
  - Security headers
  - Penetration testing
  - Incident response

## 🎯 Key Concepts

### RBAC Hierarchy

```
Users ─────► Roles ─────► Permissions
                            │
                            ▼
                    Check in Server Actions
```

### Authorization Layers

```
1. Middleware (Route) ← Coarse-grained
2. Server Actions     ← FINAL AUTHORITY
3. Client UI          ← Visual only
```

### Permission Format

```
resource.action

Examples:
- posts.create
- posts.update
- posts.delete
- users.manage_roles
```

## 📊 File Organization

```
cms-enterprise/
├── app/                    # Next.js App Router
│   ├── api/auth/          # Auth.js handler
│   ├── actions/           # Server Actions (THE WALL)
│   └── (dashboard)/       # Protected routes
├── lib/                   # Core libraries
│   ├── auth/             # Password, session
│   ├── rbac/             # Permissions, guards
│   ├── supabase/         # Database client
│   └── validations/      # Zod schemas
├── database/             # SQL migrations & seeds
├── types/                # TypeScript definitions
├── middleware.ts         # Route protection
└── [docs]/               # This folder
```

## 🔐 Security Checklist

Before deploying to production, complete this checklist:

- [ ] Change default admin password
- [ ] Generate new NEXTAUTH_SECRET
- [ ] Rotate all API keys
- [ ] Enable HTTPS/SSL
- [ ] Configure security headers
- [ ] Set up rate limiting
- [ ] Enable audit logging
- [ ] Configure backups
- [ ] Set up monitoring
- [ ] Review SECURITY.md

## 🎓 Learning Path

### Beginners

1. Read README.md
2. Run setup.sh
3. Explore database schema
4. Review Server Actions
5. Test with default admin account

### Intermediate

1. Study RBAC implementation
2. Create custom permissions
3. Add new Server Actions
4. Implement new features
5. Review security patterns

### Advanced

1. Study deployment guide
2. Configure production environment
3. Set up CI/CD
4. Implement monitoring
5. Perform security audit

## 🆘 Troubleshooting

### Common Issues

**"Unauthorized" errors**

- Check session is valid
- Verify user has required permission
- Review middleware.ts rules

**Database connection fails**

- Verify SUPABASE_SERVICE_ROLE_KEY
- Check Supabase project URL
- Test with psql connection

**Build errors**

- Run `npm install`
- Check TypeScript errors: `npm run type-check`
- Verify all environment variables set

**Permission denied**

- Check user's roles: `SELECT * FROM user_roles WHERE user_id = '...'`
- Verify role permissions: `SELECT * FROM role_permissions WHERE role_id = ...`
- Use helper: `SELECT * FROM get_user_permissions('user-uuid')`

## 📞 Support Resources

- **GitHub Issues**: Report bugs and request features
- **Documentation**: Review all .md files
- **Code Comments**: Inline documentation throughout codebase
- **Audit Logs**: Check `audit_logs` table for debugging

## 🔄 Update Process

1. Pull latest changes
2. Run migrations if schema changed
3. Update dependencies: `npm update`
4. Run security audit: `npm audit`
5. Test in staging environment
6. Deploy to production

---

**Built with security-first principles and enterprise-grade practices.**

Version: 1.0.0  
Last Updated: January 2026
