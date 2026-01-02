import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, Calendar, Target, TrendingUp, Plus, ArrowRight, Bell, CheckCircle2, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatsCard from "@/components/dashboard/StatsCard";
import UpcomingSession from "@/components/dashboard/UpcomingSession";
import ClientCard from "@/components/dashboard/ClientCard";
import FollowUpReminders from "@/components/dashboard/FollowUpReminders";
import SessionForm from "@/components/sessions/SessionForm";
import ClientForm from "@/components/clients/ClientForm";
import { isAfter, isBefore, addDays, startOfDay, format } from "date-fns";

export default function Dashboard() {
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);

  const { data: clients = [], refetch: refetchClients } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("-created_date")
  });

  const { data: sessions = [], refetch: refetchSessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => base44.entities.Session.list("-date")
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["goals"],
    queryFn: () => base44.entities.Goal.list()
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => base44.entities.Notification.list("-created_date", 10)
  });

  const { data: onboardingChecklists = [] } = useQuery({
    queryKey: ["onboarding-checklists"],
    queryFn: () => base44.entities.OnboardingChecklist.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list()
  });

  const upcomingSessions = sessions
    .filter((s) => s.status === "scheduled" && isAfter(new Date(s.date), new Date()))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const activeClients = clients.filter((c) => c.status === "active");
  const completedSessions = sessions.filter((s) => s.status === "completed");
  const activeGoals = goals.filter((g) => g.status === "in_progress");
  const recentNotifications = notifications.slice(0, 5);
  const pendingOnboarding = onboardingChecklists.filter(c => c.status === "in_progress" || c.status === "blocked").length;
  
  // Team performance
  const tasksCompletedByUser = {};
  onboardingChecklists.forEach(checklist => {
    checklist.tasks?.forEach(task => {
      if (task.completed && task.assigned_to) {
        tasksCompletedByUser[task.assigned_to] = (tasksCompletedByUser[task.assigned_to] || 0) + 1;
      }
    });
  });

  const handleCreateSession = async (data) => {
    await base44.entities.Session.create(data);
    refetchSessions();
    setShowSessionForm(false);
  };

  const handleCreateClient = async (data) => {
    await base44.entities.Client.create(data);
    refetchClients();
    setShowClientForm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back. Here's your coaching overview.</p>
        </motion.div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Button 
            onClick={() => setShowSessionForm(true)}
            className="bg-slate-800 hover:bg-slate-700 shadow-lg shadow-slate-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule Session
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowClientForm(true)}
            className="border-slate-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Active Clients"
            value={activeClients.length}
            subtitle={`${clients.length} total clients`}
            icon={Users}
            color="blue"
          />
          <StatsCard
            title="Upcoming Sessions"
            value={upcomingSessions.length}
            subtitle="Next 7 days"
            icon={Calendar}
            color="coral"
          />
          <StatsCard
            title="Sessions Completed"
            value={completedSessions.length}
            subtitle="All time"
            icon={TrendingUp}
            color="green"
          />
          <StatsCard
            title="Active Goals"
            value={activeGoals.length}
            subtitle="In progress"
            icon={Target}
            color="purple"
          />
        </div>

        {/* Pending Onboarding Alert */}
        {pendingOnboarding > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900">
                  {pendingOnboarding} client{pendingOnboarding > 1 ? "s" : ""} in onboarding
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Review progress and complete pending tasks
                </p>
              </div>
              <Link to={createPageUrl("Onboarding")}>
                <Button size="sm" variant="outline" className="border-amber-300 bg-white hover:bg-amber-50">
                  View Onboarding
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upcoming Sessions & Notifications */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Sessions */}
            <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Upcoming Sessions</h2>
              <Link 
                to={createPageUrl("Sessions")}
                className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingSessions.length > 0 ? (
                upcomingSessions.map((session, index) => (
                  <UpcomingSession key={session.id} session={session} index={index} />
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No upcoming sessions</p>
                  <Button 
                    variant="link" 
                    onClick={() => setShowSessionForm(true)}
                    className="mt-2 text-slate-600"
                  >
                    Schedule your first session
                  </Button>
                </div>
              )}
            </div>
            </div>

            {/* Recent Notifications */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Recent Notifications</h2>
                <Link 
                  to={createPageUrl("Dashboard")}
                  className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                >
                  View all <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                {recentNotifications.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {recentNotifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg flex-shrink-0 ${
                            notification.status === 'sent' ? 'bg-emerald-100' : 'bg-slate-100'
                          }`}>
                            {notification.status === 'sent' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Bell className="w-4 h-4 text-slate-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {notification.subject || notification.type?.replace(/_/g, ' ')}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                              {notification.recipient_name}
                            </p>
                            {notification.sent_date && (
                              <p className="text-xs text-slate-400 mt-1">
                                {format(new Date(notification.sent_date), "MMM d, h:mm a")}
                              </p>
                            )}
                          </div>
                          {notification.status === 'sent' && (
                            <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                              Sent
                            </Badge>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No recent notifications</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Clients & Team */}
          <div className="space-y-8">
            {/* Recent Clients */}
            <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Recent Clients</h2>
              <Link 
                to={createPageUrl("Clients")}
                className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {clients.slice(0, 5).length > 0 ? (
                clients.slice(0, 5).map((client, index) => (
                  <ClientCard key={client.id} client={client} index={index} />
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No clients yet</p>
                  <Button 
                    variant="link" 
                    onClick={() => setShowClientForm(true)}
                    className="mt-2 text-slate-600"
                  >
                    Add your first client
                  </Button>
                </div>
              )}
            </div>
            </div>

            {/* Team Performance */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Team Performance</h2>
              </div>
              <div className="bg-white rounded-xl border border-slate-100 p-6">
                {Object.keys(tasksCompletedByUser).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(tasksCompletedByUser)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([email, count], index) => {
                        const user = users.find(u => u.email === email);
                        return (
                          <motion.div
                            key={email}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-white text-sm font-semibold">
                                {user?.full_name?.charAt(0) || email.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-800">
                                  {user?.full_name || email}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {count} task{count > 1 ? 's' : ''} completed
                                </p>
                              </div>
                            </div>
                            <Badge className="bg-slate-100 text-slate-700">
                              {count}
                            </Badge>
                          </motion.div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No team activity yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Assign tasks to team members to track performance
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SessionForm
        open={showSessionForm}
        onClose={() => setShowSessionForm(false)}
        onSubmit={handleCreateSession}
        clients={clients}
      />

      <ClientForm
        open={showClientForm}
        onClose={() => setShowClientForm(false)}
        onSubmit={handleCreateClient}
      />
    </div>
  );
}