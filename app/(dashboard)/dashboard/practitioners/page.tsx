import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getPractitioners } from '@/app/actions/practitioners';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function PractitionersPage() {
  await requirePermissionPage(PERMISSIONS.PRACTITIONERS_READ);
  
  let practitioners: any[] = [];
  let error = null;

  try {
    const result = await getPractitioners();
    if (result.success && result.practitioners) {
      practitioners = result.practitioners;
    } else {
      error = result.error;
    }
  } catch (e: any) {
    error = e.message;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Practitioners</h1>
          <p className="mt-2 text-muted-foreground">
            Manage Janzu practitioner profiles
          </p>
        </div>
        <Link href="/dashboard/practitioners/create">
          <Button>+ Add Practitioner</Button>
        </Link>
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Error loading practitioners</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : practitioners.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No practitioners found</CardTitle>
            <CardDescription>
              There are currently no practitioners in the system.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Practitioners ({practitioners.length})</CardTitle>
            <CardDescription>
              List of all registered practitioners
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                     <TableHead>Name</TableHead>
                     <TableHead>Location</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {practitioners.map((practitioner) => (
                    <TableRow key={practitioner.id}>
                      <TableCell className="font-medium">
                         <Link href={`/dashboard/practitioners/${practitioner.id}`} className="text-primary hover:underline">
                           {practitioner.users?.name || 'Unknown'}
                         </Link>
                         <br/>
                         <span className="text-xs text-muted-foreground">{practitioner.users?.email}</span>
                      </TableCell>
                      <TableCell>{practitioner.location_name || 'Not set'}</TableCell>
                      <TableCell>
                         <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            practitioner.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : practitioner.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                         }`}>
                           {practitioner.status}
                         </span>
                      </TableCell>
                      <TableCell>{new Date(practitioner.created_at).toLocaleDateString()}</TableCell>
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
