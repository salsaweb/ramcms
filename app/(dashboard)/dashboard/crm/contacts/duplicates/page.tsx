import { requirePermissionPage } from '@/lib/auth/session';
import { detectDuplicates, getPendingDuplicates } from '@/app/actions/crm/contact-advanced';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DuplicateMergeActions } from '@/components/crm/duplicate-merge-actions';

export default async function DuplicatesPage() {
  await requirePermissionPage('contacts.update');
  
  // Run detection
  await detectDuplicates();
  
  // Get pending duplicates
  const result = await getPendingDuplicates();
  const duplicates = result.success && result.duplicates ? result.duplicates : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Duplicate Contacts</h1>
          <p className="mt-2 text-gray-600">
            Review and merge potential duplicate contacts
          </p>
        </div>
        <Link href="/dashboard/crm/contacts">
          <Button variant="outline">← Back to Contacts</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{duplicates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {duplicates.filter((d: any) => d.similarity_score >= 80).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Medium Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {duplicates.filter((d: any) => d.similarity_score >= 50 && d.similarity_score < 80).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Duplicates List */}
      {duplicates.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Duplicates Found</CardTitle>
            <CardDescription>
              Great! No potential duplicate contacts were detected.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {duplicates.map((duplicate: any) => {
            const contact1 = duplicate.contact1;
            const contact2 = duplicate.contact2;
            const matchedFields = duplicate.matched_fields || {};

            return (
              <Card key={duplicate.id} className={
                duplicate.similarity_score >= 80 ? 'border-red-200' : 'border-orange-200'
              }>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">Potential Duplicate</CardTitle>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        duplicate.similarity_score >= 80
                          ? 'bg-red-100 text-red-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {duplicate.similarity_score}% match
                      </span>
                    </div>
                  </div>
                  <CardDescription>
                    Review these contacts and decide to merge or mark as not duplicate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Contact 1 */}
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Contact 1</h4>
                      <dl className="space-y-2 text-sm">
                        <div>
                          <dt className="text-gray-500">Name</dt>
                          <dd className={`font-medium ${matchedFields.name_match ? 'text-red-600' : ''}`}>
                            {contact1.first_name} {contact1.last_name}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Email</dt>
                          <dd className={`${matchedFields.email_match ? 'text-red-600 font-medium' : ''}`}>
                            {contact1.email || '-'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Phone</dt>
                          <dd className={`${matchedFields.phone_match ? 'text-red-600 font-medium' : ''}`}>
                            {contact1.phone || '-'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Company</dt>
                          <dd>{contact1.companies?.name || '-'}</dd>
                        </div>
                      </dl>
                      <Link
                        href={`/dashboard/crm/contacts/${contact1.id}`}
                        className="mt-3 inline-block text-sm text-primary hover:underline"
                      >
                        View full contact →
                      </Link>
                    </div>

                    {/* Contact 2 */}
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Contact 2</h4>
                      <dl className="space-y-2 text-sm">
                        <div>
                          <dt className="text-gray-500">Name</dt>
                          <dd className={`font-medium ${matchedFields.name_match ? 'text-red-600' : ''}`}>
                            {contact2.first_name} {contact2.last_name}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Email</dt>
                          <dd className={`${matchedFields.email_match ? 'text-red-600 font-medium' : ''}`}>
                            {contact2.email || '-'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Phone</dt>
                          <dd className={`${matchedFields.phone_match ? 'text-red-600 font-medium' : ''}`}>
                            {contact2.phone || '-'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Company</dt>
                          <dd>{contact2.companies?.name || '-'}</dd>
                        </div>
                      </dl>
                      <Link
                        href={`/dashboard/crm/contacts/${contact2.id}`}
                        className="mt-3 inline-block text-sm text-primary hover:underline"
                      >
                        View full contact →
                      </Link>
                    </div>
                  </div>

                  {/* Matched Fields Info */}
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <div className="text-sm font-medium text-gray-700 mb-2">Matched Fields:</div>
                    <div className="flex flex-wrap gap-2">
                      {matchedFields.email_match && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                          ✓ Email Match
                        </span>
                      )}
                      {matchedFields.phone_match && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                          ✓ Phone Match
                        </span>
                      )}
                      {matchedFields.name_match && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                          ✓ Name Match
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <DuplicateMergeActions
                    duplicateId={duplicate.id}
                    contact1Id={contact1.id}
                    contact2Id={contact2.id}
                    contact1Name={`${contact1.first_name} ${contact1.last_name}`}
                    contact2Name={`${contact2.first_name} ${contact2.last_name}`}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}