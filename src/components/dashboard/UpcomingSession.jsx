import { format, isToday, isTomorrow } from "date-fns";
import { Clock, Video, User } from "lucide-react";
import { motion } from "framer-motion";

export default function UpcomingSession({ session, index }) {
  const sessionDate = new Date(session.date);
  
  const getDateLabel = () => {
    if (isToday(sessionDate)) return "Today";
    if (isTomorrow(sessionDate)) return "Tomorrow";
    return format(sessionDate, "EEE, MMM d");
  };

  const typeColors = {
    discovery: "bg-violet-100 text-violet-700",
    regular: "bg-blue-100 text-blue-700",
    "follow-up": "bg-emerald-100 text-emerald-700",
    assessment: "bg-amber-100 text-amber-700"
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 flex flex-col items-center justify-center text-white">
        <span className="text-xs font-medium opacity-80">{format(sessionDate, "MMM")}</span>
        <span className="text-lg font-bold leading-none">{format(sessionDate, "d")}</span>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-slate-800 truncate">{session.client_name || "Client"}</h4>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[session.type] || typeColors.regular}`}>
            {session.type}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {format(sessionDate, "h:mm a")}
          </span>
          <span>{session.duration || 60} min</span>
        </div>
      </div>

      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
          <Video className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
}