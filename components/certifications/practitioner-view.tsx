'use client';

import { useState } from 'react';
import { requestCertification } from '@/app/actions/certifications';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Award, AlertCircle, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PractitionerProgress {
  completedSessions: number;
  certifications: any[];
}

export function PractitionerView({ progress }: { progress: PractitionerProgress }) {
  const t = useTranslations('certifications');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const requiredSessions = 50;
  const currentCount = progress.completedSessions;
  const percentage = Math.min((currentCount / requiredSessions) * 100, 100);
  const isEligible = currentCount >= requiredSessions;

  const activeRequest = progress.certifications.length > 0 ? progress.certifications[0] : null;

  async function handleApply() {
    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('type', 'Janzu Practitioner');

    const result = await requestCertification(formData);
    
    if (!result.success) {
      setError(result.error || t('failedToSubmit'));
    }
    setLoading(false);
  }

  // If they have an active request
  if (activeRequest) {
    const isApproved = activeRequest.status === 'approved';
    const isPending = activeRequest.status === 'pending';
    const isRejected = activeRequest.status === 'rejected';

    return (
      <Card className={`border-2 ${isApproved ? 'border-primary' : 'border-muted'}`}>
        <CardHeader className="text-center pb-2">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
             {isApproved ? (
               <Award className="h-10 w-10 text-primary" />
             ) : isPending ? (
               <Clock className="h-10 w-10 text-amber-500" />
             ) : (
               <AlertCircle className="h-10 w-10 text-destructive" />
             )}
          </div>
          <CardTitle className="text-2xl">
            {isApproved ? t('statusCertified') : isPending ? t('statusSubmitted') : t('statusRejected')}
          </CardTitle>
          <CardDescription className="text-base mt-2 max-w-md mx-auto">
            {isApproved && t('descCertified')}
            {isPending && t('descSubmitted')}
            {isRejected && t('descRejected')}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center pt-6">
           <div className="bg-muted/30 rounded-lg p-6 max-w-md mx-auto border text-sm text-left space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('typeLabel')}</span>
                <span className="font-medium">{activeRequest.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('submittedLabel')}</span>
                <span className="font-medium">{new Date(activeRequest.submitted_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('statusLabel')}</span>
                <span className={`font-medium capitalize ${
                  isApproved ? 'text-green-600' : isPending ? 'text-amber-600' : 'text-destructive'
                }`}>{activeRequest.status}</span>
              </div>
              {activeRequest.admin_notes && (
                <div className="pt-3 border-t mt-3">
                   <span className="text-muted-foreground block mb-1">{t('adminNotesLabel')}</span>
                   <p className="font-medium text-slate-800 bg-white p-2 border rounded">
                     {activeRequest.admin_notes}
                   </p>
                </div>
              )}
           </div>

           {isRejected && (
              <Button onClick={handleApply} disabled={loading} className="mt-8">
                {loading ? t('reApplyingBtn') : t('submitNewBtn')}
              </Button>
           )}
        </CardContent>
      </Card>
    );
  }

  // If they have NOT applied yet
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          {t('progressTitle')}
        </CardTitle>
        <CardDescription>
          {t('progressDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-3 mb-6 bg-destructive/15 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-between text-sm font-medium mb-2">
           <span>{currentCount} {t('sessionsWithFeedback')}</span>
           <span>{t('goalLabel')} {requiredSessions}</span>
        </div>
        <Progress value={percentage} className="h-4" />
        
        <div className="mt-8 text-center pt-8 border-t">
           <h3 className="text-xl font-semibold mb-2">{t('readyToApply')}</h3>
           <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
             {t('requirementsDesc', { required: requiredSessions })}
           </p>

           <Button 
             size="lg" 
             onClick={handleApply} 
             disabled={!isEligible || loading}
             className={isEligible ? 'bg-primary hover:bg-primary/90' : ''}
           >
             {loading ? t('submittingBtn') : isEligible ? t('applyBtn') : t('moreFeedbacksNeeded', { count: requiredSessions - currentCount })}
           </Button>
        </div>
      </CardContent>
    </Card>
  );
}
