import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, DollarSign, Target, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PredictiveInsights({ insights }) {
  const getInsightIcon = (type) => {
    switch (type) {
      case 'churn_risk':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      case 'upsell_opportunity':
        return <DollarSign className="w-5 h-5 text-emerald-600" />;
      case 'engagement_boost':
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      default:
        return <Target className="w-5 h-5 text-slate-600" />;
    }
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'churn_risk':
        return "bg-red-50 border-red-200 text-red-700";
      case 'upsell_opportunity':
        return "bg-emerald-50 border-emerald-200 text-emerald-700";
      case 'engagement_boost':
        return "bg-blue-50 border-blue-200 text-blue-700";
      default:
        return "bg-slate-50 border-slate-200 text-slate-700";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-slate-800">Predictive Insights</h3>
          <p className="text-sm text-slate-500 mt-1">AI-driven recommendations and alerts</p>
        </div>
        <Badge variant="outline" className="bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 border-violet-200">
          <span className="mr-1">✨</span> AI Powered
        </Badge>
      </div>
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {getInsightIcon(insight.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium text-slate-800">{insight.title}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {insight.confidence}% confidence
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 mb-3">{insight.description}</p>
                {insight.clients && insight.clients.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {insight.clients.map((client) => (
                      <Link
                        key={client.id}
                        to={createPageUrl("ClientDetail") + `?id=${client.id}`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-200 hover:border-slate-300 transition-colors text-xs"
                      >
                        <Users className="w-3 h-3" />
                        {client.name}
                      </Link>
                    ))}
                  </div>
                )}
                {insight.action && (
                  <p className="text-xs font-medium text-slate-700 mt-3">
                    💡 Suggested Action: {insight.action}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}