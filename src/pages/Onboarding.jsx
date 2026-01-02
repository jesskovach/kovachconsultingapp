import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Users, Search, Filter, CheckCircle2, Clock, 
  AlertCircle, ChevronRight, Plus, Settings
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ChecklistManager from "@/components/onboarding/ChecklistManager";

export default function Onboarding() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showChecklistManager, setShowChecklistManager] = useState(false);

  const queryClient = useQueryClient();

  const { data: checklists = [], isLoading } = useQuery({
    queryKey: ["onboarding-checklists"],
    queryFn: () => base44.entities.OnboardingChecklist.list("-created_date")
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list()
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["onboarding-templates"],
    queryFn: () => base44.entities.OnboardingTemplate.list()
  });

  const createChecklistMutation = useMutation({
    mutationFn: async (data) => base44.entities.OnboardingChecklist.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["onboarding-checklists"] })
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data) => base44.entities.OnboardingTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-templates"] });
      setShowChecklistManager(false);
    }
  });

  const handleStartOnboarding = async (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    // Get default template or create one
    let template = templates.find(t => t.is_default);
    if (!template && templates.length > 0) {
      template = templates[0];
    }

    const tasksToAdd = template?.tasks || [
      { id: Date.now().toString(), title: "Send welcome email", description: "", order: 1, completed: false },
      { id: (Date.now() + 1).toString(), title: "Send initial questionnaire", description: "", order: 2, completed: false },
      { id: (Date.now() + 2).toString(), title: "Schedule discovery session", description: "", order: 3, completed: false }
    ];

    await createChecklistMutation.mutateAsync({
      client_id: clientId,
      client_name: client.name,
      status: "in_progress",
      started_date: new Date().toISOString().split("T")[0],
      tasks: tasksToAdd
    });
  };

  const handleSaveTemplate = (tasks) => {
    createTemplateMutation.mutate({
      name: "Default Onboarding Template",
      description: "Standard onboarding checklist for new clients",
      is_default: true,
      tasks: tasks
    });
  };

  const filteredChecklists = checklists.filter((checklist) => {
    const matchesSearch = checklist.client_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || checklist.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const clientsWithoutOnboarding = clients.filter(
    (client) => 
      (client.status === "prospect" || client.status === "active") &&
      !checklists.some((c) => c.client_id === client.id)
  );

  const statusConfig = {
    not_started: { 
      icon: Clock, 
      color: "bg-slate-100 text-slate-600 border-slate-200", 
      label: "Not Started" 
    },
    in_progress: { 
      icon: AlertCircle, 
      color: "bg-blue-100 text-blue-700 border-blue-200", 
      label: "In Progress" 
    },
    completed: { 
      icon: CheckCircle2, 
      color: "bg-emerald-100 text-emerald-700 border-emerald-200", 
      label: "Completed" 
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Client Onboarding</h1>
            <p className="text-slate-500 mt-1">Manage and track client onboarding workflows</p>
          </div>
          <Button 
            variant="outline"
            onClick={() => setShowChecklistManager(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Customize Checklist
          </Button>
        </motion.div>

        {/* Clients Without Onboarding */}
        {clientsWithoutOnboarding.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Start Onboarding for {clientsWithoutOnboarding.length} Client{clientsWithoutOnboarding.length > 1 ? "s" : ""}
                </h3>
                <div className="space-y-2">
                  {clientsWithoutOnboarding.slice(0, 3).map((client) => (
                    <div key={client.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                      <div>
                        <p className="font-medium text-slate-800">{client.name}</p>
                        <p className="text-sm text-slate-500">{client.email}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleStartOnboarding(client.id)}
                        disabled={createChecklistMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Start Onboarding
                      </Button>
                    </div>
                  ))}
                </div>
                {clientsWithoutOnboarding.length > 3 && (
                  <p className="text-sm text-blue-700 mt-3">
                    And {clientsWithoutOnboarding.length - 3} more...
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Onboarding List */}
        {isLoading ? (
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredChecklists.length > 0 ? (
          <div className="grid gap-4">
            <AnimatePresence>
              {filteredChecklists.map((checklist, index) => {
                const config = statusConfig[checklist.status];
                const Icon = config.icon;
                const completedTasks = checklist.tasks?.filter(t => t.completed).length || 0;
                const totalTasks = checklist.tasks?.length || 0;
                const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

                return (
                  <motion.div
                    key={checklist.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={createPageUrl("OnboardingDetail") + `?id=${checklist.id}`}
                      className="block bg-white rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all p-6 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`p-3 rounded-xl ${config.color.replace("text-", "bg-").replace("100", "50")}`}>
                            <Icon className={`w-5 h-5 ${config.color.split(" ")[1]}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-slate-800">{checklist.client_name}</h3>
                              <Badge className={config.color + " border"}>
                                {config.label}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-6 text-sm text-slate-500">
                              <span>{completedTasks} of {totalTasks} tasks completed</span>
                              {checklist.started_date && (
                                <span>Started {new Date(checklist.started_date).toLocaleDateString()}</span>
                              )}
                              {checklist.questionnaire_sent && (
                                <Badge variant="outline" className="text-xs">
                                  Questionnaire {checklist.questionnaire_completed ? "✓" : "Sent"}
                                </Badge>
                              )}
                            </div>

                            <div className="mt-3 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full bg-blue-600 transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No onboarding in progress</h3>
            <p className="text-slate-500 mb-4">
              {search || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Start onboarding for your new clients"}
            </p>
          </div>
        )}
      </div>

      <ChecklistManager
        open={showChecklistManager}
        onClose={() => setShowChecklistManager(false)}
        onSave={handleSaveTemplate}
        initialTasks={templates.find(t => t.is_default)?.tasks || []}
      />
    </div>
  );
}