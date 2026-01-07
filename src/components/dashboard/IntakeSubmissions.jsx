import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { FileText, Eye, Calendar, User, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function IntakeSubmissions() {
  const [selectedIntake, setSelectedIntake] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const { data: intakeForms = [] } = useQuery({
    queryKey: ["intakeForms"],
    queryFn: () => base44.entities.Questionnaire.filter({ type: "initial" }, "-created_date", 10)
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list()
  });

  const handleViewIntake = (intake) => {
    setSelectedIntake(intake);
    setViewDialogOpen(true);
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || "Unknown Client";
  };

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
    anything_else: "Is there anything else you want me to know?"
  };

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Recent Intake Forms</h2>
          <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
            {intakeForms.length} submitted
          </Badge>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          {intakeForms.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {intakeForms.map((intake, index) => (
                <motion.div
                  key={intake.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => handleViewIntake(intake)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-violet-100 flex-shrink-0">
                        <FileText className="w-4 h-4 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {getClientName(intake.client_id)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {intake.completed_date
                              ? format(new Date(intake.completed_date), "MMM d, yyyy 'at' h:mm a")
                              : format(new Date(intake.created_date), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                        {intake.status === "completed" && (
                          <Badge className="mt-2 bg-emerald-100 text-emerald-700 text-xs">
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewIntake(intake);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No intake forms submitted yet</p>
            </div>
          )}
        </div>
      </div>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-600" />
              Intake Form - {selectedIntake && getClientName(selectedIntake.client_id)}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            {selectedIntake?.responses && (
              <div className="space-y-6">
                {Object.entries(selectedIntake.responses).map(([key, value]) => {
                  if (!value || (Array.isArray(value) && value.length === 0)) return null;
                  
                  return (
                    <div key={key} className="pb-4 border-b border-slate-100 last:border-0">
                      <p className="text-sm font-medium text-slate-700 mb-2">
                        {questionLabels[key] || key}
                      </p>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap">
                        {Array.isArray(value) ? value.join(", ") : value}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}