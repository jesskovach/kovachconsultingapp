import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { 
  ArrowLeft, Mail, Phone, Building2, Briefcase, Calendar, 
  Target, Edit2, Plus, Trash2, MoreHorizontal, Loader2, Star, BookOpen, ExternalLink, Send, MessageSquare, CreditCard, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ClientForm from "@/components/clients/ClientForm";
import SessionForm from "@/components/sessions/SessionForm";
import GoalForm from "@/components/goals/GoalForm";
import GoalCard from "@/components/goals/GoalCard";
import CalendarSyncButton from "@/components/calendar/CalendarSyncButton";
import PaymentHistory from "@/components/payments/PaymentHistory";
import AINotesAssistant from "@/components/clients/AINotesAssistant";
import ResourceAssignmentDialog from "@/components/resources/ResourceAssignmentDialog";
import EmailComposer from "@/components/emails/EmailComposer";
import EmailThread from "@/components/emails/EmailThread";
import PortalMessaging from "@/components/portal/PortalMessaging";
import PaymentButton from "@/components/payments/PaymentButton";

export default function ClientDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get("id");

  const [showClientForm, setShowClientForm] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: null, id: null });
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [showResourceDialog, setShowResourceDialog] = useState(false);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  const queryClient = useQueryClient();

  const { data: client, isLoading } = useQuery({
    queryKey: ["client", clientId],
    queryFn: async () => {
      const clients = await base44.entities.Client.filter({ id: clientId });
      return clients[0];
    },
    enabled: !!clientId
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions", clientId],
    queryFn: () => base44.entities.Session.filter({ client_id: clientId }, "-date"),
    enabled: !!clientId
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["goals", clientId],
    queryFn: async () => {
      const response = await base44.functions.invoke('getClientGoals', { clientId });
      return response.data.goals || [];
    },
    enabled: !!clientId
  });

  const { data: allClients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list()
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["resource-assignments", clientId],
    queryFn: () => base44.entities.ResourceAssignment.filter({ client_id: clientId }),
    enabled: !!clientId
  });

  const { data: assignedResources = [] } = useQuery({
    queryKey: ["assigned-resources", clientId],
    queryFn: async () => {
      const resourceIds = assignments.map(a => a.resource_id);
      if (resourceIds.length === 0) return [];
      const resources = await base44.entities.Resource.list();
      return resources.filter(r => resourceIds.includes(r.id));
    },
    enabled: !!clientId && assignments.length > 0
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", clientId],
    queryFn: () => base44.entities.Message.filter({ client_id: clientId }, "-created_date"),
    enabled: !!clientId,
    refetchInterval: 10000
  });

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me()
  });

  const { data: questionnaires = [] } = useQuery({
    queryKey: ["questionnaires", clientId],
    queryFn: () => base44.entities.Questionnaire.filter({ client_id: clientId }, "-created_date"),
    enabled: !!clientId
  });

  const updateClientMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.update(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      setShowClientForm(false);
    }
  });

  const resendEmailMutation = useMutation({
    mutationFn: () => base44.functions.invoke("sendWelcomeEmail", { clientId }),
    onSuccess: () => {
      alert("Welcome email sent successfully!");
    }
  });

  const createSessionMutation = useMutation({
    mutationFn: (data) => base44.entities.Session.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions", clientId] });
      setShowSessionForm(false);
    }
  });

  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, data, previousStatus }) => {
      await base44.entities.Session.update(id, data);
      
      // If status changed to 'completed', update client's total_sessions
      if (data.status === 'completed' && previousStatus !== 'completed') {
        await base44.functions.invoke('updateClientStats', { 
          clientId, 
          sessionStatus: 'completed',
          previousStatus 
        });
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions", clientId] });
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      setShowSessionForm(false);
      setEditingSession(null);
    }
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (id) => base44.entities.Session.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sessions", clientId] })
  });

  const createGoalMutation = useMutation({
    mutationFn: (data) => base44.entities.Goal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", clientId] });
      setShowGoalForm(false);
    }
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Goal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", clientId] });
      setShowGoalForm(false);
      setEditingGoal(null);
    }
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id) => base44.entities.Goal.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals", clientId] })
  });

  const updateNotesMutation = useMutation({
    mutationFn: (notes) => base44.entities.Client.update(clientId, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      setEditingNotes(false);
    }
  });

  const handleDelete = () => {
    if (deleteDialog.type === "session") {
      deleteSessionMutation.mutate(deleteDialog.id);
    } else if (deleteDialog.type === "goal") {
      deleteGoalMutation.mutate(deleteDialog.id);
    }
    setDeleteDialog({ open: false, type: null, id: null });
  };

  const statusColors = {
    active: "bg-emerald-100 text-emerald-700",
    paused: "bg-amber-100 text-amber-700",
    completed: "bg-slate-100 text-slate-700",
    prospect: "bg-blue-100 text-blue-700"
  };

  const sessionStatusColors = {
    scheduled: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-slate-100 text-slate-600",
    "no-show": "bg-red-100 text-red-700"
  };

  if (isLoading || !client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link 
          to={createPageUrl("Clients")}
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Clients
        </Link>

        {/* Client Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-100 p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {client.avatar_url ? (
                <img src={client.avatar_url} alt={client.name} className="w-full h-full rounded-2xl object-cover" />
              ) : (
                getInitials(client.name)
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-slate-800">{client.name}</h1>
                    <Badge className={statusColors[client.status]}>{client.status}</Badge>
                  </div>
                  {(client.role || client.company) && (
                    <p className="text-slate-500 mt-1">
                      {client.role} {client.company && `at ${client.company}`}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => resendEmailMutation.mutate()}
                    disabled={resendEmailMutation.isPending}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {resendEmailMutation.isPending ? "Sending..." : "Resend Intake"}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowClientForm(true)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                {client.email && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <a href={`mailto:${client.email}`} className="hover:text-slate-800">{client.email}</a>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <a href={`tel:${client.phone}`} className="hover:text-slate-800">{client.phone}</a>
                  </div>
                )}
                {client.start_date && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    Started {format(new Date(client.start_date), "MMM d, yyyy")}
                  </div>
                )}
              </div>

              {client.coaching_focus && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600">
                    <span className="font-medium text-slate-700">Coaching Focus:</span> {client.coaching_focus}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="sessions" className="space-y-6">
          <TabsList className="bg-white border border-slate-100 p-1">
            <TabsTrigger value="sessions" className="data-[state=active]:bg-slate-100">
              <Calendar className="w-4 h-4 mr-2" />
              Sessions ({sessions.length})
            </TabsTrigger>
            <TabsTrigger value="goals" className="data-[state=active]:bg-slate-100">
              <Target className="w-4 h-4 mr-2" />
              Goals ({goals.length})
            </TabsTrigger>
            <TabsTrigger value="messages" className="data-[state=active]:bg-slate-100">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages ({messages.filter(m => !m.read && m.sender_email !== currentUser?.email).length})
            </TabsTrigger>
            <TabsTrigger value="emails" className="data-[state=active]:bg-slate-100">
              <Mail className="w-4 h-4 mr-2" />
              Emails
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-slate-100">
              Payments
            </TabsTrigger>
            <TabsTrigger value="resources" className="data-[state=active]:bg-slate-100">
              Resources ({assignedResources.length})
            </TabsTrigger>
            <TabsTrigger value="intake" className="data-[state=active]:bg-slate-100">
              <FileText className="w-4 h-4 mr-2" />
              Intake Forms ({questionnaires.length})
            </TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-slate-100">
              Notes
            </TabsTrigger>
          </TabsList>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-slate-800">Sessions History</h3>
              <Button 
                size="sm"
                onClick={() => {
                  setEditingSession(null);
                  setShowSessionForm(true);
                }}
                className="bg-slate-800 hover:bg-slate-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Schedule Session
              </Button>
            </div>

            {sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex flex-col items-center justify-center text-slate-600">
                          <span className="text-xs font-medium">{format(new Date(session.date), "MMM")}</span>
                          <span className="text-lg font-bold leading-none">{format(new Date(session.date), "d")}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge className={sessionStatusColors[session.status]}>{session.status}</Badge>
                            <span className="text-sm text-slate-500 capitalize">{session.type}</span>
                          </div>
                          <p className="text-sm text-slate-500 mt-1">
                            {format(new Date(session.date), "h:mm a")} · {session.duration || 60} min
                          </p>
                          {session.notes && (
                            <p className="text-sm text-slate-600 mt-2 line-clamp-2">{session.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.status === 'scheduled' && (
                          <>
                            <PaymentButton
                              clientId={session.client_id}
                              amount={150}
                              description={`Session on ${format(new Date(session.date), "MMM d, yyyy")}`}
                              sessionId={session.id}
                              size="sm"
                              variant="outline"
                            >
                              <CreditCard className="w-4 h-4 mr-2" />
                              Pay
                            </PaymentButton>
                            <CalendarSyncButton session={session} />
                          </>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setEditingSession(session);
                              setShowSessionForm(true);
                            }}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => setDeleteDialog({ open: true, type: "session", id: session.id })}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
                <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500">No sessions yet</p>
                <Button 
                  variant="link"
                  onClick={() => setShowSessionForm(true)}
                  className="mt-2"
                >
                  Schedule the first session
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-4">
            {!selectedGoal ? (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-slate-800">Coaching Goals</h3>
                  <Button 
                    size="sm"
                    onClick={() => {
                      setEditingGoal(null);
                      setShowGoalForm(true);
                    }}
                    className="bg-slate-800 hover:bg-slate-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Goal
                  </Button>
                </div>

                {goals.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goals.map((goal, index) => (
                      <div key={goal.id} className="relative group">
                        <GoalCard 
                          goal={goal} 
                          index={index}
                          onClick={() => setSelectedGoal(goal)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDialog({ open: true, type: "goal", id: goal.id });
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
                    <Target className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500">No goals set yet</p>
                    <Button 
                      variant="link"
                      onClick={() => setShowGoalForm(true)}
                      className="mt-2"
                    >
                      Add the first goal
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedGoal(null)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Goals
                </Button>

                <div className="bg-white rounded-xl border border-slate-100 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-800 mb-2">{selectedGoal.title}</h3>
                      {selectedGoal.description && (
                        <p className="text-slate-600 mb-3">{selectedGoal.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge className="capitalize">{selectedGoal.category}</Badge>
                        <Badge className="capitalize">{selectedGoal.status.replace('_', ' ')}</Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingGoal(selectedGoal);
                        setShowGoalForm(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>

                  <Tabs defaultValue="chart" className="mt-6">
                    <TabsList>
                      <TabsTrigger value="chart">Progress Chart</TabsTrigger>
                      <TabsTrigger value="updates">Updates</TabsTrigger>
                    </TabsList>
                    <TabsContent value="chart" className="mt-4">
                      <GoalProgressChart goal={selectedGoal} />
                    </TabsContent>
                    <TabsContent value="updates" className="mt-4">
                      <GoalUpdates goal={selectedGoal} />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-4">
            <h3 className="font-semibold text-slate-800 mb-4">Direct Messages</h3>
            {currentUser && <PortalMessaging messages={messages} clientId={clientId} currentUser={currentUser} />}
          </TabsContent>

          {/* Emails Tab */}
          <TabsContent value="emails" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-slate-800">Email Communications</h3>
              <Button 
                size="sm"
                onClick={() => setShowEmailComposer(true)}
                className="bg-slate-800 hover:bg-slate-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Compose Email
              </Button>
            </div>
            <EmailThread clientId={clientId} />
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <PaymentHistory clientId={clientId} />
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-slate-800">Assigned Resources</h3>
              <Button 
                size="sm"
                onClick={() => setShowResourceDialog(true)}
                className="bg-slate-800 hover:bg-slate-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Assign Resources
              </Button>
            </div>

            {assignedResources.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignedResources.map((resource, index) => (
                  <motion.a
                    key={resource.id}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="block bg-white rounded-xl border border-slate-100 p-5 hover:shadow-lg hover:border-slate-200 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 rounded-lg ${resource.featured ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'}`}>
                        {resource.featured ? <Star className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    </div>
                    
                    <h4 className="font-semibold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                      {resource.title}
                    </h4>
                    
                    {resource.description && (
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{resource.description}</p>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Badge className="bg-violet-100 text-violet-700">
                        {resource.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {resource.type}
                      </Badge>
                    </div>
                  </motion.a>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
                <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 mb-4">No resources assigned yet</p>
                <Button 
                  variant="link"
                  onClick={() => setShowResourceDialog(true)}
                >
                  Assign the first resource
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Intake Forms Tab */}
          <TabsContent value="intake" className="space-y-4">
            <h3 className="font-semibold text-slate-800 mb-4">Intake Questionnaires</h3>
            {questionnaires.length > 0 ? (
              <div className="space-y-4">
                {questionnaires.map((questionnaire, index) => (
                  <motion.div
                    key={questionnaire.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-xl border border-slate-100 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-5 h-5 text-violet-600" />
                          <h4 className="font-semibold text-slate-800 capitalize">
                            {questionnaire.type} Intake
                          </h4>
                          {questionnaire.status === "completed" && (
                            <Badge className="bg-emerald-100 text-emerald-700">Completed</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">
                          Submitted {format(new Date(questionnaire.completed_date || questionnaire.created_date), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>

                    {questionnaire.responses && (
                      <div className="space-y-4 mt-6">
                        {Object.entries(questionnaire.responses).map(([key, value]) => {
                          if (!value || (Array.isArray(value) && value.length === 0)) return null;
                          
                          const questionLabels = {
                            current_work: "What kind of work are you doing right now?",
                            environment_feel: "How does your current environment feel?",
                            capacity: "How's your capacity at the moment?",
                            decision_reason: "What made you decide to book this conversation now?",
                            specific_situation: "Is there a specific situation, decision, or pattern that's been on your mind?",
                            most_important: "What feels most important about it?",
                            feels_unclear: "What feels unclear, stuck, or hard to name right now?",
                            pressures_constraints: "What pressures or constraints feel most present for you lately?",
                            outside_control: "Are there parts of this situation that feel outside your control?",
                            complex_response: "When things get complex or high-stakes, what do you usually do?",
                            unhelpful_advice: "What kinds of advice or support have not been helpful for you?",
                            impact_cost: "If this situation has been costing you something, what has that looked like?",
                            future_feeling: "In a few months, what do you hope has changed?",
                            worthwhile: "What would make this conversation feel worthwhile to you?",
                            previous_coaching: "Have you worked with a coach or advisor before?",
                            previous_coaching_details: "Tell us about your previous coaching experience",
                            anything_else: "Is there anything else you want me to know?",
                            what_makes_useful: "What would make this coaching conversation useful for you?",
                            current_challenges: "What are your biggest leadership challenges right now?",
                            desired_outcomes: "What specific outcomes would you like from our coaching relationship?",
                            support_needed: "What kind of support do you need most right now?",
                            obstacles: "What obstacles or barriers are you currently facing?",
                            strengths: "What strengths can you leverage in achieving your goals?",
                            growth_areas: "What areas would you most like to develop or improve?",
                            leadership_style: "How would you describe your leadership style?",
                            success_metrics: "How will you measure success in our coaching engagement?",
                            time_commitment: "What time commitment can you make to coaching and personal development?",
                            preferred_communication: "What's your preferred communication style and frequency?",
                            additional_info: "Is there anything else you'd like me to know?"
                          };
                          
                          return (
                            <div key={key} className="pb-4 border-b border-slate-100 last:border-0">
                              <p className="text-sm font-medium text-slate-700 mb-2">
                                {questionLabels[key] || key.replace(/_/g, ' ')}
                              </p>
                              <p className="text-sm text-slate-600 whitespace-pre-wrap">
                                {Array.isArray(value) ? value.join(", ") : value}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
                <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500">No intake forms submitted yet</p>
              </div>
            )}
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">Client Notes</h3>
                {!editingNotes && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingNotes(true);
                      setNotesDraft(client.notes || "");
                    }}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Notes
                  </Button>
                )}
              </div>

              {editingNotes ? (
                <div className="space-y-4">
                  <Textarea
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    className="min-h-[200px]"
                    placeholder="Add notes about this client..."
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => updateNotesMutation.mutate(notesDraft)}
                      disabled={updateNotesMutation.isPending}
                      className="bg-slate-800 hover:bg-slate-700"
                    >
                      {updateNotesMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Save Notes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingNotes(false);
                        setNotesDraft("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {client.notes ? (
                    <p className="text-slate-600 whitespace-pre-wrap">{client.notes}</p>
                  ) : (
                    <p className="text-slate-400 text-center py-8">No notes added yet</p>
                  )}
                </>
              )}
            </div>

            {/* AI Assistant */}
            <AINotesAssistant
              clientId={clientId}
              sessionType="regular"
              currentNote={notesDraft}
              onInsertSuggestion={(suggestion) => {
                const newNote = notesDraft 
                  ? `${notesDraft}\n\n${suggestion}`
                  : suggestion;
                setNotesDraft(newNote);
                if (!editingNotes) {
                  setEditingNotes(true);
                }
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Forms */}
      <ClientForm
        open={showClientForm}
        onClose={() => setShowClientForm(false)}
        onSubmit={(data) => updateClientMutation.mutate(data)}
        initialData={client}
        isLoading={updateClientMutation.isPending}
      />

      <SessionForm
        open={showSessionForm}
        onClose={() => {
          setShowSessionForm(false);
          setEditingSession(null);
        }}
        onSubmit={(data) => {
          if (editingSession) {
            updateSessionMutation.mutate({ 
              id: editingSession.id, 
              data,
              previousStatus: editingSession.status 
            });
          } else {
            createSessionMutation.mutate({ ...data, client_id: clientId, client_name: client.name });
          }
        }}
        initialData={editingSession}
        clients={allClients}
        isLoading={createSessionMutation.isPending || updateSessionMutation.isPending}
      />

      <GoalForm
        open={showGoalForm}
        onClose={() => {
          setShowGoalForm(false);
          setEditingGoal(null);
        }}
        onSubmit={(data) => {
          if (editingGoal) {
            updateGoalMutation.mutate({ id: editingGoal.id, data });
          } else {
            createGoalMutation.mutate({ ...data, client_id: clientId });
          }
        }}
        initialData={editingGoal}
        clientId={clientId}
        isLoading={createGoalMutation.isPending || updateGoalMutation.isPending}
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this {deleteDialog.type}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email Composer */}
      <EmailComposer
        open={showEmailComposer}
        onClose={() => setShowEmailComposer(false)}
        client={client}
      />

      {/* Resource Assignment Dialog */}
      <ResourceAssignmentDialog
        open={showResourceDialog}
        onClose={() => setShowResourceDialog(false)}
        clientId={clientId}
        clientName={client.name}
      />
    </div>
  );
}