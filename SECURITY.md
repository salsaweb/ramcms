# 🔒 Security Audit & Best Practices

Comprehensive security checklist for enterprise CMS deployment.

## 🎯 Security Principles

1. **Defense in Depth**: Multiple security layers
2. **Least Privilege**: Minimum permissions required
3. **Zero Trust**: Verify everything, trust nothing
4. **Security by Design**: Built-in, not bolted-on

## ✅ Pre-Production Security Checklist

### Authentication & Authorization

- [ ] Default admin credentials changed
- [ ] Strong password policy enforced (8+ chars, mixed case, numbers, symbols)
- [ ] JWT secrets are cryptographically random (32+ bytes)
- [ ] Session timeout configured (max 30 days)
- [ ] Account lockout after failed login attempts
- [ ] Email verification enabled for new accounts
- [ ] Two-factor authentication (2FA) available for admins
- [ ] Password reset flow uses secure tokens
- [ ] RBAC permissions properly scoped (atomic, not boolean)
- [ ] Server Actions protected with `requirePermission()`
- [ ] Client-side checks are UI-only, not security
- [ ] Middleware enforces route-level permissions

### Database Security

- [ ] Service role key never exposed to client
- [ ] Connection pooling configured
- [ ] SQL injection prevented (parameterized queries only)
- [ ] Row Level Security (RLS) policies reviewed
- [ ] Database backups automated and encrypted
- [ ] Audit logs enabled for sensitive operations
- [ ] Database credentials rotated regularly
- [ ] Read replicas for high-traffic queries
- [ ] Query timeout limits set
- [ ] Database firewall rules restrictive

### Input Validation

- [ ] All user inputs validated with Zod schemas
- [ ] File upload size limits enforced (2MB max)
- [ ] File type validation (no executable uploads)
- [ ] XSS prevention (React auto-escapes, but verify)
- [ ] CSRF tokens on all state-changing operations
- [ ] Email format validation on server-side
- [ ] URL validation for external links
- [ ] HTML sanitization if rich text supported
- [ ] Rate limiting on all public endpoints
- [ ] Request body size limits configured

### API & Network Security

- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] TLS 1.3 minimum version
- [ ] HSTS header enabled (max-age: 1 year)
- [ ] Security headers configured (see below)
- [ ] CORS policy restrictive
- [ ] API rate limiting per IP/user
- [ ] DDoS protection enabled (Cloudflare, AWS Shield)
- [ ] No sensitive data in URLs (use POST body)
- [ ] No API keys in client-side code
- [ ] Webhook signatures verified

### Session & Cookie Security

- [ ] HttpOnly cookies for session tokens
- [ ] Secure flag on all cookies (HTTPS only)
- [ ] SameSite=Strict for CSRF protection
- [ ] Session fixation prevention (rotate ID on login)
- [ ] Concurrent session limits
- [ ] Session invalidation on password change
- [ ] "Remember me" uses separate token
- [ ] Logout clears all session data

### Code Security

- [ ] No hardcoded secrets (use environment variables)
- [ ] No commented-out sensitive code
- [ ] Dependencies audited (`npm audit`)
- [ ] No `eval()` or `Function()` constructors
- [ ] No SQL string concatenation
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] TypeScript strict mode enabled
- [ ] ESLint security rules active
- [ ] Source maps disabled in production
- [ ] Error messages don't leak system info

### File & Upload Security

- [ ] File uploads validated (type, size, content)
- [ ] Uploaded files stored outside webroot
- [ ] File names sanitized (remove path traversal)
- [ ] Image processing for metadata stripping
- [ ] Virus scanning on uploads (ClamAV, CloudMAPI)
- [ ] Content-Type validation matches file extension
- [ ] No execution permissions on upload directory
- [ ] CDN used for serving uploads (isolation)

### Logging & Monitoring

- [ ] Audit logs for all admin actions
- [ ] Failed login attempts logged
- [ ] Suspicious activity alerts configured
- [ ] Log aggregation (Datadog, Sentry, CloudWatch)
- [ ] PII/sensitive data excluded from logs
- [ ] Log retention policy defined
- [ ] Automated anomaly detection
- [ ] Uptime monitoring (UptimeRobot, Pingdom)
- [ ] Performance monitoring (Web Vitals)
- [ ] Error tracking (Sentry)

### Infrastructure

- [ ] Firewall rules minimum required
- [ ] SSH key-only authentication
- [ ] Unused services disabled
- [ ] OS and packages updated regularly
- [ ] Separate staging/production environments
- [ ] Secrets in vault (AWS Secrets Manager, Vault)
- [ ] CI/CD pipeline secure (signed commits)
- [ ] Infrastructure as Code (IaC) reviewed
- [ ] Automated security scanning (Snyk, Dependabot)
- [ ] DDoS mitigation active

## 🛡️ Required Security Headers

Configure in `next.config.js`:

