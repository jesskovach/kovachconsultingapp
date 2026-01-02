import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = {
  lead: "#94a3b8",
  discovery: "#3b82f6",
  proposal: "#8b5cf6",
  negotiation: "#f59e0b",
  won: "#10b981",
  lost: "#ef4444"
};

export default function PipelineChart({ data }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6">
      <h3 className="font-semibold text-slate-800 mb-6">Pipeline Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="stage" stroke="#94a3b8" style={{ fontSize: 12 }} />
          <YAxis stroke="#94a3b8" style={{ fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "white", 
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: 12
            }}
          />
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.stage] || "#94a3b8"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}