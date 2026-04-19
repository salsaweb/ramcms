import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getApplications } from '@/app/actions/applications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, User, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';


export default async function ApplicationsPage() {
    await requirePermissionPage(PERMISSIONS.DASHBOARD_ACCESS);
    const applications = await getApplications();
    const locale = await getLocale();
    const t = await getTranslations('applications');
    const tCommon = await getTranslations('common');

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

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('totalApplications')}</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="w-full text-2xl font-bold text-center">{applications.length}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {applications.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p className="text-lg font-medium">{t('noApplications')}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {applications.map((application) => (
                                <div
                                    key={application.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                                            {application.first_name?.charAt(0) || application.email?.charAt(0)?.toUpperCase()}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <Link href={`/${locale}/dashboard/clients/${application.id}`} className="font-medium hover:underline truncate">
                                                    {application.first_name} {application.last_name}
                                                </Link>
                                                {application.tags?.map((tag: string) => (
                                                    <Badge key={tag} variant="secondary" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                {application.email && (
                                                    <span className="flex items-center gap-1 truncate">
                                                        <Mail className="h-3 w-3" />
                                                        {application.email}
                                                    </span>
                                                )}
                                                {application.phone && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3" />
                                                        {application.phone}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                        <span className="text-xs text-muted-foreground hidden md:inline-flex px-4">
                                            {tCommon('added')} {new Date(application.created_at).toLocaleDateString()}
                                        </span>
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/${locale}/dashboard/applications/${application.id}`}>
                                                {tCommon('view')}
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
