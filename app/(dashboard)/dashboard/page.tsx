import { getSession } from '@/lib/auth/session';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkPermission } from '@/lib/rbac/guards';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

async function getAdminStats() {
  const results = await Promise.allSettled([
    supabaseAdmin.from('posts').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('contacts').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('deals').select('id', { count: 'exact', head: true }),
  ]);

  return {
    totalPosts: results[0].status === 'fulfilled' ? results[0].value.count || 0 : 0,
    totalUsers: results[1].status === 'fulfilled' ? results[1].value.count || 0 : 0,
    totalContacts: results[2].status === 'fulfilled' ? results[2].value.count || 0 : 0,
    totalDeals: results[3].status === 'fulfilled' ? results[3].value.count || 0 : 0,
  };
}

async function getPractitionerStats(userId: string) {
  const { count } = await supabaseAdmin
    .from('contacts')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', userId);

  const { data: practitioner } = await supabaseAdmin
    .from('practitioners')
    .select('id')
    .eq('user_id', userId)
    .single();

  let completedSessions = 0;
  if (practitioner) {
     const { count } = await supabaseAdmin
       .from('session_feedback')
       .select('*', { count: 'exact', head: true })
       .eq('practitioner_id', practitioner.id);
     completedSessions = count || 0;
  }

  return {
    totalClients: count || 0,
    completedSessions
  };
}

export default async function DashboardPage() {
  const session = await getSession();
  
  if (!session?.user) {
    return <div>Unauthorized</div>;
  }

  const userId = session.user.id;

  // 1. Check roles
  const isAdmin = await checkPermission(PERMISSIONS.USERS_READ);
  
  const { data: practitioner } = await supabaseAdmin
    .from('practitioners')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
    
  // An admin might also be a practitioner, but usually they just want the admin view.
  // We can show both or prioritize. Let's show Admin if they are admin.
  // Wait, if they are both, we can render BOTH blocks.
  
  const isPractitioner = !!practitioner;
  
  const { data: contact } = await supabaseAdmin
    .from('contacts')
    .select('id, owner_id')
    .eq('user_id', userId)
    .maybeSingle();
    
  const isParticipant = !!contact;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {session.user.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Here is your personalized portal overview.
        </p>
      </div>

      {!isAdmin && !isPractitioner && !isParticipant && (
        <Card className="bg-muted/20">
          <CardHeader>
            <CardTitle>Welcome to Janzu</CardTitle>
            <CardDescription>Your account is currently pending role assignment.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please complete your profile or contact your administrator to receive access to portal features.
            </p>
            <div className="mt-4">
               <Button asChild>
                 <Link href="/dashboard/settings/profile">Complete Profile</Link>
               </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Admin Overview</h2>
          <AdminDashboard />
        </div>
      )}

      {isPractitioner && !isAdmin && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">My Practice</h2>
          <PractitionerDashboard userId={userId} />
        </div>
      )}

      {isParticipant && !isAdmin && !isPractitioner && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">My Journey</h2>
          <ParticipantDashboard />
        </div>
      )}
    </div>
  );
}

async function AdminDashboard() {
  const stats = await getAdminStats();
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalPosts}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total CRM Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalContacts}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalDeals}</div>
        </CardContent>
      </Card>
    </div>
  );
}

async function PractitionerDashboard({ userId }: { userId: string }) {
  const stats = await getPractitionerStats(userId);
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">My Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalClients}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Active participants in your CRM
          </p>
          <div className="mt-4">
             <Button asChild size="sm" variant="outline" className="w-full">
               <Link href="/dashboard/clients">Manage Clients</Link>
             </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Certification Progress</CardTitle>
          <CardDescription>
             Track your journey toward becoming a Certified Janzu Practitioner
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex justify-between text-sm font-medium mb-2">
              <span>{stats.completedSessions} Sessions with Feedback</span>
              <span>Goal: 50</span>
           </div>
           <Progress value={Math.min((stats.completedSessions / 50) * 100, 100)} className="h-2" />
           <div className="mt-4 flex justify-end">
              <Button asChild size="sm" variant="ghost">
                 <Link href="/dashboard/certifications">View Details</Link>
              </Button>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function ParticipantDashboard() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Welcome to Janzu</CardTitle>
          <CardDescription>
            Your participant profile is active and securely linked to your practitioner.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            In future updates, you will be able to review your session history, track your progress, and securely communicate with your practitioner directly from this portal.
          </p>
          <div className="mt-6 flex space-x-4">
             <Button asChild>
               <Link href="/dashboard/settings/profile">Update My Profile</Link>
             </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}