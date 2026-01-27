/**
 * Auth.js v5 Configuration
 * 
 * Strategy: Credentials (Email + Password)
 * Session: JWT-based (stateless)
 * Database: Direct Supabase queries (NO Supabase Auth)
 */

import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyPassword } from '@/lib/auth/password';
import { getUserPermissions, getUserRoles } from '@/lib/rbac/permissions';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        try {
          // Fetch user by email
          const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('id, email, name, password_hash, avatar_url, is_active, email_verified')
            .eq('email', credentials.email.toLowerCase())
            .single();

          if (error || !user) {
            throw new Error('Invalid credentials');
          }

          // Check if account is active
          if (!user.is_active) {
            throw new Error('Account is disabled');
          }

          // Verify password
          const isValidPassword = await verifyPassword(
            credentials.password,
            user.password_hash
          );

          if (!isValidPassword) {
            throw new Error('Invalid credentials');
          }

          // Fetch user permissions and roles
          const [permissions, roles] = await Promise.all([
            getUserPermissions(user.id),
            getUserRoles(user.id),
          ]);

          // Update last login timestamp
          await supabaseAdmin
            .from('users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', user.id);

          // Return user object with permissions
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatar_url,
            permissions,
            roles,
          };
        } catch (error) {
          console.error('Auth error:', error);
          throw new Error('Authentication failed');
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },

  callbacks: {
    /**
     * JWT Callback: Embed user data into token
     * Runs on sign in and token refresh
     */
    async jwt({ token, user, trigger }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.avatarUrl = user.avatarUrl;
        token.permissions = user.permissions;
        token.roles = user.roles;
      }

      // Refresh permissions on update trigger
      if (trigger === 'update' && token.id) {
        const [permissions, roles] = await Promise.all([
          getUserPermissions(token.id as string),
          getUserRoles(token.id as string),
        ]);
        token.permissions = permissions;
        token.roles = roles;
      }

      return token;
    },

    /**
     * Session Callback: Expose token data to client
     * This data is available in useSession() and getServerSession()
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.avatarUrl = token.avatarUrl as string | null;
        session.user.permissions = token.permissions as string[];
        session.user.roles = token.roles as string[];
      }

      return session;
    },
  },

  events: {
    /**
     * Sign in event: Log audit trail
     */
    async signIn({ user, account }) {
      if (user?.id) {
        await supabaseAdmin.from('audit_logs').insert({
          user_id: user.id,
          action: 'user.login',
          resource_type: 'auth',
          resource_id: user.id,
          metadata: {
            provider: account?.provider,
          },
        });
      }
    },

    /**
     * Sign out event: Log audit trail
     */
    async signOut({ token }) {
      if (token?.id) {
        await supabaseAdmin.from('audit_logs').insert({
          user_id: token.id as string,
          action: 'user.logout',
          resource_type: 'auth',
          resource_id: token.id as string,
        });
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };