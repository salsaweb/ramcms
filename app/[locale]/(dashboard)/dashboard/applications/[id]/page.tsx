import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getApplicationById } from '@/app/actions/applications';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Calendar, Clock, FileText, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTranslations, getLocale } from 'next-intl/server';
import { Badge } from '@/components/ui/badge';
import { ProcessApplicationButton } from '@/components/applications/process-application-button';

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

    const formattedDate = new Intl.DateTimeFormat(locale, {
        dateStyle: 'full',
    }).format(new Date(application.created_at));

    const formattedTime = new Intl.DateTimeFormat(locale, {
        timeStyle: 'short',
    }).format(new Date(application.created_at));

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
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">
                                {application.first_name} {application.last_name}
                            </h1>
                            <Badge variant="outline" className="font-mono">
                                {application.reference_number}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground mt-2">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" />
                                <span className="text-sm">{formattedDate}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm">{formattedTime}</span>
                            </div>
                        </div>
                    </div>
                </div>
                {application.status === 'new' && <ProcessApplicationButton applicationId={application.id} />}
                {application.status === 'rejected' && <p className='text-red-500'>{t('rejected')}</p>}
                {application.status === 'processed' && <p className='text-green-500'>{t('processed')}</p>}
            </div>

            <Card className="overflow-hidden">
                <CardHeader className="bg-muted/30">
                    <CardTitle>{t('contactInformation')}</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('name')}</span>
                            <span className="text-lg">{application.first_name} {application.last_name}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('email')}</span>
                            <span className="text-lg">{application.email}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('phone')}</span>
                            <span className="text-lg font-mono">{application.phone}</span>
                        </div>
                    </div>
                </CardContent>

                <CardHeader className="bg-muted/30 border-t">
                    <CardTitle>{t('propertyDetails')}</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-6">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('address')}</span>
                            <span className="text-lg">{application.address}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('briefDescription')}</span>
                            <span className="text-base whitespace-pre-wrap">{application.description}</span>
                        </div>
                    </div>
                </CardContent>

                <CardHeader className="bg-muted/30 border-t">
                    <CardTitle>{t('purposeOfTheApplication')}</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('intention')}</span>
                        <span className="text-base whitespace-pre-wrap">{application.intention}</span>
                    </div>
                </CardContent>

                <CardHeader className="bg-muted/30 border-t">
                    <CardTitle>{t('attachments')}</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 pb-8">
                    {!application.attachment_urls || application.attachment_urls.length === 0 ? (
                        <div className="flex items-center gap-2 text-muted-foreground italic py-2">
                            <FileText className="h-4 w-4 opacity-50" />
                            <span>{t('noAttachments')}</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {application.attachment_urls.map((url: string | undefined, index: number) => (
                                <a
                                    key={index}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all group"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-2 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        <span className="text-sm font-medium truncate">
                                            {application.attachment_keys?.[index] || `Attachment ${index + 1}`}
                                        </span>
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                                </a>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
