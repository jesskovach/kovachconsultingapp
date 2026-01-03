import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, isTomorrow, isPast, startOfWeek, endOfWeek, isWithinInterval, addWeeks } from "date-fns";
import { Calendar, Clock, Plus, Filter, ChevronRight, MoreHorizontal, Edit2, Trash2, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import SessionForm from "@/components/sessions/SessionForm";
import PaymentButton from "@/components/payments/PaymentButton";

export default function Sessions() {
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("upcoming");

  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => base44.entities.Session.list("-date")
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Session.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setShowForm(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Session.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setShowForm(false);
      setEditingSession(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Session.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setDeleteId(null);
    }
  });

  const handleSubmit = (data) => {
    if (editingSession) {
      updateMutation.mutate({ id: editingSession.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredSessions = sessions.filter((session) => {
    const sessionDate = new Date(session.date);
    const now = new Date();
    
    // Status filter
    if (filterStatus !== "all" && session.status !== filterStatus) return false;

    // Period filter
    if (filterPeriod === "upcoming" && isPast(sessionDate) && !isToday(sessionDate)) return false;
    if (filterPeriod === "today" && !isToday(sessionDate)) return false;
    if (filterPeriod === "this_week") {
      const weekStart = startOfWeek(now);
      const weekEnd = endOfWeek(now);
      if (!isWithinInterval(sessionDate, { start: weekStart, end: weekEnd })) return false;
    }
    if (filterPeriod === "past" && !isPast(sessionDate)) return false;

    return true;
  }).sort((a, b) => {
    if (filterPeriod === "past") {
      return new Date(b.date) - new Date(a.date);
    }
    return new Date(a.date) - new Date(b.date);
  });

  const statusColors = {
    scheduled: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-slate-100 text-slate-600",
    "no-show": "bg-red-100 text-red-700"
  };

  const typeColors = {
    discovery: "bg-violet-100 text-violet-700",
    regular: "bg-slate-100 text-slate-700",
    "follow-up": "bg-emerald-100 text-emerald-700",
    assessment: "bg-amber-100 text-amber-700"
  };

  const getDateLabel = (date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEEE, MMMM d");
  };

  // Group sessions by date
  const groupedSessions = filteredSessions.reduce((groups, session) => {
    const dateKey = format(new Date(session.date), "yyyy-MM-dd");
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(session);
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Sessions</h1>
            <p className="text-slate-500 mt-1">Manage your coaching sessions</p>
          </div>
          <Button 
            onClick={() => {
              setEditingSession(null);
              setShowForm(true);
            }}
            className="bg-slate-800 hover:bg-slate-700 shadow-lg shadow-slate-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule Session
          </Button>
        </motion.div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-40">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="past">Past</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no-show">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sessions List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : Object.keys(groupedSessions).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedSessions).map(([dateKey, dateSessions]) => (
              <div key={dateKey}>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  {getDateLabel(new Date(dateKey))}
                </h3>
                <div className="space-y-3">
                  <AnimatePresence>
                    {dateSessions.map((session, index) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-lg hover:border-slate-200 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 flex flex-col items-center justify-center text-white flex-shrink-0">
                            <span className="text-xs font-medium opacity-80">
                              {format(new Date(session.date), "h:mm")}
                            </span>
                            <span className="text-xs opacity-60">
                              {format(new Date(session.date), "a")}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Link 
                                to={createPageUrl("ClientDetail") + `?id=${session.client_id}`}
                                className="font-semibold text-slate-800 hover:text-slate-600 truncate"
                              >
                                {session.client_name || "Unknown Client"}
                              </Link>
                              <Badge className={statusColors[session.status]}>{session.status}</Badge>
                              <Badge variant="outline" className={typeColors[session.type]}>{session.type}</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {session.duration || 60} min
                              </span>
                              {session.notes && (
                                <span className="truncate max-w-xs">{session.notes}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {session.status === 'scheduled' && (
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
                            )}
                            <Link
                              to={createPageUrl("ClientDetail") + `?id=${session.client_id}`}
                              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </Link>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setEditingSession(session);
                                  setShowForm(true);
                                }}>
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => setDeleteId(session.id)}
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
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No sessions found</h3>
            <p className="text-slate-500 mb-4">
              {filterStatus !== "all" || filterPeriod !== "upcoming"
                ? "Try adjusting your filters"
                : "Start by scheduling your first session"}
            </p>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-slate-800 hover:bg-slate-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Schedule Session
            </Button>
          </div>
        )}
      </div>

      <SessionForm
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingSession(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingSession}
        clients={clients}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this session? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}