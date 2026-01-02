import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COHORT_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

export default function CohortAnalysisChart({ data, cohorts }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6">
      <div className="mb-6">
        <h3 className="font-semibold text-slate-800">Cohort Retention Analysis</h3>
        <p className="text-sm text-slate-500 mt-1">Client retention rates by onboarding month</p>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: 12 }} />
          <YAxis stroke="#94a3b8" style={{ fontSize: 12 }} label={{ value: 'Retention %', angle: -90, position: 'insideLeft' }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "white", 
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: 12
            }}
          />
          <Legend />
          {cohorts.map((cohort, index) => (
            <Line 
              key={cohort}
              type="monotone" 
              dataKey={cohort}
              stroke={COHORT_COLORS[index % COHORT_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}