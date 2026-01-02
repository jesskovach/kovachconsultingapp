import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function OnboardingProgress({ checklist }) {
  if (!checklist || !checklist.tasks) return null;

  const totalTasks = checklist.tasks.length;
  const completedTasks = checklist.tasks.filter(t => t.completed).length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const statusColors = {
    not_started: "bg-slate-100 text-slate-600",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700"
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-800">Onboarding Progress</h3>
          <p className="text-sm text-slate-500 mt-1">
            {completedTasks} of {totalTasks} tasks completed
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[checklist.status]}`}>
          {checklist.status.replace("_", " ")}
        </div>
      </div>

      <Progress value={progress} className="h-2 mb-6" />

      <div className="space-y-3">
        {checklist.tasks
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((task, index) => (
            <motion.div
              key={task.id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                task.completed ? "bg-emerald-50/50" : "bg-slate-50/50 hover:bg-slate-50"
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {task.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  task.completed ? "text-slate-600 line-through" : "text-slate-800"
                }`}>
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-xs text-slate-500 mt-1">{task.description}</p>
                )}
                {task.completed && task.completed_date && (
                  <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1">
                    <Clock className="w-3 h-3" />
                    Completed {new Date(task.completed_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
      </div>
    </div>
  );
}