import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { AlertCircle, Clock, CheckCircle2, Mail, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function FollowUpReminders() {
  const { data, isLoading } = useQuery({
    queryKey: ["follow-up-reminders"],
    queryFn: async () => {
      const response = await base44.functions.invoke('getFollowUpReminders');
      return response.data;
    },
    refetchInterval: 60000 // Refresh every minute
  });

  const priorityConfig = {
    high: {
      icon: AlertCircle,
      color: "bg-red-100 text-red-700 border-red-200",
      badge: "bg-red-100 text-red-700",
      label: "Urgent"
    },
    medium: {
      icon: Clock,
      color: "bg-amber-100 text-amber-700 border-amber-200",
      badge: "bg-amber-100 text-amber-700",
      label: "Soon"
    },
    low: {
      icon: CheckCircle2,
      color: "bg-blue-100 text-blue-700 border-blue-200",
      badge: "bg-blue-100 text-blue-700",
      label: "Low"
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-slate-100 rounded w-1/3"></div>
          <div className="h-20 bg-slate-100 rounded"></div>
          <div className="h-20 bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  const reminders = data?.reminders || [];
  const highPriority = reminders.filter(r => r.priority === 'high');

  if (reminders.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-slate-800">Follow-Up Reminders</h3>
        </div>
        <p className="text-sm text-slate-500">All clients are up to date! 🎉</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-800">Follow-Up Reminders</h3>
        </div>
        {highPriority.length > 0 && (
          <Badge className="bg-red-100 text-red-700">
            {highPriority.length} Urgent
          </Badge>
        )}
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {reminders.slice(0, 10).map((reminder, index) => {
          const config = priorityConfig[reminder.priority];
          const Icon = config.icon;

          return (
            <motion.div
              key={reminder.client_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-lg border ${config.color}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        to={createPageUrl("ClientDetail") + `?id=${reminder.client_id}`}
                        className="font-medium text-slate-800 hover:text-blue-600 truncate"
                      >
                        {reminder.client_name}
                      </Link>
                      <Badge variant="outline" className="text-xs">
                        {config.label}
                      </Badge>
                    </div>
                    <ul className="text-xs text-slate-600 space-y-1">
                      {reminder.reasons.map((reason, i) => (
                        <li key={i}>• {reason}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    asChild
                  >
                    <a href={`mailto:${reminder.client_email}`}>
                      <Mail className="w-3 h-3" />
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    asChild
                  >
                    <Link to={createPageUrl("Sessions")}>
                      <Calendar className="w-3 h-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {reminders.length > 10 && (
        <p className="text-xs text-slate-500 text-center mt-3">
          And {reminders.length - 10} more clients need follow-up
        </p>
      )}
    </div>
  );
}