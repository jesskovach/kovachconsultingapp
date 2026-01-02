import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Users, Calendar, Target, TrendingUp, 
  Download, Filter, DollarSign, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MetricCard from "@/components/reports/MetricCard";
import EngagementChart from "@/components/reports/EngagementChart";
import PipelineChart from "@/components/reports/PipelineChart";
import GoalCompletionChart from "@/components/reports/GoalCompletionChart";
import TopClientsTable from "@/components/reports/TopClientsTable";
import { startOfMonth, subMonths, format, differenceInDays } from "date-fns";

export default function Reports() {
  const [timeRange, setTimeRange] = useState("6m");

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list()
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => base44.entities.Session.list()
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["goals"],
    queryFn: () => base44.entities.Goal.list()
  });

  // Calculate metrics
  const activeClients = clients.filter(c => c.status === "active").length;
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.status === "completed").length;
  const avgSessionsPerClient = activeClients > 0 ? (completedSessions / activeClients).toFixed(1) : 0;

  // Goal completion rate
  const completedGoals = goals.filter(g => g.status === "completed").length;
  const goalCompletionRate = goals.length > 0 ? ((completedGoals / goals.length) * 100).toFixed(0) : 0;

  // Pipeline conversion
  const wonClients = clients.filter(c => c.pipeline_stage === "won").length;
  const totalProspects = clients.filter(c => ["lead", "discovery", "proposal", "negotiation", "won"].includes(c.pipeline_stage)).length;
  const conversionRate = totalProspects > 0 ? ((wonClients / totalProspects) * 100).toFixed(0) : 0;

  // Average sales cycle (from created to won)
  const wonClientsWithDates = clients.filter(c => c.pipeline_stage === "won" && c.created_date);
  const avgSalesCycle = wonClientsWithDates.length > 0
    ? Math.round(
        wonClientsWithDates.reduce((sum, c) => {
          return sum + differenceInDays(new Date(), new Date(c.created_date));
        }, 0) / wonClientsWithDates.length
      )
    : 0;

  // Session activity over time (last 6 months)
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(new Date(), i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const sessionCount = sessions.filter(s => {
      const sessionDate = new Date(s.date);
      return sessionDate >= monthStart && sessionDate < monthEnd;
    }).length;

    monthlyData.push({
      month: format(monthDate, "MMM"),
      sessions: sessionCount
    });
  }

  // Pipeline distribution
  const pipelineData = [
    { stage: "lead", count: clients.filter(c => c.pipeline_stage === "lead").length },
    { stage: "discovery", count: clients.filter(c => c.pipeline_stage === "discovery").length },
    { stage: "proposal", count: clients.filter(c => c.pipeline_stage === "proposal").length },
    { stage: "negotiation", count: clients.filter(c => c.pipeline_stage === "negotiation").length },
    { stage: "won", count: clients.filter(c => c.pipeline_stage === "won").length },
    { stage: "lost", count: clients.filter(c => c.pipeline_stage === "lost").length }
  ].filter(d => d.count > 0);

  // Goal status distribution
  const goalData = [
    { name: "Completed", value: goals.filter(g => g.status === "completed").length },
    { name: "In Progress", value: goals.filter(g => g.status === "in_progress").length },
    { name: "Not Started", value: goals.filter(g => g.status === "not_started").length },
    { name: "On Hold", value: goals.filter(g => g.status === "on_hold").length }
  ].filter(d => d.value > 0);

  // Top clients by engagement
  const clientEngagement = clients
    .filter(c => c.status === "active")
    .map(client => {
      const clientSessions = sessions.filter(s => s.client_id === client.id && s.status === "completed");
      const clientGoals = goals.filter(g => g.client_id === client.id);
      const completedClientGoals = clientGoals.filter(g => g.status === "completed");
      
      return {
        ...client,
        sessionCount: clientSessions.length,
        goalCompletion: clientGoals.length > 0 ? Math.round((completedClientGoals.length / clientGoals.length) * 100) : 0
      };
    })
    .sort((a, b) => b.sessionCount - a.sessionCount)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Analytics & Reports</h1>
            <p className="text-slate-500 mt-1">Track performance and insights</p>
          </div>
          <div className="flex gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">Last Month</SelectItem>
                <SelectItem value="3m">Last 3 Months</SelectItem>
                <SelectItem value="6m">Last 6 Months</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Active Clients"
            value={activeClients}
            change={12}
            trend="up"
            icon={Users}
            color="blue"
          />
          <MetricCard
            title="Total Sessions"
            value={completedSessions}
            change={8}
            trend="up"
            icon={Calendar}
            color="emerald"
          />
          <MetricCard
            title="Avg Sessions/Client"
            value={avgSessionsPerClient}
            change={5}
            trend="up"
            icon={TrendingUp}
            color="violet"
          />
          <MetricCard
            title="Goal Completion"
            value={`${goalCompletionRate}%`}
            change={3}
            trend="up"
            icon={Target}
            color="amber"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <EngagementChart data={monthlyData} />
          <PipelineChart data={pipelineData} />
        </div>

        {/* Business Performance Section */}
        <div className="bg-white rounded-xl border border-slate-100 p-6 mb-6">
          <h3 className="font-semibold text-slate-800 mb-6">Business Performance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-lg bg-slate-50">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 mb-3">
                <DollarSign className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold text-slate-800 mb-1">{conversionRate}%</p>
              <p className="text-sm text-slate-500">Pipeline Conversion</p>
              <p className="text-xs text-slate-400 mt-1">{wonClients} of {totalProspects} prospects</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-slate-50">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600 mb-3">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold text-slate-800 mb-1">{avgSalesCycle}</p>
              <p className="text-sm text-slate-500">Avg Sales Cycle (days)</p>
              <p className="text-xs text-slate-400 mt-1">Lead to won client</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-slate-50">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-100 text-violet-600 mb-3">
                <Target className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold text-slate-800 mb-1">{goals.length}</p>
              <p className="text-sm text-slate-500">Total Active Goals</p>
              <p className="text-xs text-slate-400 mt-1">{completedGoals} completed</p>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GoalCompletionChart data={goalData} />
          <TopClientsTable clients={clientEngagement} />
        </div>
      </div>
    </div>
  );
}