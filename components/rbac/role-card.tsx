'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface RoleCardProps {
  role: {
    id: number;
    name: string;
    description: string | null;
    is_system: boolean;
    color: string | null;
    icon: string | null;
    permission_count: number;
    user_count: number;
  };
}

export function RoleCard({ role }: RoleCardProps) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {role.icon && <span className="text-2xl">{role.icon}</span>}
          {role.color && !role.icon && (
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: role.color }}
            />
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{role.name}</h3>
            {role.is_system && (
              <span className="text-xs text-gray-500">System Role</span>
            )}
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {role.description || 'No description'}
      </p>

      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-4">
          <div>
            <span className="font-medium">{role.permission_count}</span>
            <span className="ml-1">permissions</span>
          </div>
          <div>
            <span className="font-medium">{role.user_count}</span>
            <span className="ml-1">users</span>
          </div>
        </div>
      </div>

      <Link href={`/dashboard/roles/${role.id}`}>
        <Button variant="outline" size="sm" className="w-full">
          View Details →
        </Button>
      </Link>
    </div>
  );
}