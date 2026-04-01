import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getUsers } from '@/app/actions/users';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


export default async function UsersPage() {
  await requirePermissionPage(PERMISSIONS.USERS_READ);
  const result = await getUsers();
  const users = result.success && result.users ? result.users : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="mt-2 text-muted-foreground">
          Manage user accounts and permissions
        </p>
      </div>

      {!result.success || users.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No users found</CardTitle>
            <CardDescription>
              {result.success ? 'No users in the system' : 'Failed to load users'}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Users ({users.length})</CardTitle>
            <CardDescription>
              List of all registered users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='text-left text-gray-500 text-xs font-medium uppercase tracking-wider'>Name</TableHead>
                    <TableHead className='text-left text-gray-500 text-xs font-medium uppercase tracking-wider'>Email</TableHead>
                    <TableHead className='text-left text-gray-500 text-xs font-medium uppercase tracking-wider'>Status</TableHead>
                    <TableHead className='text-left text-gray-500 text-xs font-medium uppercase tracking-wider'>Verified</TableHead>
                    <TableHead className='text-left text-gray-500 text-xs font-medium uppercase tracking-wider'>Last Login</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Link
                          href={`/dashboard/users/${user.id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {user.name}
                        </Link>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            user.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </TableCell>
                    <TableCell>
                      <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            user.email_verified
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.email_verified ? 'Verified' : 'Unverified'}
                        </span>
                    </TableCell>
                    <TableCell>
                      {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
                    </TableCell>
                  </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}