'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export function SignOutButton() {
  const handleSignOut = async () => {
    await signOut({
      callbackUrl: '/auth/login',
      redirect: true
    });
  };

  return (
    <button
      onClick={handleSignOut}
      className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
    >
      <LogOut className="mr-2 h-4 w-4" />
      Log out
    </button>
  );
}