import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, Calendar, Target, TrendingUp, Plus, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/dashboard/StatsCard";
import UpcomingSession from "@/components/dashboard/UpcomingSession";
import ClientCard from "@/components/dashboard/ClientCard";
import SessionForm from "@/components/sessions/SessionForm";
import ClientForm from "@/components/clients/ClientForm";
import { isAfter, isBefore, addDays, startOfDay } from "date-fns";

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

  const upcomingSessions = sessions
    .filter((s) => s.status === "scheduled" && isAfter(new Date(s.date), new Date()))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const activeClients = clients.filter((c) => c.status === "active");
  const completedSessions = sessions.filter((s) => s.status === "completed");
  const activeGoals = goals.filter((g) => g.status === "in_progress");

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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Sessions */}
          <div className="lg:col-span-2">
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