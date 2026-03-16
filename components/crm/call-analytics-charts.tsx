'use client';

interface DailyAnalytics {
  analytics_date: string;
  total_calls: number;
  inbound_calls: number;
  outbound_calls: number;
  answered_calls: number;
  total_duration_seconds: number;
  avg_duration_seconds: number;
}

interface CallAnalyticsChartsProps {
  dailyData: DailyAnalytics[];
}

export function CallAnalyticsCharts({ dailyData }: CallAnalyticsChartsProps) {
  if (!dailyData || dailyData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No call data available for the selected period
      </div>
    );
  }

  // Find max values for scaling
  const maxCalls = Math.max(...dailyData.map(d => d.total_calls), 1);
  const maxDuration = Math.max(...dailyData.map(d => d.avg_duration_seconds), 1);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Daily Call Volume */}
      <div className="p-6 border rounded-lg bg-white">
        <h3 className="font-semibold text-gray-900 mb-4">Daily Call Volume</h3>
        <div className="space-y-2">
          {dailyData.map((day, index) => {
            const percentage = (day.total_calls / maxCalls) * 100;
            return (
              <div key={index}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">
                    {new Date(day.analytics_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="font-medium">{day.total_calls} calls</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Average Call Duration */}
      <div className="p-6 border rounded-lg bg-white">
        <h3 className="font-semibold text-gray-900 mb-4">Avg Call Duration</h3>
        <div className="space-y-2">
          {dailyData.map((day, index) => {
            const percentage = (day.avg_duration_seconds / maxDuration) * 100;
            const minutes = Math.floor(day.avg_duration_seconds / 60);
            const seconds = day.avg_duration_seconds % 60;
            
            return (
              <div key={index}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">
                    {new Date(day.analytics_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="font-medium">
                    {minutes}m {seconds}s
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="p-6 border rounded-lg bg-white md:col-span-2">
        <h3 className="font-semibold text-gray-900 mb-4">7-Day Trend</h3>
        <div className="grid grid-cols-7 gap-2">
          {dailyData.slice(-7).map((day, index) => {
            const height = (day.total_calls / maxCalls) * 100;
            const answerRate = day.total_calls > 0
              ? Math.round((day.answered_calls / day.total_calls) * 100)
              : 0;

            return (
              <div key={index} className="flex flex-col items-center">
                <div className="relative w-full h-32 bg-gray-100 rounded flex items-end justify-center">
                  <div
                    className={`w-full rounded transition-all ${
                      answerRate >= 70
                        ? 'bg-green-500'
                        : answerRate >= 40
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ height: `${height}%` }}
                  >
                    <div className="text-white text-xs font-bold text-center pt-1">
                      {day.total_calls}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-2 text-center">
                  {new Date(day.analytics_date).toLocaleDateString('en-US', {
                    weekday: 'short',
                  })}
                </div>
                <div className="text-xs text-gray-500">
                  {answerRate}%
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>70%+ answer rate</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>40-69%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>&lt;40%</span>
          </div>
        </div>
      </div>
    </div>
  );
}