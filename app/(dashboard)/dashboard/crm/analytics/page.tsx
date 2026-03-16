import { requirePermissionPage } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CallAnalyticsCharts } from '@/components/crm/call-analytics-charts';

async function getCallAnalytics(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get daily analytics
  const { data: dailyData } = await supabaseAdmin
    .from('call_analytics_daily')
    .select('*')
    .gte('analytics_date', startDate.toISOString().split('T')[0])
    .order('analytics_date', { ascending: true });

  // Get overall stats
  const { data: callLogs } = await supabaseAdmin
    .from('call_logs')
    .select('*')
    .gte('call_datetime', startDate.toISOString());

  // Calculate totals
  const totalCalls = callLogs?.length || 0;
  const answeredCalls = callLogs?.filter(c => c.outcome === 'answered').length || 0;
  const inboundCalls = callLogs?.filter(c => c.direction === 'inbound').length || 0;
  const outboundCalls = callLogs?.filter(c => c.direction === 'outbound').length || 0;
  
  const totalDuration = callLogs?.reduce((sum, call) => sum + (call.duration_seconds || 0), 0) || 0;
  const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;
  
  const answerRate = totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0;

  // Get top callers
  const callerStats = callLogs?.reduce((acc: any, call: any) => {
    if (!call.called_by) return acc;
    if (!acc[call.called_by]) {
      acc[call.called_by] = {
        userId: call.called_by,
        callCount: 0,
        totalDuration: 0,
        answered: 0,
      };
    }
    acc[call.called_by].callCount++;
    acc[call.called_by].totalDuration += call.duration_seconds || 0;
    if (call.outcome === 'answered') acc[call.called_by].answered++;
    return acc;
  }, {});

  const topCallers = Object.values(callerStats || {})
    .sort((a: any, b: any) => b.callCount - a.callCount)
    .slice(0, 10);

  // Get user names
  if (topCallers.length > 0) {
    const userIds = topCallers.map((c: any) => c.userId);
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .in('id', userIds);

    topCallers.forEach((caller: any) => {
      const user = users?.find(u => u.id === caller.userId);
      caller.userName = user?.name || 'Unknown';
    });
  }

  // Outcome breakdown
  const outcomes = callLogs?.reduce((acc: any, call) => {
    acc[call.outcome] = (acc[call.outcome] || 0) + 1;
    return acc;
  }, {});

  return {
    totalCalls,
    answeredCalls,
    inboundCalls,
    outboundCalls,
    totalDuration,
    avgDuration,
    answerRate,
    dailyData: dailyData || [],
    topCallers,
    outcomes: outcomes || {},
  };
}

export default async function CallAnalyticsPage() {
  await requirePermissionPage('crm.reports');

  const analytics = await getCallAnalytics(30);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Call Analytics</h1>
          <p className="mt-2 text-gray-600">
            Performance metrics and insights from your call activity
          </p>
        </div>
        <Link href="/dashboard/crm">
          <Button variant="outline">← Back to CRM</Button>
        </Link>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCalls}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Answer Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.answerRate}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.answeredCalls} answered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(analytics.avgDuration / 60)}m {analytics.avgDuration % 60}s
            </div>
            <p className="text-xs text-muted-foreground">Per call</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(analytics.totalDuration / 3600)}h {Math.floor((analytics.totalDuration % 3600) / 60)}m
            </div>
            <p className="text-xs text-muted-foreground">On calls</p>
          </CardContent>
        </Card>
      </div>

      {/* Direction Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Call Direction</CardTitle>
            <CardDescription>Inbound vs Outbound</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Outbound</span>
                  <span className="text-sm text-gray-600">{analytics.outboundCalls} calls</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${analytics.totalCalls > 0 ? (analytics.outboundCalls / analytics.totalCalls) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Inbound</span>
                  <span className="text-sm text-gray-600">{analytics.inboundCalls} calls</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${analytics.totalCalls > 0 ? (analytics.inboundCalls / analytics.totalCalls) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Call Outcomes</CardTitle>
            <CardDescription>Results breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.outcomes).map(([outcome, count]) => (
                <div key={outcome} className="flex items-center justify-between">
                  <span className={`text-sm capitalize px-2 py-1 rounded ${
                    outcome === 'answered'
                      ? 'bg-green-100 text-green-800'
                      : outcome === 'voicemail'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {outcome.replace('_', ' ')}
                  </span>
                  <span className="text-sm font-medium">{count as number}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <CallAnalyticsCharts dailyData={analytics.dailyData} />

      {/* Top Callers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Callers</CardTitle>
          <CardDescription>Most active team members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Calls
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Answered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Answer Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Avg Duration
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.topCallers.map((caller: any, index: number) => {
                  const answerRate = caller.callCount > 0 
                    ? Math.round((caller.answered / caller.callCount) * 100) 
                    : 0;
                  const avgDuration = caller.callCount > 0
                    ? Math.round(caller.totalDuration / caller.callCount)
                    : 0;

                  return (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {caller.userName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {caller.callCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {caller.answered}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded ${
                          answerRate >= 70
                            ? 'bg-green-100 text-green-800'
                            : answerRate >= 40
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {answerRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {Math.floor(caller.totalDuration / 60)}m {caller.totalDuration % 60}s
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {Math.floor(avgDuration / 60)}m {avgDuration % 60}s
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}