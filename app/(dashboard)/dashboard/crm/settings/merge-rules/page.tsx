import { requirePermissionPage } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MergeRuleBuilder } from '@/components/crm/merge-rule-builder';
import { MergeRulesList } from '@/components/crm/merge-rules-list';

async function getMergeRules() {
  const { data, error } = await supabaseAdmin
    .from('duplicate_merge_rules')
    .select('*')
    .order('created_at', { ascending: false });

  return data || [];
}

export default async function MergeRulesPage() {
  await requirePermissionPage('settings.manage');
  
  const rules = await getMergeRules();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Auto-Merge Rules</h1>
          <p className="mt-2 text-gray-600">
            Configure automatic duplicate detection and merging
          </p>
        </div>
        <Link href="/dashboard/crm/settings">
          <Button variant="outline">← Back to Settings</Button>
        </Link>
      </div>

      {/* Warning Banner */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-900">⚠️ Use with Caution</CardTitle>
          <CardDescription className="text-orange-700">
            Auto-merge rules can automatically combine contacts. Always test with notifications 
            enabled before activating automatic merging. Start with high similarity thresholds (95%+).
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rules.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {rules.filter(r => r.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Auto-Merge Enabled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {rules.filter(r => r.auto_merge_enabled).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rule Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Create Merge Rule</CardTitle>
          <CardDescription>
            Define a new rule for detecting and optionally merging duplicate contacts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MergeRuleBuilder />
        </CardContent>
      </Card>

      {/* Existing Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Rules ({rules.length})</CardTitle>
          <CardDescription>
            Manage your duplicate detection and merge rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MergeRulesList rules={rules} />
        </CardContent>
      </Card>

      {/* Rule Configuration Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Similarity Score</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>95-100%: Very high confidence (safe for auto-merge)</li>
                <li>85-94%: High confidence (review recommended)</li>
                <li>70-84%: Medium confidence (manual review required)</li>
                <li>50-69%: Low confidence (likely false positive)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Required Matches</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li><strong>Email:</strong> Exact email address match</li>
                <li><strong>Phone:</strong> Exact phone number match</li>
                <li><strong>Name:</strong> Case-insensitive first + last name match</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Master Selection Rules</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li><strong>Most Recent:</strong> Newer contact becomes master</li>
                <li><strong>Oldest:</strong> Older contact becomes master</li>
                <li><strong>Highest Score:</strong> Contact with higher lead score</li>
                <li><strong>Most Complete:</strong> Contact with more filled fields</li>
                <li><strong>Manual:</strong> Requires human selection</li>
              </ul>
            </div>

            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">💡 Best Practice</h4>
              <p className="text-blue-700 text-sm">
                Start with a conservative rule: 98% similarity, require email match, 
                notifications enabled, auto-merge disabled. Monitor for a week before 
                enabling automatic merging.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}