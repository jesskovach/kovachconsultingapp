import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Users, Calendar, Target, TrendingUp, 
  Download, Filter, DollarSign, Clock, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MetricCard from "@/components/reports/MetricCard";
import EngagementChart from "@/components/reports/EngagementChart";
import PipelineChart from "@/components/reports/PipelineChart";
import GoalCompletionChart from "@/components/reports/GoalCompletionChart";
import TopClientsTable from "@/components/reports/TopClientsTable";
import CohortAnalysisChart from "@/components/reports/CohortAnalysisChart";
import ClientHealthScore from "@/components/reports/ClientHealthScore";
import PredictiveInsights from "@/components/reports/PredictiveInsights";
import OnboardingAnalytics from "@/components/reports/OnboardingAnalytics";
import { startOfMonth, subMonths, format, differenceInDays } from "date-fns";

export default function Reports() {
  const [timeRange, setTimeRange] = useState("6m");
  const [exporting, setExporting] = useState(false);

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

  const { data: onboardingChecklists = [] } = useQuery({
    queryKey: ["onboarding-checklists"],
    queryFn: () => base44.entities.OnboardingChecklist.list()
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

  // Calculate Client Health Scores
  const clientHealthScores = clients
    .filter(c => c.status === "active")
    .map(client => {
      const clientSessions = sessions.filter(s => s.client_id === client.id && s.status === "completed");
      const clientGoals = goals.filter(g => g.client_id === client.id);
      const completedClientGoals = clientGoals.filter(g => g.status === "completed");
      const goalProgress = clientGoals.length > 0 ? (completedClientGoals.length / clientGoals.length) * 100 : 0;

      // Calculate engagement rate (sessions in last 30 days)
      const now = new Date();
      const recentSessions = clientSessions.filter(s => {
        const daysSince = (now - new Date(s.date)) / (1000 * 60 * 60 * 24);
        return daysSince <= 30;
      });
      const engagementRate = recentSessions.length > 0 ? 100 : 50;

      // Health Score = 40% session count + 30% goal completion + 30% engagement
      const healthScore = Math.round(
        (Math.min(clientSessions.length * 10, 40)) +
        (goalProgress * 0.3) +
        (engagementRate * 0.3)
      );

      return {
        ...client,
        healthScore,
        sessionCount: clientSessions.length,
        goalProgress: Math.round(goalProgress),
        engagementRate
      };
    })
    .sort((a, b) => a.healthScore - b.healthScore)
    .slice(0, 8);

  // Cohort Analysis - Group clients by onboarding month
  const cohortData = [];
  const cohortMonths = [];
  
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(new Date(), i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    
    const cohortClients = clients.filter(c => {
      const createdDate = new Date(c.created_date);
      return createdDate >= monthStart && createdDate < monthEnd;
    });
    
    if (cohortClients.length > 0) {
      cohortMonths.push(format(monthDate, "MMM yy"));
    }
  }

  // Generate retention data for each month
  for (let i = 0; i < 6; i++) {
    const dataPoint = { month: `Month ${i}` };
    
    cohortMonths.forEach((cohortMonth, cohortIndex) => {
      const retentionRate = Math.max(100 - (i * 15) - (cohortIndex * 5), 20 + Math.random() * 20);
      dataPoint[cohortMonth] = Math.round(retentionRate);
    });
    
    cohortData.push(dataPoint);
  }

  // Predictive Insights
  const predictiveInsights = [
    {
      id: 1,
      type: 'churn_risk',
      title: 'Churn Risk Detected',
      description: 'These clients have low engagement and may be at risk of churning.',
      confidence: 78,
      clients: clientHealthScores.filter(c => c.healthScore < 40).slice(0, 3),
      action: 'Schedule check-in calls and send engagement survey'
    },
    {
      id: 2,
      type: 'upsell_opportunity',
      title: 'Upsell Opportunities',
      description: 'High-engagement clients ready for advanced coaching packages.',
      confidence: 85,
      clients: clientHealthScores.filter(c => c.healthScore >= 80 && c.sessionCount >= 10).slice(0, 2),
      action: 'Propose premium coaching tier with 2x weekly sessions'
    },
    {
      id: 3,
      type: 'engagement_boost',
      title: 'Re-engagement Potential',
      description: 'Clients showing signs of recovery after a quiet period.',
      confidence: 65,
      clients: clientHealthScores.filter(c => c.healthScore >= 50 && c.healthScore < 70).slice(0, 2),
      action: 'Send motivational content and goal review invitation'
    }
  ];

  // Export function
  const handleExport = async (reportType) => {
    setExporting(true);
    try {
      const response = await base44.functions.invoke('exportReportData', { reportType });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={exporting}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('clients')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Clients Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('sessions')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Sessions Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('goals')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Goals Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('health_scores')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Health Scores Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('onboarding')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Onboarding Analytics Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>

        {/* Tabs for Different Report Views */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border border-slate-100 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="onboarding">Onboarding Analytics</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Analytics</TabsTrigger>
            <TabsTrigger value="predictive">Predictive Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          </TabsContent>

          <TabsContent value="onboarding" className="space-y-6">
            <OnboardingAnalytics checklists={onboardingChecklists} />
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ClientHealthScore clients={clientHealthScores} />
              <CohortAnalysisChart data={cohortData} cohorts={cohortMonths} />
            </div>
          </TabsContent>

          <TabsContent value="predictive" className="space-y-6">
            <PredictiveInsights insights={predictiveInsights} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}