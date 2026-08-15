'use client';

import { useState } from 'react';
import { processApplication, getApplicationById } from '@/app/actions/applications';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { CheckContactExist, createContact } from '@/app/actions/crm/contacts';
import { createDeal } from '@/app/actions/crm/deals';

interface ProcessApplicationButtonProps {
    applicationId: string;
}

export function ProcessApplicationButton({ applicationId }: ProcessApplicationButtonProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showConfirmReject, setShowConfirmReject] = useState(false);

    const t = useTranslations('applications');

    const handleProcessApplication = async () => {
        setLoading(true);
        setError(null);

        const application = await getApplicationById(applicationId);

        if (!application) {
            setError('Failed to fetch application');
            setLoading(false);
            return;
        }

        // create contact or get contact id from application
        let contactId = await CheckContactExist(application.email);

        if (!contactId) {
            // contact does not exist
            const createContactResult = await createContact({
                email: application.email,
                firstName: application.first_name,
                lastName: application.last_name,
                phone: application.phone,
                jobTitle: "",
                companyId: "",
                city: "",
                state: "",
                country: "",
                contactType: "lead",
                leadStatus: "new",
                tags: ["pilot"],
            });

            if (!createContactResult.success) {
                setError(createContactResult.error || 'Failed to create contact');
                setLoading(false);
                return;
            }

            contactId = createContactResult.contact.id;
        }

        const dealDescription = `
            Property Address: ${application.address} \n
            Brief Description: ${application.description}\n
            Purpose of the Application: ${application.intention}
        `

        // create deal
        const createDealResult = await createDeal({
            name: `Pilot Application - ${application.reference_number}`,
            description: dealDescription,
            amount: 0,
            stage: "qualification",
            probability: 10,
            contactId: contactId as string,
            tags: ["pilot"],
        });

        if (!createDealResult.success) {
            setError(createDealResult.error || 'Failed to create deal');
            setLoading(false);
            return;
        }

        const result = await processApplication({
            applicationId,
            status: 'processed',
            contactId: contactId as string,
            dealId: createDealResult.deal.id as string,
        });

        if (!result.success) {
            setError(result.error || 'Failed to process application');
            setLoading(false);
        }
    };

    const handleRejectApplication = async () => {
        setLoading(true);
        setError(null);

        const result = await processApplication({
            applicationId,
            status: 'rejected'
        });

        if (!result.success) {
            setError(result.error || 'Failed to reject application');
            setLoading(false);
            setShowConfirmReject(false);
        }
    };

    if (showConfirmReject) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{t('rejectApplication')}?</span>
                <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleRejectApplication}
                    disabled={loading}
                >
                    {loading ? 'Rejecting...' : 'Confirm'}
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowConfirmReject(false)}
                    disabled={loading}
                >
                    Cancel
                </Button>
            </div>
        );
    }

    return (
        <>
            <div className="flex gap-2">
                <Button
                    variant="default"
                    onClick={handleProcessApplication}
                    disabled={loading}
                >
                    <Check className="h-4 w-4 mr-2" />
                    {loading ? 'Processing...' : t('processApplication')}
                </Button>
                <Button
                    variant="destructive"
                    onClick={() => setShowConfirmReject(true)}
                    disabled={loading}
                >
                    {t('rejectApplication')}
                </Button>
            </div>
            {error && (
                <Alert variant="destructive" className="mt-2">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
        </>
    );
}