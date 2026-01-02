import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Progress } from "@/components/ui/progress";

export default function ClientHealthScore({ clients }) {
  const getHealthColor = (score) => {
    if (score >= 80) return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" };
    if (score >= 60) return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" };
    if (score >= 40) return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };
    return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" };
  };

  const getHealthIcon = (score) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-emerald-600" />;
    if (score >= 60) return <TrendingUp className="w-5 h-5 text-blue-600" />;
    if (score >= 40) return <AlertCircle className="w-5 h-5 text-amber-600" />;
    return <AlertTriangle className="w-5 h-5 text-red-600" />;
  };

  const getHealthLabel = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "At Risk";
    return "Critical";
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6">
      <div className="mb-6">
        <h3 className="font-semibold text-slate-800">Client Health Scores</h3>
        <p className="text-sm text-slate-500 mt-1">Based on engagement, goals, and session frequency</p>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {clients.map((client, index) => {
          const colors = getHealthColor(client.healthScore);
          return (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={createPageUrl("ClientDetail") + `?id=${client.id}`}
                className={`block p-4 rounded-lg border ${colors.border} ${colors.bg} hover:shadow-md transition-all group`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getHealthIcon(client.healthScore)}
                    <div>
                      <p className="font-medium text-slate-800">{client.name}</p>
                      <p className="text-xs text-slate-500">{client.company}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${colors.text}`}>{client.healthScore}</p>
                    <p className={`text-xs font-medium ${colors.text}`}>{getHealthLabel(client.healthScore)}</p>
                  </div>
                </div>
                <Progress value={client.healthScore} className="h-2 mb-2" />
                <div className="flex gap-4 text-xs text-slate-600">
                  <span>📅 {client.sessionCount} sessions</span>
                  <span>🎯 {client.goalProgress}% goals</span>
                  <span>📊 {client.engagementRate}% engaged</span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}