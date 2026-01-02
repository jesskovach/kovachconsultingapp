import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronRight, Target, Calendar } from "lucide-react";

export default function ClientCard({ client, index }) {
  const statusColors = {
    active: "bg-emerald-100 text-emerald-700",
    paused: "bg-amber-100 text-amber-700",
    completed: "bg-slate-100 text-slate-700",
    prospect: "bg-blue-100 text-blue-700"
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={createPageUrl("ClientDetail") + `?id=${client.id}`}
        className="block p-4 rounded-xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-white font-semibold text-sm">
            {client.avatar_url ? (
              <img src={client.avatar_url} alt={client.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              getInitials(client.name)
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-800 truncate">{client.name}</h4>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[client.status] || statusColors.prospect}`}>
                {client.status}
              </span>
            </div>
            <p className="text-sm text-slate-500 truncate">{client.role} {client.company && `at ${client.company}`}</p>
          </div>

          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
        </div>

        {client.coaching_focus && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500 line-clamp-2">
              <span className="font-medium">Focus:</span> {client.coaching_focus}
            </p>
          </div>
        )}
      </Link>
    </motion.div>
  );
}