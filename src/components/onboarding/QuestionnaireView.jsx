import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle2, Clock, Send } from "lucide-react";

export default function QuestionnaireView({ questionnaire }) {
  if (!questionnaire) return null;

  const statusConfig = {
    draft: { icon: FileText, color: "bg-slate-100 text-slate-700", label: "Draft" },
    sent: { icon: Send, color: "bg-blue-100 text-blue-700", label: "Sent" },
    completed: { icon: CheckCircle2, color: "bg-emerald-100 text-emerald-700", label: "Completed" }
  };

  const config = statusConfig[questionnaire.status];
  const Icon = config.icon;

  const questions = [
    { key: "current_challenges", label: "Current Leadership Challenges" },
    { key: "coaching_goals", label: "Coaching Goals" },
    { key: "leadership_style", label: "Leadership Style" },
    { key: "previous_coaching", label: "Previous Coaching Experience" },
    { key: "success_metrics", label: "Success Metrics" },
    { key: "time_commitment", label: "Time Commitment" },
    { key: "preferred_communication", label: "Preferred Communication" },
    { key: "additional_info", label: "Additional Information" }
  ];

  return (
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
          {questions.map((q, index) => {
            const response = questionnaire.responses[q.key];
            if (!response) return null;

            return (
              <div key={q.key} className="border-t border-slate-100 pt-4">
                <p className="text-sm font-medium text-slate-700 mb-2">{q.label}</p>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{response}</p>
              </div>
            );
          })}
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
  );
}