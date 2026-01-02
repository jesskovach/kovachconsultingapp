import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { TrendingUp, Calendar } from 'lucide-react';

export default function GoalProgressChart({ goal }) {
  if (!goal.updates || goal.updates.length === 0) {
    return (
      <div className="text-center py-8">
        <TrendingUp className="w-12 h-12 text-slate-200 mx-auto mb-3" />
        <p className="text-sm text-slate-500">No progress updates yet</p>
        <p className="text-xs text-slate-400 mt-1">Add updates to see progress over time</p>
      </div>
    );
  }

  // Prepare chart data from updates
  const chartData = goal.updates
    .map(update => ({
      date: new Date(update.date).getTime(),
      dateLabel: format(new Date(update.date), 'MMM d'),
      progress: update.progress_snapshot || 0
    }))
    .sort((a, b) => a.date - b.date);

  // Add current progress as the last point if not already there
  const lastUpdate = chartData[chartData.length - 1];
  const now = new Date();
  if (!lastUpdate || lastUpdate.progress !== goal.progress) {
    chartData.push({
      date: now.getTime(),
      dateLabel: format(now, 'MMM d'),
      progress: goal.progress
    });
  }

  const progressColor = goal.progress >= 75 ? '#10b981' : goal.progress >= 50 ? '#3b82f6' : '#f59e0b';

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-4 border border-slate-100">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={progressColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={progressColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="dateLabel" 
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value) => [`${value}%`, 'Progress']}
            />
            <Area 
              type="monotone" 
              dataKey="progress" 
              stroke={progressColor}
              strokeWidth={2}
              fill="url(#progressGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border border-slate-100 p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">Current</p>
          <p className="text-lg font-bold text-slate-800">{goal.progress}%</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-100 p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">Updates</p>
          <p className="text-lg font-bold text-slate-800">{goal.updates.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-100 p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">Target</p>
          <p className="text-lg font-bold text-slate-800">100%</p>
        </div>
      </div>
    </div>
  );
}