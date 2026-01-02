import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { 
  ArrowLeft, Mail, Phone, Building2, Briefcase, Calendar, 
  Target, Edit2, Plus, Trash2, MoreHorizontal 
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
import ClientForm from "@/components/clients/ClientForm";
import SessionForm from "@/components/sessions/SessionForm";
import GoalForm from "@/components/goals/GoalForm";
import GoalCard from "@/components/goals/GoalCard";
import CalendarSyncButton from "@/components/calendar/CalendarSyncButton";
import PaymentHistory from "@/components/payments/PaymentHistory";

export default function ClientDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get("id");

  const [showClientForm, setShowClientForm] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: null, id: null });

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
    queryFn: () => base44.entities.Goal.filter({ client_id: clientId }),
    enabled: !!clientId
  });

  const { data: allClients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list()
  });

  const updateClientMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.update(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      setShowClientForm(false);
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
    mutationFn: ({ id, data }) => base44.entities.Session.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions", clientId] });
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
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowClientForm(true)}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
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
            <TabsTrigger value="payments" className="data-[state=active]:bg-slate-100">
              Payments
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
                              <CalendarSyncButton session={session} />
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
                      onClick={() => {
                        setEditingGoal(goal);
                        setShowGoalForm(true);
                      }}
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
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <PaymentHistory clientId={clientId} />
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <div className="bg-white rounded-xl border border-slate-100 p-6">
              {client.notes ? (
                <p className="text-slate-600 whitespace-pre-wrap">{client.notes}</p>
              ) : (
                <p className="text-slate-400 text-center py-8">No notes added yet</p>
              )}
            </div>
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
            updateSessionMutation.mutate({ id: editingSession.id, data });
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
    </div>
  );
}