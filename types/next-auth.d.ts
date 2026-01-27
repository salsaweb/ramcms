/**
 * NextAuth Type Augmentation
 * 
 * Extends default NextAuth types to include permissions in session
 */

import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      avatarUrl?: string | null;
      permissions: string[];
      roles: string[];
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
    permissions: string[];
    roles: string[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
    permissions: string[];
    roles: string[];
  }
}