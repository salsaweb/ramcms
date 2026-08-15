'use client';

import { useState } from 'react';
import { reviewCertification } from '@/app/actions/certifications';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';

export function AdminView({ requests }: { requests: any[] }) {
  const t = useTranslations('certifications');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function handleReview(id: string, status: 'approved' | 'rejected') {
    setLoadingId(id);
    const formData = new FormData();
    formData.append('id', id);
    formData.append('status', status);
    formData.append('adminNotes', notes[id] || '');
    
    await reviewCertification(formData);
    setLoadingId(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('adminTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            {t('noRequests')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-3">{t('colPractitioner')}</th>
                  <th className="px-4 py-3">{t('colType')}</th>
                  <th className="px-4 py-3">{t('colStatus')}</th>
                  <th className="px-4 py-3">{t('colSubmitted')}</th>
                  <th className="px-4 py-3 text-right">{t('colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y border-b">
                {requests.map((req) => {
                  const isPending = req.status === 'pending';
                  return (
                    <tr key={req.id} className="hover:bg-muted/30">
                      <td className="px-4 py-4 font-medium">
                        {req.practitioners?.users?.name || t('unknownUser')}
                        <div className="text-xs font-normal text-muted-foreground mt-0.5">
                          {req.practitioners?.users?.email}
                        </div>
                      </td>
                      <td className="px-4 py-4">{req.type}</td>
                      <td className="px-4 py-4">
                        <Badge 
                           variant={
                             req.status === 'approved' ? 'default' : 
                             req.status === 'rejected' ? 'destructive' : 'secondary'
                           } 
                           className={req.status === 'approved' ? 'bg-green-600' : ''}
                        >
                          {req.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                         {new Date(req.submitted_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {isPending ? (
                          <div className="flex flex-col gap-2 items-end">
                             <div className="flex gap-2">
                               <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="border-green-600 text-green-700 hover:bg-green-100"
                                  onClick={() => handleReview(req.id, 'approved')}
                                  disabled={loadingId === req.id}
                               >
                                 {t('approveBtn')}
                               </Button>
                               <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="border-red-600 text-red-700 hover:bg-red-100"
                                  onClick={() => handleReview(req.id, 'rejected')}
                                  disabled={loadingId === req.id}
                               >
                                 {t('rejectBtn')}
                               </Button>
                             </div>
                             <div className="w-full max-w-[200px] mt-1 text-left">
                               <Label className="text-xs text-muted-foreground mb-1 block">{t('notesLabel')}</Label>
                               <Input 
                                  size={1} 
                                  className="h-7 text-xs" 
                                  placeholder={t('notesPlaceholder')} 
                                  value={notes[req.id] || ''}
                                  onChange={(e) => setNotes(prev => ({...prev, [req.id]: e.target.value}))}
                               />
                             </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                             {t('reviewedOn')} {req.reviewed_at ? new Date(req.reviewed_at).toLocaleDateString() : t('unknownDate')}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
