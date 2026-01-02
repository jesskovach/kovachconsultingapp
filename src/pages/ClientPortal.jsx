import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Target, Calendar, MessageSquare, FileText, 
  BookOpen, User, LogOut 
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import PortalGoals from "@/components/portal/PortalGoals";
import PortalSessions from "@/components/portal/PortalSessions";
import PortalMessaging from "@/components/portal/PortalMessaging";
import PortalDocuments from "@/components/portal/PortalDocuments";
import PortalResources from "@/components/portal/PortalResources";
import SessionFeedbackForm from "@/components/portal/SessionFeedbackForm";
import GoalForm from "@/components/goals/GoalForm";

export default function ClientPortal() {
  const [feedbackSession, setFeedbackSession] = useState(null);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me()
  });

  const { data: client } = useQuery({
    queryKey: ["clientByEmail", user?.email],
    queryFn: async () => {
      const clients = await base44.entities.Client.filter({ email: user.email });
      return clients.length > 0 ? clients[0] : null;
    },
    enabled: !!user
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["portalGoals", client?.id],
    queryFn: async () => {
      const response = await base44.functions.invoke("getClientGoals", {
        clientId: client.id
      });
      return response.data.goals || [];
    },
    enabled: !!client
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["portalSessions", client?.id],
    queryFn: () => base44.entities.Session.filter({ client_id: client.id }, "-date"),
    enabled: !!client
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", client?.id],
    queryFn: () => base44.entities.Message.filter({ client_id: client.id }, "-created_date"),
    enabled: !!client,
    refetchInterval: 10000
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["documents", client?.id],
    queryFn: () => base44.entities.Document.filter({ client_id: client.id }, "-created_date"),
    enabled: !!client
  });

  const { data: assignedResourceIds = [] } = useQuery({
    queryKey: ["resource-assignments", client?.id],
    queryFn: async () => {
      const assignments = await base44.entities.ResourceAssignment.filter({ client_id: client.id });
      return assignments.map(a => a.resource_id);
    },
    enabled: !!client
  });

  const { data: resources = [] } = useQuery({
    queryKey: ["assignedResources", client?.id],
    queryFn: async () => {
      if (assignedResourceIds.length === 0) return [];
      const allResources = await base44.entities.Resource.list();
      return allResources.filter(r => assignedResourceIds.includes(r.id));
    },
    enabled: !!client && assignedResourceIds.length > 0
  });

  const { data: calendlySettings } = useQuery({
    queryKey: ["calendlySettings"],
    queryFn: async () => {
      const settings = await base44.entities.CalendlySettings.list();
      return settings[0];
    }
  });

  const feedbackMutation = useMutation({
    mutationFn: (data) => base44.entities.SessionFeedback.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portalSessions", client?.id] });
      setFeedbackSession(null);
    }
  });

  const createGoalMutation = useMutation({
    mutationFn: (data) => base44.entities.Goal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portalGoals", client?.id] });
      setShowGoalForm(false);
      setEditingGoal(null);
    }
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Goal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portalGoals", client?.id] });
      setShowGoalForm(false);
      setEditingGoal(null);
    }
  });

  const handleFeedbackSubmit = (feedbackData) => {
    feedbackMutation.mutate({
      ...feedbackData,
      session_id: feedbackSession.id,
      client_id: client.id
    });
  };

  const handleGoalSubmit = (goalData) => {
    if (editingGoal) {
      updateGoalMutation.mutate({ id: editingGoal.id, data: goalData });
    } else {
      createGoalMutation.mutate({ ...goalData, client_id: client.id });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading...</h2>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center max-w-md mx-auto p-8">
          <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Client Portal</h2>
          <p className="text-slate-600 mb-6">
            Your account is not yet linked to a client profile. Please contact your coach for access.
          </p>
          <Button onClick={() => base44.auth.logout()}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    );
  }

  const unreadMessages = messages.filter(m => !m.read && m.sender_email !== user.email).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Welcome back, {client.name}!</h1>
              <p className="text-slate-500 mt-1">Your coaching journey</p>
            </div>
            <Button variant="outline" onClick={() => base44.auth.logout()}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border border-slate-100 p-1">
            <TabsTrigger value="overview">
              <User className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="goals">
              <Target className="w-4 h-4 mr-2" />
              Goals
            </TabsTrigger>
            <TabsTrigger value="sessions">
              <Calendar className="w-4 h-4 mr-2" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
              {unreadMessages > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-red-600 text-white text-xs rounded-full">
                  {unreadMessages}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="w-4 h-4 mr-2" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="resources">
              <BookOpen className="w-4 h-4 mr-2" />
              Resources
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            {calendlySettings?.enabled && calendlySettings?.calendly_url && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 mb-6 text-white"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Ready to schedule your next session?</h3>
                    <p className="text-blue-100">Book a time that works for you</p>
                  </div>
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-blue-50"
                  >
                    <a href={calendlySettings.calendly_url} target="_blank" rel="noopener noreferrer">
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Session
                    </a>
                  </Button>
                </div>
              </motion.div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-slate-100 p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Target className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{goals.length}</p>
                    <p className="text-sm text-slate-500">Active Goals</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl border border-slate-100 p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">
                      {sessions.filter(s => s.status === 'completed').length}
                    </p>
                    <p className="text-sm text-slate-500">Sessions Completed</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl border border-slate-100 p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{messages.length}</p>
                    <p className="text-sm text-slate-500">Messages Exchanged</p>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-slate-800 mb-4">Your Goals</h3>
                <PortalGoals 
                  goals={goals.slice(0, 3)} 
                  onAddGoal={() => {
                    setEditingGoal(null);
                    setShowGoalForm(true);
                  }}
                  onEditGoal={(goal) => {
                    setEditingGoal(goal);
                    setShowGoalForm(true);
                  }}
                />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-4">Upcoming Sessions</h3>
                <PortalSessions 
                  sessions={sessions.filter(s => s.status === 'scheduled').slice(0, 3)} 
                  onProvideFeedback={setFeedbackSession}
                  clientId={client.id}
                  clientName={client.name}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="goals">
            <PortalGoals 
              goals={goals} 
              onAddGoal={() => {
                setEditingGoal(null);
                setShowGoalForm(true);
              }}
              onEditGoal={(goal) => {
                setEditingGoal(goal);
                setShowGoalForm(true);
              }}
            />
          </TabsContent>

          <TabsContent value="sessions">
            <PortalSessions 
              sessions={sessions} 
              onProvideFeedback={setFeedbackSession}
              clientId={client.id}
              clientName={client.name}
            />
          </TabsContent>

          <TabsContent value="messages">
            <PortalMessaging messages={messages} clientId={client.id} currentUser={user} />
          </TabsContent>

          <TabsContent value="documents">
            <PortalDocuments documents={documents} clientId={client.id} currentUser={user} />
          </TabsContent>

          <TabsContent value="resources">
            <PortalResources resources={resources} clientId={client?.id} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Feedback Form */}
      <SessionFeedbackForm
        open={!!feedbackSession}
        onClose={() => setFeedbackSession(null)}
        session={feedbackSession}
        onSubmit={handleFeedbackSubmit}
        isLoading={feedbackMutation.isPending}
      />

      {/* Goal Form */}
      <GoalForm
        open={showGoalForm}
        onClose={() => {
          setShowGoalForm(false);
          setEditingGoal(null);
        }}
        onSubmit={handleGoalSubmit}
        initialData={editingGoal}
        clientId={client?.id}
        isLoading={createGoalMutation.isPending || updateGoalMutation.isPending}
      />
    </div>
  );
}