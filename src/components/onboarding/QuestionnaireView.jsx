import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle2, Clock, Send, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function QuestionnaireView({ questionnaire }) {
  const [showFullDialog, setShowFullDialog] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!questionnaire) return null;

  const statusConfig = {
    draft: { icon: FileText, color: "bg-slate-100 text-slate-700", label: "Draft" },
    sent: { icon: Send, color: "bg-blue-100 text-blue-700", label: "Sent" },
    completed: { icon: CheckCircle2, color: "bg-emerald-100 text-emerald-700", label: "Completed" }
  };

  const config = statusConfig[questionnaire.status];
  const Icon = config.icon;

  // Standard questionnaire fields
  const standardQuestions = [
    { key: "current_challenges", label: "Current Leadership Challenges" },
    { key: "coaching_goals", label: "Coaching Goals" },
    { key: "leadership_style", label: "Leadership Style" },
    { key: "previous_coaching", label: "Previous Coaching Experience" },
    { key: "success_metrics", label: "Success Metrics" },
    { key: "time_commitment", label: "Time Commitment" },
    { key: "preferred_communication", label: "Preferred Communication" },
    { key: "additional_info", label: "Additional Information" }
  ];

  // Custom intake form fields
  const customIntakeQuestions = [
    { key: "current_work", label: "What kind of work are you doing right now?" },
    { key: "environment_feel", label: "How does your current environment feel?" },
    { key: "capacity", label: "How's your capacity at the moment?" },
    { key: "decision_reason", label: "What made you decide to book this conversation now?" },
    { key: "specific_situation", label: "Is there a specific situation, decision, or pattern that's been on your mind?" },
    { key: "most_important", label: "What feels most important about it?" },
    { key: "feels_unclear", label: "What feels unclear, stuck, or hard to name right now?" },
    { key: "pressures_constraints", label: "What pressures or constraints feel most present for you lately?" },
    { key: "outside_control", label: "Are there parts of this situation that feel outside your control?" },
    { key: "complex_response", label: "When things get complex or high-stakes, what do you usually do?" },
    { key: "unhelpful_advice", label: "What kinds of advice or support have not been helpful in the past?" },
    { key: "impact_cost", label: "If this situation has been costing you something, what has that looked like?" },
    { key: "future_feeling", label: "In a few months, what do you hope has changed for you?" },
    { key: "worthwhile", label: "What would make this conversation feel worthwhile to you?" },
    { key: "previous_coaching_details", label: "Previous coaching experience details" },
    { key: "anything_else", label: "Is there anything else you want me to know before we meet?" }
  ];

  // Combine all questions
  const allQuestions = [...standardQuestions, ...customIntakeQuestions];

  // Get all responses that have values
  const getFilledResponses = () => {
    if (!questionnaire.responses) return [];
    
    return allQuestions
      .filter(q => {
        const response = questionnaire.responses[q.key];
        if (Array.isArray(response)) return response.length > 0;
        return response && response.trim && response.trim() !== "";
      })
      .map(q => ({
        ...q,
        response: questionnaire.responses[q.key]
      }));
  };

  const filledResponses = getFilledResponses();
  const previewResponses = filledResponses.slice(0, 3);
  const hasMoreResponses = filledResponses.length > 3;

  const formatResponse = (response) => {
    if (Array.isArray(response)) {
      return response.join(", ");
    }
    return response;
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-100 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.color.replace("text-", "bg-").replace("100", "50")}`}>
              <Icon className={`w-5 h-5 ${config.color.split(" ")[1]}`} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Initial Questionnaire</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                {questionnaire.status === "completed" && questionnaire.completed_date
                  ? `Completed ${new Date(questionnaire.completed_date).toLocaleDateString()}`
                  : questionnaire.status === "sent" && questionnaire.sent_date
                  ? `Sent ${new Date(questionnaire.sent_date).toLocaleDateString()}`
                  : "Not yet sent"}
              </p>
            </div>
          </div>
          <Badge className={config.color}>{config.label}</Badge>
        </div>

        {questionnaire.status === "completed" && questionnaire.responses && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4 mt-6"
          >
            {/* Preview of responses */}
            {previewResponses.map((item, index) => (
              <div key={item.key} className="border-t border-slate-100 pt-4">
                <p className="text-sm font-medium text-slate-700 mb-2">{item.label}</p>
                <p className="text-sm text-slate-600 whitespace-pre-wrap line-clamp-3">
                  {formatResponse(item.response)}
                </p>
              </div>
            ))}

            {/* Expanded view */}
            <AnimatePresence>
              {expanded && filledResponses.slice(3).map((item, index) => (
                <motion.div 
                  key={item.key}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-slate-100 pt-4"
                >
                  <p className="text-sm font-medium text-slate-700 mb-2">{item.label}</p>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">
                    {formatResponse(item.response)}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Actions */}
            {filledResponses.length > 0 && (
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                {hasMoreResponses && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpanded(!expanded)}
                    className="text-slate-600"
                  >
                    {expanded ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-1" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-1" />
                        Show {filledResponses.length - 3} More Responses
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFullDialog(true)}
                  className="ml-auto"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View Full Survey
                </Button>
              </div>
            )}

            {filledResponses.length === 0 && (
              <div className="text-center py-4 text-sm text-slate-500">
                No responses recorded yet
              </div>
            )}
          </motion.div>
        )}

        {questionnaire.status === "sent" && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Clock className="w-4 h-4" />
              <span>Waiting for client to complete questionnaire</span>
            </div>
          </div>
        )}

        {questionnaire.status === "draft" && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-600">
              This questionnaire is ready to be sent to the client.
            </p>
          </div>
        )}
      </div>

      {/* Full Survey Dialog */}
      <Dialog open={showFullDialog} onOpenChange={setShowFullDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-600" />
              Full Intake Survey
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6">
              {filledResponses.map((item, index) => (
                <div key={item.key} className={index > 0 ? "border-t border-slate-100 pt-6" : ""}>
                  <p className="text-sm font-semibold text-slate-800 mb-2">{item.label}</p>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 rounded-lg p-3">
                    {formatResponse(item.response)}
                  </p>
                </div>
              ))}
              {filledResponses.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  No responses recorded
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}