import { motion } from "framer-motion";
import { Target, Calendar, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";

export default function GoalCard({ goal, index, onClick }) {
  const statusColors = {
    not_started: "bg-slate-100 text-slate-600",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    on_hold: "bg-amber-100 text-amber-700"
  };

  const currentMonth = new Date().toISOString().slice(0, 7);
  const isFeatured = goal.featured_month === currentMonth;

  const categoryColors = {
    leadership: "border-l-violet-500",
    communication: "border-l-blue-500",
    strategic: "border-l-emerald-500",
    personal: "border-l-rose-500",
    team: "border-l-amber-500",
    other: "border-l-slate-500"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={`p-4 rounded-xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all cursor-pointer group border-l-4 ${categoryColors[goal.category] || categoryColors.other}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[goal.status]}`}>
              {goal.status?.replace("_", " ")}
            </span>
            <span className="text-xs text-slate-400 capitalize">{goal.category}</span>
          </div>
          <h4 className="font-semibold text-slate-800 truncate">{goal.title}</h4>
          {goal.description && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{goal.description}</p>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-500">Progress</span>
          <span className="font-medium text-slate-700">{goal.progress || 0}%</span>
        </div>
        <Progress value={goal.progress || 0} className="h-2" />
      </div>

      {goal.target_date && (
        <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>Target: {format(new Date(goal.target_date), "MMM d, yyyy")}</span>
        </div>
      )}
    </motion.div>
  );
}