import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function EngagementChart({ data }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6">
      <h3 className="font-semibold text-slate-800 mb-6">Session Activity Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: 12 }} />
          <YAxis stroke="#94a3b8" style={{ fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "white", 
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: 12
            }}
          />
          <Area 
            type="monotone" 
            dataKey="sessions" 
            stroke="#3b82f6" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorSessions)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}