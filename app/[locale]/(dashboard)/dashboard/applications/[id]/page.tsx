import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getApplicationById } from '@/app/actions/applications';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTranslations, getLocale } from 'next-intl/server';

interface ApplicationViewPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function ApplicationViewPage({ params }: ApplicationViewPageProps) {
    const { id } = await params;
    await requirePermissionPage(PERMISSIONS.DASHBOARD_ACCESS);

    const application = await getApplicationById(id);

    if (!application) {
        notFound();
    }

    const locale = await getLocale();
    const t = await getTranslations('applications');


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/${locale}/dashboard/applications`}
                        className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{application.reference_number}</h1>
                        <p className="text-muted-foreground mt-1 flex items-center gap-2">
                            {application.created_at.toString()}
                        </p>
                    </div>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>{t('contactInformation')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex flex-col">
                            <span className="text-muted-foreground">{t('name')}</span>
                            <span>{application.first_name} {application.last_name}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-muted-foreground">{t('email')}</span>
                            <span>{application.email}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-muted-foreground">{t('phone')}</span>
                            <span>{application.phone}</span>
                        </div>
                    </div>
                </CardContent>
                <CardHeader>
                    <CardTitle>{t('propertyDetails')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex flex-col">
                            <span className="text-muted-foreground">{t('address')}</span>
                            <span>{application.address}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-muted-foreground">{t('briefDescription')}</span>
                            <span>{application.brief_description}</span>
                        </div>
                    </div>
                </CardContent>
                <CardHeader>
                    <CardTitle>{t('purposeOfTheApplication')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex flex-col">
                            <span className="text-muted-foreground">{t('intention')}</span>
                            <span>{application.intention}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
