import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, isWithinInterval, parseISO } from "date-fns";
import { 
  Calendar, Mail, MessageSquare, CheckCircle2, 
  Filter, Search, Clock, FileText, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";

export default function ClientHistory() {
  const [selectedClient, setSelectedClient] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [search, setSearch] = useState("");

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list()
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["client-sessions", selectedClient],
    queryFn: () => base44.entities.Session.filter({ client_id: selectedClient }),
    enabled: !!selectedClient
  });

  const { data: onboarding } = useQuery({
    queryKey: ["client-onboarding", selectedClient],
    queryFn: async () => {
      const result = await base44.entities.OnboardingChecklist.filter({ client_id: selectedClient });
      return result[0];
    },
    enabled: !!selectedClient
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["client-messages", selectedClient],
    queryFn: () => base44.entities.Message.filter({ client_id: selectedClient }),
    enabled: !!selectedClient
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["client-notifications", selectedClient],
    queryFn: () => base44.entities.Notification.filter({ client_id: selectedClient }),
    enabled: !!selectedClient
  });

  const { data: emails = [] } = useQuery({
    queryKey: ["client-emails", selectedClient],
    queryFn: () => base44.entities.Email.filter({ client_id: selectedClient }),
    enabled: !!selectedClient
  });

  const timeline = useMemo(() => {
    if (!selectedClient) return [];

    const events = [];

    // Add sessions
    sessions.forEach(session => {
      events.push({
        id: `session-${session.id}`,
        type: "session",
        date: new Date(session.date),
        title: `${session.type} session`,
        description: session.notes || session.outcomes || "No notes available",
        status: session.status,
        icon: Calendar,
        color: "blue"
      });
    });

    // Add onboarding milestones
    if (onboarding) {
      if (onboarding.started_date) {
        events.push({
          id: "onboarding-start",
          type: "onboarding",
          date: new Date(onboarding.started_date),
          title: "Onboarding started",
          description: `Client onboarding process initiated`,
          icon: CheckCircle2,
          color: "violet"
        });
      }
      
      onboarding.tasks?.forEach(task => {
        if (task.completed && task.completed_date) {
          events.push({
            id: `task-${task.order}`,
            type: "onboarding",
            date: new Date(task.completed_date),
            title: task.title,
            description: task.description || "Task completed",
            icon: CheckCircle2,
            color: "violet"
          });
        }
      });

      if (onboarding.completed_date) {
        events.push({
          id: "onboarding-complete",
          type: "onboarding",
          date: new Date(onboarding.completed_date),
          title: "Onboarding completed",
          description: "Client successfully onboarded",
          icon: CheckCircle2,
          color: "emerald"
        });
      }
    }

    // Add messages
    messages.forEach(msg => {
      events.push({
        id: `message-${msg.id}`,
        type: "message",
        date: new Date(msg.created_date),
        title: `Message from ${msg.sender_name}`,
        description: msg.content.substring(0, 150) + (msg.content.length > 150 ? "..." : ""),
        icon: MessageSquare,
        color: "slate"
      });
    });

    // Add email notifications
    notifications.forEach(notif => {
      if (notif.status === "sent") {
        events.push({
          id: `notification-${notif.id}`,
          type: "email",
          date: new Date(notif.sent_date || notif.created_date),
          title: notif.subject || notif.type.replace(/_/g, " "),
          description: notif.message?.substring(0, 150) || "Email sent to client",
          icon: Mail,
          color: "amber"
        });
      }
    });

    // Add logged emails
    emails.forEach(email => {
      events.push({
        id: `email-${email.id}`,
        type: "email",
        date: new Date(email.sent_date || email.created_date),
        title: email.subject,
        description: email.body?.substring(0, 150) + (email.body?.length > 150 ? "..." : ""),
        icon: Mail,
        color: "amber",
        status: email.status,
        direction: email.direction
      });
    });

    // Sort by date descending
    return events.sort((a, b) => b.date - a.date);
  }, [sessions, onboarding, messages, notifications, emails, selectedClient]);

  const filteredTimeline = useMemo(() => {
    return timeline.filter(event => {
      // Type filter
      if (typeFilter !== "all" && event.type !== typeFilter) return false;

      // Date range filter
      if (dateRange.from && dateRange.to) {
        try {
          if (!isWithinInterval(event.date, { start: dateRange.from, end: dateRange.to })) {
            return false;
          }
        } catch (e) {
          // Handle invalid dates
        }
      }

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          event.title.toLowerCase().includes(searchLower) ||
          event.description.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [timeline, typeFilter, dateRange, search]);

  const selectedClientData = clients.find(c => c.id === selectedClient);

  const typeColors = {
    session: "bg-blue-100 text-blue-700 border-blue-200",
    onboarding: "bg-violet-100 text-violet-700 border-violet-200",
    message: "bg-slate-100 text-slate-700 border-slate-200",
    email: "bg-amber-100 text-amber-700 border-amber-200"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Client History</h1>
          <p className="text-slate-500 mt-1">View complete interaction history and timeline</p>
        </div>

        {/* Client Selector & Filters */}
        <div className="bg-white rounded-xl border border-slate-100 p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Select Client</label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Interaction Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="session">Sessions</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="email">Emails</SelectItem>
                  <SelectItem value="message">Messages</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "MMM d, yyyy")
                      )
                    ) : (
                      "Pick a date range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarPicker
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                  {(dateRange.from || dateRange.to) && (
                    <div className="p-2 border-t">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setDateRange({ from: null, to: null })}
                        className="w-full"
                      >
                        Clear dates
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search history..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        {!selectedClient ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-100">
            <User className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">Select a Client</h3>
            <p className="text-slate-500">Choose a client above to view their complete history</p>
          </div>
        ) : filteredTimeline.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-100">
            <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No History Found</h3>
            <p className="text-slate-500">
              {search || dateRange.from ? "Try adjusting your filters" : "No interactions recorded yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedClientData && (
              <div className="bg-white rounded-xl border border-slate-100 p-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-white text-xl font-bold">
                    {selectedClientData.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800">{selectedClientData.name}</h2>
                    <p className="text-slate-500">{selectedClientData.email}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-sm text-slate-500">Total Events</p>
                    <p className="text-2xl font-bold text-slate-800">{filteredTimeline.length}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />

              {/* Timeline events */}
              <div className="space-y-4">
                {filteredTimeline.map((event, index) => {
                  const Icon = event.icon;
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="relative pl-16"
                    >
                      <div className={`absolute left-0 w-12 h-12 rounded-full bg-${event.color}-100 border-4 border-white shadow-sm flex items-center justify-center z-10`}>
                        <Icon className={`w-5 h-5 text-${event.color}-600`} />
                      </div>

                      <div className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-slate-800 capitalize">{event.title}</h3>
                            <Badge className={typeColors[event.type] + " border"}>
                              {event.type}
                            </Badge>
                            {event.status && (
                              <Badge variant="outline" className="capitalize">
                                {event.status}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center text-sm text-slate-500">
                            <Clock className="w-4 h-4 mr-1" />
                            {format(event.date, "MMM d, yyyy h:mm a")}
                          </div>
                        </div>
                        <p className="text-slate-600 text-sm">{event.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}