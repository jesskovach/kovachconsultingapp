import { motion } from "framer-motion";
import { Calendar, Clock, Video, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import CalendarSyncButton from "@/components/calendar/CalendarSyncButton";
import PaymentButton from "@/components/payments/PaymentButton";

export default function PortalSessions({ sessions, onProvideFeedback, clientId, clientName }) {
  const statusColors = {
    scheduled: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-slate-100 text-slate-600"
  };

  const upcomingSessions = sessions.filter(s => s.status === 'scheduled' && new Date(s.date) > new Date());
  const pastSessions = sessions.filter(s => s.status === 'completed').slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-800 mb-4">Upcoming Sessions</h3>
          <div className="space-y-3">
            {upcomingSessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex flex-col items-center justify-center text-blue-700">
                      <span className="text-xs font-medium">{format(new Date(session.date), "MMM")}</span>
                      <span className="text-lg font-bold leading-none">{format(new Date(session.date), "d")}</span>
                    </div>
                    <div>
                      <Badge className={statusColors[session.status]}>{session.status}</Badge>
                      <p className="text-sm text-slate-600 mt-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {format(new Date(session.date), "h:mm a")} · {session.duration || 60} min
                      </p>
                      <p className="text-xs text-slate-500 mt-1 capitalize">{session.type} session</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <CalendarSyncButton session={session} size="sm" />
                    {clientId && clientName && (
                      <PaymentButton
                        amount={150}
                        description={`Coaching Session - ${format(new Date(session.date), "MMM d, yyyy")}`}
                        clientId={clientId}
                        clientName={clientName}
                        sessionId={session.id}
                        size="sm"
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Past Sessions */}
      {pastSessions.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-800 mb-4">Recent Sessions</h3>
          <div className="space-y-3">
            {pastSessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl border border-slate-100 p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600">
                        {format(new Date(session.date), "MMM d, yyyy")} · {format(new Date(session.date), "h:mm a")}
                      </span>
                    </div>
                    {session.outcomes && (
                      <p className="text-sm text-slate-600 mb-2">{session.outcomes}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onProvideFeedback(session)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Feedback
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
          <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500">No sessions scheduled yet</p>
        </div>
      )}
    </div>
  );
}