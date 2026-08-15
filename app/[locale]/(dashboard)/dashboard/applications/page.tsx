import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getApplications } from '@/app/actions/applications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, User, Phone, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';

interface PageProps {
    searchParams: Promise<{ status?: string }>;
}

export default async function ApplicationsPage({ searchParams }: PageProps) {
    await requirePermissionPage(PERMISSIONS.DASHBOARD_ACCESS);

    const resolvedSearchParams = await searchParams;
    const currentStatus = resolvedSearchParams.status || 'new';

    const allApplications = await getApplications();
    const locale = await getLocale();
    const t = await getTranslations('applications');
    const tCommon = await getTranslations('common');

    const newApplicationsCount = allApplications.filter(a => (a.status || 'new').toLowerCase() === 'new').length;
    const processedApplicationsCount = allApplications.filter(a => (a.status || '').toLowerCase() === 'processed').length;

    let filteredApplications = allApplications;
    if (currentStatus !== 'all') {
        filteredApplications = allApplications.filter(a => {
            const appStatus = (a.status || 'new').toLowerCase();
            return appStatus === currentStatus;
        });
    }

    const getStatusBadgeVariant = (status: string) => {
        const lowerStatus = (status || 'new').toLowerCase();
        switch (lowerStatus) {
            case 'processed': return 'default';
            case 'new': return 'secondary';
            case 'rejected': return 'destructive';
            default: return 'outline';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
                    <p className="text-muted-foreground mt-1">
                        {t('description')}
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('newApplications')}</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="w-full text-2xl font-bold text-center">{newApplicationsCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('processedApplications')}</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="w-full text-2xl font-bold text-center">{processedApplicationsCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('totalApplications')}</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="w-full text-2xl font-bold text-center">{allApplications.length}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle>Applications List</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant={currentStatus === 'new' ? 'default' : 'outline'}
                                size="sm"
                                asChild
                            >
                                <Link href={`/${locale}/dashboard/applications?status=new`}>New</Link>
                            </Button>
                            <Button
                                variant={currentStatus === 'processed' ? 'default' : 'outline'}
                                size="sm"
                                asChild
                            >
                                <Link href={`/${locale}/dashboard/applications?status=processed`}>Processed</Link>
                            </Button>
                            <Button
                                variant={currentStatus === 'all' ? 'default' : 'outline'}
                                size="sm"
                                asChild
                            >
                                <Link href={`/${locale}/dashboard/applications?status=all`}>All</Link>
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        {filteredApplications.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <p className="text-lg font-medium">{t('noApplications')}</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Name</th>
                                        <th className="px-4 py-3 font-medium">Contact</th>
                                        <th className="px-4 py-3 font-medium">Date</th>
                                        <th className="px-4 py-3 font-medium">Status</th>
                                        <th className="px-4 py-3 font-medium text-right">{tCommon('actions') || 'Actions'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredApplications.map((application) => (
                                        <tr key={application.id} className="border-b hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-4 font-medium whitespace-nowrap">
                                                {application.first_name} {application.last_name}
                                            </td>
                                            <td className="px-4 py-4 text-muted-foreground">
                                                <div className="flex flex-col gap-1">
                                                    {application.email && (
                                                        <span className="flex items-center gap-1 text-xs">
                                                            <Mail className="h-3 w-3" /> {application.email}
                                                        </span>
                                                    )}
                                                    {application.phone && (
                                                        <span className="flex items-center gap-1 text-xs">
                                                            <Phone className="h-3 w-3" /> {application.phone}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-muted-foreground text-xs">
                                                {new Date(application.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-4">
                                                <Badge variant={getStatusBadgeVariant(application.status)} className="capitalize">
                                                    {application.status || 'new'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/${locale}/dashboard/applications/${application.id}`}>
                                                        {tCommon('view')}
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
