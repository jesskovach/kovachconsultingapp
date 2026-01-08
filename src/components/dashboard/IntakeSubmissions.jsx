import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { FileText, Calendar, User, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function IntakeSubmissions() {

  const { data: intakeForms = [] } = useQuery({
    queryKey: ["intakeForms"],
    queryFn: () => base44.entities.Questionnaire.filter({ type: "initial" }, "-created_date", 10)
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list()
  });

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || "Unknown Client";
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
                <Link
                  key={intake.id}
                  to={createPageUrl("ClientDetail") + `?id=${intake.client_id}`}
                  className="block"
                >
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
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
                      <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    </div>
                  </motion.div>
                </Link>
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
    </>
  );
}