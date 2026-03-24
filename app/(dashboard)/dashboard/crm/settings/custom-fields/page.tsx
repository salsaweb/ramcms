import { requirePermissionPage } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CustomFieldsList } from '@/components/crm/custom-fields-list';
import { CustomFieldBuilder } from '@/components/crm/custom-field-builder';

async function getCustomFields() {
  const { data } = await supabaseAdmin
    .from('contact_custom_fields')
    .select('*')
    .order('display_order', { ascending: true });

  return data || [];
}

export default async function CustomFieldsPage() {
  await requirePermissionPage('settings.manage');

  const customFields = await getCustomFields();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Custom Fields</h1>
          <p className="mt-2 text-gray-600">
            Manage custom fields for contacts
          </p>
        </div>
        <Link href="/dashboard/crm/settings">
          <Button variant="outline">← Back to Settings</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customFields.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {customFields.filter(f => f.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {customFields.filter(f => f.is_required).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Field Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Create Custom Field</CardTitle>
          <CardDescription>
            Add a new custom field to collect additional contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomFieldBuilder />
        </CardContent>
      </Card>

      {/* Existing Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Custom Fields ({customFields.length})</CardTitle>
          <CardDescription>
            Manage and reorder your custom fields
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomFieldsList fields={customFields} />
        </CardContent>
      </Card>

      {/* Field Type Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Field Type Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-3 border rounded">
              <div className="font-medium">Text</div>
              <div className="text-gray-600">Single line text input</div>
            </div>
            <div className="p-3 border rounded">
              <div className="font-medium">Textarea</div>
              <div className="text-gray-600">Multi-line text input</div>
            </div>
            <div className="p-3 border rounded">
              <div className="font-medium">Number</div>
              <div className="text-gray-600">Numeric input (integers or decimals)</div>
            </div>
            <div className="p-3 border rounded">
              <div className="font-medium">Date</div>
              <div className="text-gray-600">Date picker</div>
            </div>
            <div className="p-3 border rounded">
              <div className="font-medium">Boolean</div>
              <div className="text-gray-600">Checkbox (yes/no)</div>
            </div>
            <div className="p-3 border rounded">
              <div className="font-medium">Select</div>
              <div className="text-gray-600">Dropdown with predefined options</div>
            </div>
            <div className="p-3 border rounded">
              <div className="font-medium">Multi-Select</div>
              <div className="text-gray-600">Multiple choice selection</div>
            </div>
            <div className="p-3 border rounded">
              <div className="font-medium">File Upload</div>
              <div className="text-gray-600">Upload documents and files</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}