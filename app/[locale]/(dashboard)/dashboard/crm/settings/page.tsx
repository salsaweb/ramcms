import { requirePermissionPage } from '@/lib/auth/session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function CRMSettingsPage() {
  await requirePermissionPage('settings.manage');

  const settingsCards = [
    {
      title: 'Custom Fields',
      description: 'Create and manage custom fields for contacts',
      icon: '🏗️',
      href: '/dashboard/crm/settings/custom-fields',
      items: [
        'Add custom fields',
        'Configure field types',
        'Manage field groups',
        'Set default values',
      ],
    },
    {
      title: 'Auto-Merge Rules',
      description: 'Configure automatic duplicate detection and merging',
      icon: '🤖',
      href: '/dashboard/crm/settings/merge-rules',
      items: [
        'Create merge rules',
        'Set similarity thresholds',
        'Configure master selection',
        'Enable/disable auto-merge',
      ],
    },
    {
      title: 'Email Notifications',
      description: 'Manage email notification preferences',
      icon: '📧',
      href: '/dashboard/crm/settings/notifications',
      items: [
        'Configure notification types',
        'Set email frequency',
        'Manage templates',
        'Test notifications',
      ],
      comingSoon: true,
    },
    {
      title: 'Pipeline Stages',
      description: 'Customize deal pipeline stages',
      icon: '🎯',
      href: '/dashboard/crm/settings/pipeline',
      items: [
        'Add custom stages',
        'Set probabilities',
        'Configure colors',
        'Reorder stages',
      ],
      comingSoon: true,
    },
    {
      title: 'Lead Scoring',
      description: 'Configure automatic lead scoring rules',
      icon: '⭐',
      href: '/dashboard/crm/settings/scoring',
      items: [
        'Define scoring criteria',
        'Set point values',
        'Configure thresholds',
        'View scoring history',
      ],
      comingSoon: true,
    },
    {
      title: 'Import/Export',
      description: 'Import and export CRM data',
      icon: '📤',
      href: '/dashboard/crm/settings/import-export',
      items: [
        'Import contacts (CSV)',
        'Export data',
        'Field mapping',
        'Import history',
      ],
      comingSoon: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CRM Settings</h1>
          <p className="mt-2 text-gray-600">
            Configure and customize your CRM system
          </p>
        </div>
        <Link href="/dashboard/crm">
          <Button variant="outline">← Back to CRM</Button>
        </Link>
      </div>

      {/* Settings Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsCards.map((setting) => (
          <Card key={setting.title} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="text-4xl mb-2">{setting.icon}</div>
                {setting.comingSoon && (
                  <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded">
                    Coming Soon
                  </span>
                )}
              </div>
              <CardTitle>{setting.title}</CardTitle>
              <CardDescription>{setting.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-4">
                {setting.items.map((item) => (
                  <li key={item} className="text-sm text-gray-600 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href={setting.href}>
                <Button 
                  className="w-full" 
                  variant={setting.comingSoon ? 'outline' : 'default'}
                  disabled={setting.comingSoon}
                >
                  {setting.comingSoon ? 'Coming Soon' : 'Configure'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Settings Overview</CardTitle>
          <CardDescription>Current configuration status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-blue-600">-</div>
              <div className="text-sm text-gray-600 mt-1">Custom Fields</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-green-600">-</div>
              <div className="text-sm text-gray-600 mt-1">Active Merge Rules</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-purple-600">6</div>
              <div className="text-sm text-gray-600 mt-1">Pipeline Stages</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-orange-600">✓</div>
              <div className="text-sm text-gray-600 mt-1">System Status</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">💡 Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-800 mb-4">
            Check out our documentation for detailed guides on configuring your CRM:
          </p>
          <div className="space-y-2">
            <Link href="/docs/custom-fields" className="block text-blue-700 hover:underline">
              → Custom Fields Guide
            </Link>
            <Link href="/docs/merge-rules" className="block text-blue-700 hover:underline">
              → Auto-Merge Rules Best Practices
            </Link>
            <Link href="/docs/api" className="block text-blue-700 hover:underline">
              → API Documentation
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}