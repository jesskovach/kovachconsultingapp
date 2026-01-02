import { motion } from "framer-motion";
import { Clock, AlertTriangle, TrendingUp, Users, CheckCircle2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function OnboardingAnalytics({ checklists }) {
  // Calculate average completion time
  const completedChecklists = checklists.filter(c => c.status === "completed" && c.started_date && c.completed_date);
  
  const avgCompletionTime = completedChecklists.length > 0
    ? completedChecklists.reduce((sum, c) => {
        const start = new Date(c.started_date);
        const end = new Date(c.completed_date);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0) / completedChecklists.length
    : 0;

  // Identify bottleneck tasks (tasks that take longest or are most frequently incomplete)
  const allTasks = checklists.flatMap(c => c.tasks || []);
  const taskStats = {};
  
  allTasks.forEach(task => {
    const key = task.title;
    if (!taskStats[key]) {
      taskStats[key] = { 
        title: key, 
        total: 0, 
        completed: 0, 
        blocked: 0,
        avgCompletionTime: 0,
        completionTimes: []
      };
    }
    taskStats[key].total++;
    if (task.completed) {
      taskStats[key].completed++;
      if (task.completed_date) {
        const completionTime = new Date(task.completed_date);
        taskStats[key].completionTimes.push(completionTime);
      }
    }
  });

  // Calculate completion rates and identify bottlenecks
  const taskAnalysis = Object.values(taskStats)
    .map(stat => ({
      ...stat,
      completionRate: stat.total > 0 ? (stat.completed / stat.total) * 100 : 0
    }))
    .sort((a, b) => a.completionRate - b.completionRate);

  const bottleneckTasks = taskAnalysis.slice(0, 5);

  // Track blocked tasks frequency
  const blockedTasksCount = checklists.reduce((sum, c) => {
    const blocked = (c.tasks || []).filter(t => {
      if (!t.depends_on || t.depends_on.length === 0 || t.completed) return false;
      return t.depends_on.some(depOrder => {
        const depTask = c.tasks.find(dt => dt.order === depOrder);
        return depTask && !depTask.completed;
      });
    }).length;
    return sum + blocked;
  }, 0);

  // Team member performance
  const teamPerformance = {};
  checklists.forEach(checklist => {
    (checklist.tasks || []).forEach(task => {
      if (task.assigned_to) {
        if (!teamPerformance[task.assigned_to]) {
          teamPerformance[task.assigned_to] = {
            email: task.assigned_to,
            totalTasks: 0,
            completedTasks: 0,
            avgCompletionTime: 0,
            completionTimes: []
          };
        }
        teamPerformance[task.assigned_to].totalTasks++;
        if (task.completed) {
          teamPerformance[task.assigned_to].completedTasks++;
        }
      }
    });
  });

  const teamStats = Object.values(teamPerformance).map(member => ({
    ...member,
    completionRate: member.totalTasks > 0 ? (member.completedTasks / member.totalTasks) * 100 : 0
  })).sort((a, b) => b.completionRate - a.completionRate);

  // Current status distribution
  const statusCounts = {
    not_started: checklists.filter(c => c.status === "not_started").length,
    in_progress: checklists.filter(c => c.status === "in_progress").length,
    blocked: checklists.filter(c => c.status === "blocked").length,
    completed: checklists.filter(c => c.status === "completed").length
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-slate-500">Avg. Completion Time</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">
              {avgCompletionTime > 0 ? Math.round(avgCompletionTime) : 0}
              <span className="text-lg text-slate-500 ml-1">days</span>
            </p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm text-slate-500">Currently Blocked</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{blockedTasksCount}</p>
            <p className="text-xs text-slate-500 mt-1">tasks waiting on dependencies</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm text-slate-500">Completion Rate</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">
              {checklists.length > 0 
                ? Math.round((statusCounts.completed / checklists.length) * 100) 
                : 0}%
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {statusCounts.completed} of {checklists.length} completed
            </p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-violet-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-violet-600" />
              </div>
              <span className="text-sm text-slate-500">In Progress</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{statusCounts.in_progress}</p>
            <p className="text-xs text-slate-500 mt-1">active onboarding workflows</p>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bottleneck Tasks */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-slate-800">Task Bottlenecks</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Tasks with lowest completion rates across all onboarding workflows
          </p>
          <div className="space-y-3">
            {bottleneckTasks.length > 0 ? (
              bottleneckTasks.map((task, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-slate-50 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-800">{task.title}</p>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(task.completionRate)}%
                    </Badge>
                  </div>
                  <Progress value={task.completionRate} className="h-1.5" />
                  <p className="text-xs text-slate-500 mt-2">
                    {task.completed} of {task.total} completed
                  </p>
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">No task data available</p>
            )}
          </div>
        </Card>

        {/* Team Performance */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-800">Team Performance</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Task completion rates by assigned team member
          </p>
          <div className="space-y-3">
            {teamStats.length > 0 ? (
              teamStats.map((member, index) => (
                <motion.div
                  key={member.email}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-slate-50 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                        {member.email.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-sm font-medium text-slate-800">{member.email}</p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        member.completionRate >= 80 
                          ? "border-emerald-300 text-emerald-700 bg-emerald-50" 
                          : member.completionRate >= 50 
                          ? "border-amber-300 text-amber-700 bg-amber-50"
                          : "border-red-300 text-red-700 bg-red-50"
                      }`}
                    >
                      {Math.round(member.completionRate)}%
                    </Badge>
                  </div>
                  <Progress value={member.completionRate} className="h-1.5" />
                  <p className="text-xs text-slate-500 mt-2">
                    {member.completedTasks} of {member.totalTasks} tasks completed
                  </p>
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">No team assignments yet</p>
            )}
          </div>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card className="p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Onboarding Status Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-slate-800">{statusCounts.not_started}</p>
            <p className="text-sm text-slate-500 mt-1">Not Started</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-700">{statusCounts.in_progress}</p>
            <p className="text-sm text-slate-500 mt-1">In Progress</p>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-lg">
            <p className="text-2xl font-bold text-amber-700">{statusCounts.blocked}</p>
            <p className="text-sm text-slate-500 mt-1">Blocked</p>
          </div>
          <div className="text-center p-4 bg-emerald-50 rounded-lg">
            <p className="text-2xl font-bold text-emerald-700">{statusCounts.completed}</p>
            <p className="text-sm text-slate-500 mt-1">Completed</p>
          </div>
        </div>
      </Card>
    </div>
  );
}