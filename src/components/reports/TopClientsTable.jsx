import { motion } from "framer-motion";
import { Trophy, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TopClientsTable({ clients }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-5 h-5 text-amber-500" />
        <h3 className="font-semibold text-slate-800">Most Engaged Clients</h3>
      </div>
      <div className="space-y-3">
        {clients.map((client, index) => (
          <motion.div
            key={client.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              to={createPageUrl("ClientDetail") + `?id=${client.id}`}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                  index === 0 ? "bg-amber-100 text-amber-700" :
                  index === 1 ? "bg-slate-100 text-slate-700" :
                  index === 2 ? "bg-orange-100 text-orange-700" :
                  "bg-slate-50 text-slate-600"
                }`}>
                  #{index + 1}
                </div>
                <div>
                  <p className="font-medium text-slate-800 group-hover:text-slate-600">
                    {client.name}
                  </p>
                  <p className="text-xs text-slate-500">{client.company}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-800">{client.sessionCount} sessions</p>
                  <p className="text-xs text-slate-500">{client.goalCompletion}% goals</p>
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}