import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getPractitionerFeedback, getAllPractitionersForFilter } from '@/app/actions/feedback';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MessageSquareQuote, CheckCircle2, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { FacilitatorFilter } from './facilitator-filter';
import { getTranslations, getLocale } from 'next-intl/server';

interface PageProps {
  searchParams: Promise<{ practitionerId?: string }>;
}

export default async function FeedbackDashboardPage({ searchParams }: PageProps) {
  await requirePermissionPage(PERMISSIONS.FEEDBACK_READ);

  const { practitionerId } = await searchParams;
  const t = await getTranslations('feedback');
  const locale = await getLocale();

  const response = await getPractitionerFeedback(practitionerId);
  const feedbackList = response.success ? response.feedback || [] : [];
  const isAdmin = response.success ? (response as any).isAdmin === true : false;

  // Practitioner list for admin filter — only fetched when admin
  let practitioners: { id: string; users: { name: string } | null }[] = [];
  if (isAdmin) {
    const pRes = await getAllPractitionersForFilter();
    if (pRes.success && pRes.practitioners) {
      practitioners = pRes.practitioners as unknown as typeof practitioners;
    }
  }

  const completed = feedbackList.length;
  const retention = feedbackList.filter((f: any) => f.continue_process.includes('another session')).length;
  const retentionRate = completed > 0 ? Math.round((retention / completed) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? t('descriptionAdmin') : t('descriptionPractitioner')}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statFeedbackReceived')}</CardTitle>
            <MessageSquareQuote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="w-full text-2xl font-bold text-center">{completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statRetention')}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="w-full text-2xl font-bold text-center">{retentionRate}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>{t('recentResponsesTitle')}</CardTitle>
              <CardDescription>{t('recentResponsesDescription')}</CardDescription>
            </div>

            {/* Admin-only: Facilitator filter */}
            {isAdmin && practitioners.length > 0 && (
              <div className="flex items-center gap-2">
                <FacilitatorFilter practitioners={practitioners} currentValue={practitionerId} />
                {practitionerId && (
                  <Link
                    href={`/${locale}/dashboard/feedback`}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                  >
                    {t('clear')}
                  </Link>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {feedbackList.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium">{t('noFeedbackYet')}</p>
                <p className="text-sm mt-1">
                  {isAdmin
                    ? practitionerId
                      ? t('noFeedbackFacilitator')
                      : t('noFeedbackAdmin')
                    : t('noFeedbackPractitioner')}
                </p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t('colClient')}</th>
                    {isAdmin && <th className="px-4 py-3 font-medium">{t('colFacilitator')}</th>}
                    <th className="px-4 py-3 font-medium">{t('colSessionDate')}</th>
                    <th className="px-4 py-3 font-medium">{t('colSubmitted')}</th>
                    <th className="px-4 py-3 font-medium text-center">{t('colContinue')}</th>
                    <th className="px-4 py-3 font-medium text-right">{t('colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbackList.map((feedback) => {
                    const f = feedback as any;
                    const wantsAnother = f.continue_process.includes('another session');

                    return (
                      <tr key={f.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-4">
                          <Link
                            href={`/${locale}/dashboard/clients/${f.client_id}`}
                            className="font-medium hover:underline text-primary"
                          >
                            {f.contacts?.first_name} {f.contacts?.last_name}
                          </Link>
                        </td>

                        {isAdmin && (
                          <td className="px-4 py-4">
                            <Link
                              href={`/${locale}/dashboard/practitioners/${f.practitioner_id}`}
                              className="hover:underline text-primary"
                            >
                              {f.practitioners?.users?.name ?? '—'}
                            </Link>
                          </td>
                        )}

                        <td className="px-4 py-4">
                          <Link
                            href={`/${locale}/dashboard/sessions/${f.session_id}`}
                            className="hover:underline text-primary"
                          >
                            {f.sessions?.scheduled_at
                              ? new Date(f.sessions.scheduled_at).toLocaleDateString(undefined, { dateStyle: 'medium' })
                              : t('colUnknownDate')}
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">
                          {new Date(f.created_at).toLocaleString(undefined, {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {wantsAnother ? (
                            <span
                              title={f.continue_process}
                              className="inline-flex items-center justify-center p-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </span>
                          ) : (
                            <span
                              title={f.continue_process}
                              className="inline-flex items-center justify-center p-1 rounded-full bg-muted text-muted-foreground"
                            >
                              <HelpCircle className="w-4 h-4" />
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Link
                            href={`/${locale}/dashboard/feedback/${f.id}`}
                            className="inline-block px-3 py-1.5 border rounded text-xs font-medium hover:bg-muted"
                          >
                            {t('viewFull')}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
