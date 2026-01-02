import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  ArrowLeft, Mail, Calendar, CheckCircle2, Circle, 
  Send, FileText, Loader2, ExternalLink 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import QuestionnaireView from "@/components/onboarding/QuestionnaireView";

export default function OnboardingDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const checklistId = urlParams.get("id");

  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailType, setEmailType] = useState(null);
  const [notes, setNotes] = useState("");

  const queryClient = useQueryClient();

  const { data: checklist, isLoading } = useQuery({
    queryKey: ["onboarding-checklist", checklistId],
    queryFn: async () => {
      const checklists = await base44.entities.OnboardingChecklist.filter({ id: checklistId });
      return checklists[0];
    },
    enabled: !!checklistId
  });

  const { data: questionnaire } = useQuery({
    queryKey: ["questionnaire", checklist?.client_id],
    queryFn: async () => {
      const questionnaires = await base44.entities.Questionnaire.filter({ 
        client_id: checklist.client_id,
        type: "initial"
      });
      return questionnaires[0];
    },
    enabled: !!checklist?.client_id
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions", checklist?.client_id],
    queryFn: () => base44.entities.Session.filter({ client_id: checklist.client_id }),
    enabled: !!checklist?.client_id
  });

  const updateChecklistMutation = useMutation({
    mutationFn: (data) => base44.entities.OnboardingChecklist.update(checklistId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-checklist", checklistId] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-checklists"] });
    }
  });

  const sendEmailMutation = useMutation({
    mutationFn: async ({ clientId, type }) => {
      const response = await base44.functions.invoke("sendOnboardingEmail", {
        clientId,
        type
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Email sent successfully");
      setShowEmailDialog(false);
      queryClient.invalidateQueries({ queryKey: ["onboarding-checklist", checklistId] });
      queryClient.invalidateQueries({ queryKey: ["questionnaire"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send email");
    }
  });

  const handleToggleTask = (taskId) => {
    if (!checklist) return;

    const updatedTasks = checklist.tasks.map(task =>
      task.id === taskId
        ? {
            ...task,
            completed: !task.completed,
            completed_date: !task.completed ? new Date().toISOString() : null
          }
        : task
    );

    const completedCount = updatedTasks.filter(t => t.completed).length;
    const allCompleted = completedCount === updatedTasks.length;

    updateChecklistMutation.mutate({
      tasks: updatedTasks,
      status: allCompleted ? "completed" : updatedTasks.some(t => t.completed) ? "in_progress" : "not_started",
      completed_date: allCompleted ? new Date().toISOString().split("T")[0] : null
    });
  };

  const handleSendEmail = (type) => {
    setEmailType(type);
    setShowEmailDialog(true);
  };

  const confirmSendEmail = () => {
    if (!checklist) return;
    sendEmailMutation.mutate({ 
      clientId: checklist.client_id, 
      type: emailType 
    });
  };

  const handleSaveNotes = () => {
    updateChecklistMutation.mutate({ notes });
    toast.success("Notes saved");
  };

  const discoverySession = sessions.find(s => s.type === "discovery");

  if (isLoading || !checklist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link 
          to={createPageUrl("Onboarding")}
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Onboarding
        </Link>

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">{checklist.client_name}</h1>
              <p className="text-slate-500 mt-1">Onboarding Workflow</p>
            </div>
            <Link
              to={createPageUrl("ClientDetail") + `?id=${checklist.client_id}`}
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
            >
              View Client Profile
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => handleSendEmail("welcome")}
            disabled={sendEmailMutation.isPending}
            className="justify-start h-auto p-4"
          >
            <Mail className="w-5 h-5 mr-3 text-blue-600" />
            <div className="text-left">
              <p className="font-medium">Send Welcome Email</p>
              <p className="text-xs text-slate-500">Introduce yourself & next steps</p>
            </div>
          </Button>

          <Button
            variant="outline"
            onClick={() => handleSendEmail("questionnaire")}
            disabled={sendEmailMutation.isPending || checklist.questionnaire_sent}
            className="justify-start h-auto p-4"
          >
            <FileText className="w-5 h-5 mr-3 text-violet-600" />
            <div className="text-left">
              <p className="font-medium">
                {checklist.questionnaire_sent ? "Questionnaire Sent ✓" : "Send Questionnaire"}
              </p>
              <p className="text-xs text-slate-500">Pre-coaching assessment</p>
            </div>
          </Button>

          <Button
            variant="outline"
            onClick={() => handleSendEmail("discovery_prep")}
            disabled={sendEmailMutation.isPending || !discoverySession}
            className="justify-start h-auto p-4"
          >
            <Calendar className="w-5 h-5 mr-3 text-emerald-600" />
            <div className="text-left">
              <p className="font-medium">Send Session Prep</p>
              <p className="text-xs text-slate-500">Discovery session materials</p>
            </div>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Overview */}
            <OnboardingProgress checklist={checklist} />

            {/* Checklist */}
            <div className="bg-white rounded-xl border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Onboarding Tasks</h3>
              <div className="space-y-3">
                {checklist.tasks
                  ?.sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-4 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => handleToggleTask(task.id)}
                    >
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => handleToggleTask(task.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className={`font-medium ${
                          task.completed ? "text-slate-500 line-through" : "text-slate-800"
                        }`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Questionnaire */}
            {questionnaire && <QuestionnaireView questionnaire={questionnaire} />}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Discovery Session */}
            <div className="bg-white rounded-xl border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Discovery Session</h3>
              {discoverySession ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">
                      {new Date(discoverySession.date).toLocaleDateString()} at{" "}
                      {new Date(discoverySession.date).toLocaleTimeString([], { 
                        hour: "numeric", 
                        minute: "2-digit" 
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-slate-600">Scheduled</span>
                  </div>
                  <Link
                    to={createPageUrl("Sessions")}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-2"
                  >
                    View in Sessions
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Circle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 mb-3">No discovery session scheduled yet</p>
                  <p className="text-xs text-slate-400 mb-4">
                    Once the client completes the intake form, schedule their first session
                  </p>
                  <Link to={createPageUrl("Sessions")}>
                    <Button size="sm" variant="outline">
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Discovery Session
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Onboarding Notes</h3>
              <Textarea
                placeholder="Add notes about this client's onboarding..."
                value={notes || checklist.notes || ""}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[120px] mb-3"
              />
              <Button
                size="sm"
                onClick={handleSaveNotes}
                disabled={updateChecklistMutation.isPending}
                className="w-full"
              >
                {updateChecklistMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Save Notes
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Email Confirmation Dialog */}
      <AlertDialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Email</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to send the{" "}
              {emailType === "welcome" && "welcome"}
              {emailType === "questionnaire" && "questionnaire"}
              {emailType === "discovery_prep" && "discovery session prep"}{" "}
              email to {checklist.client_name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmSendEmail}
              disabled={sendEmailMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sendEmailMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}