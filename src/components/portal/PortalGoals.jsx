import { motion } from "framer-motion";
import { Target, TrendingUp, Calendar, CheckCircle, Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function PortalGoals({ goals, onAddGoal, onEditGoal }) {
  const statusColors = {
    completed: "bg-emerald-100 text-emerald-700",
    in_progress: "bg-blue-100 text-blue-700",
    not_started: "bg-slate-100 text-slate-700",
    on_hold: "bg-amber-100 text-amber-700"
  };

  const categoryIcons = {
    leadership: "👑",
    communication: "💬",
    strategic: "🎯",
    personal: "🌟",
    team: "👥",
    other: "📋"
  };

  return (
    <div className="space-y-4">
      {onAddGoal && (
        <div className="flex justify-end">
          <Button onClick={onAddGoal} className="bg-slate-800 hover:bg-slate-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Goal
          </Button>
        </div>
      )}
      {goals.length > 0 ? (
        goals.map((goal, index) => (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onEditGoal && onEditGoal(goal)}
            className="bg-white rounded-xl border border-slate-100 p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl flex-shrink-0">
                  {categoryIcons[goal.category]}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">{goal.title}</h3>
                  {goal.description && (
                    <p className="text-sm text-slate-600">{goal.description}</p>
                  )}
                </div>
              </div>
              <Badge className={statusColors[goal.status]}>
                {goal.status.replace(/_/g, ' ')}
              </Badge>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600">Progress</span>
                  <span className="font-medium text-slate-800">{goal.progress || 0}%</span>
                </div>
                <Progress value={goal.progress || 0} className="h-2" />
              </div>

              {goal.target_date && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="w-4 h-4" />
                  <span>Target: {format(new Date(goal.target_date), "MMM d, yyyy")}</span>
                </div>
              )}
            </div>
          </motion.div>
        ))
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
          <Target className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500">No goals set yet</p>
        </div>
      )}
    </div>
  );
}