```javascript
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self' data:;
      connect-src 'self' https://*.supabase.co;
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
    `
      .replace(/\s{2,}/g, " ")
      .trim(),
  },
];
```

## 🚨 Common Vulnerabilities & Prevention

### SQL Injection

**WRONG**:

```typescript
const query = `SELECT * FROM users WHERE email = '${email}'`;
```

**RIGHT**:

```typescript
const { data } = await supabaseAdmin
  .from("users")
  .select("*")
  .eq("email", email);
```

### XSS (Cross-Site Scripting)

**WRONG**:

```typescript
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

**RIGHT**:

```typescript
import DOMPurify from 'isomorphic-dompurify';

const clean = DOMPurify.sanitize(userInput);
<div dangerouslySetInnerHTML={{ __html: clean }} />
```

### CSRF (Cross-Site Request Forgery)

**Prevention**: Next.js automatically includes CSRF tokens in forms. For API routes:

```typescript
import { getServerSession } from "next-auth";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Process request...
}
```

### Insecure Direct Object References (IDOR)

**WRONG**:

```typescript
export async function deleteUser(userId: string) {
  await db.delete(userId); // No permission check!
}
```

**RIGHT**:

```typescript
export async function deleteUser(userId: string) {
  await requirePermission("users.delete");

  // Verify user can access this resource
  const session = await requireAuth();
  if (userId === session.user.id) {
    throw new Error("Cannot delete own account");
  }

  await db.delete(userId);
}
```

### Broken Access Control

**WRONG**:

```typescript
if (user.role === "admin") {
  // Admin actions
}
```

**RIGHT**:

```typescript
if (user.permissions.includes("users.delete")) {
  // Permitted actions
}
```

### Sensitive Data Exposure

**WRONG**:

```typescript
return {
  user: {
    id: user.id,
    email: user.email,
    password_hash: user.password_hash, // NEVER!
  },
};
```

**RIGHT**:

```typescript
return {
  user: {
    id: user.id,
    email: user.email,
    name: user.name,
    // Only non-sensitive fields
  },
};
```

## 🔐 Password Security

### Hashing Best Practices

```typescript
import bcrypt from "bcryptjs";

// CORRECT: Use high cost factor
const hash = await bcrypt.hash(password, 10); // Cost: 10-12

// WRONG: Low cost factor
const hash = await bcrypt.hash(password, 6); // Too weak!
```

### Password Requirements

Enforce in validation:

```typescript
const passwordSchema = z
  .string()
  .min(8, "Minimum 8 characters")
  .regex(/[A-Z]/, "Must contain uppercase")
  .regex(/[a-z]/, "Must contain lowercase")
  .regex(/\d/, "Must contain number")
  .regex(/[!@#$%^&*]/, "Must contain special char");
```

### Password Storage

```typescript
// ✅ CORRECT
const hash = await hashPassword(password);
await db.insert({ password_hash: hash });

// ❌ NEVER
await db.insert({ password: password }); // NEVER store plaintext!
```

## 🎭 Penetration Testing Checklist

Run these tests before production:

1. **Authentication Bypass**
   - Try accessing `/dashboard` without login
   - Manipulate JWT tokens
   - Test session fixation

2. **Authorization Bypass**
   - Access resources as different user
   - Escalate privileges
   - Modify other users' data

3. **Input Validation**
   - SQL injection attempts
   - XSS payloads
   - Path traversal (`../../etc/passwd`)

4. **Rate Limiting**
   - Brute force login
   - API flooding
   - Account enumeration

5. **File Upload**
   - Upload malicious files
   - Bypass file type restrictions
   - Test file size limits

## 📊 Security Monitoring

### Metrics to Track

- Failed login attempts per IP
- Unusual permission access patterns
- High-value actions (user deletion, role changes)
- API error rates
- Session anomalies (location changes, device changes)

### Alerts to Configure

```typescript
// Example: Alert on suspicious activity
if (failedLogins > 5 within 5 minutes) {
  sendAlert('Possible brute force attack', { ip, userId });
  blockIP(ip, duration: '1 hour');
}

if (action === 'user.delete' && actorRole !== 'admin') {
  sendAlert('Unauthorized deletion attempt', { actor, target });
}
```

## 🔄 Security Update Process

1. **Weekly**: Review npm audit results
2. **Monthly**: Review access logs and audit trails
3. **Quarterly**: Rotate secrets and API keys
4. **Annually**: Full security audit and penetration test

## 📚 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/security)
- [Supabase Security](https://supabase.com/docs/guides/auth/security)
- [Auth.js Security](https://authjs.dev/getting-started/security)

## 🚨 Incident Response Plan

### If Security Breach Detected

1. **Contain**: Disable affected accounts, revoke tokens
2. **Assess**: Identify scope of breach
3. **Notify**: Inform affected users, comply with regulations
4. **Remediate**: Patch vulnerability, rotate secrets
5. **Review**: Post-mortem, update procedures

### Emergency Contacts

- Security team lead: [email]
- Database administrator: [email]
- Legal counsel: [email]

---

**Security is not a feature, it's a process. Stay vigilant!**
