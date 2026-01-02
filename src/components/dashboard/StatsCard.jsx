import { motion } from "framer-motion";

export default function StatsCard({ title, value, subtitle, icon: Icon, color = "blue" }) {
  const colorClasses = {
    blue: "bg-gradient-to-br from-slate-50 to-blue-50 border-blue-100",
    coral: "bg-gradient-to-br from-slate-50 to-orange-50 border-orange-100",
    green: "bg-gradient-to-br from-slate-50 to-emerald-50 border-emerald-100",
    purple: "bg-gradient-to-br from-slate-50 to-violet-50 border-violet-100"
  };

  const iconColors = {
    blue: "text-blue-600 bg-blue-100",
    coral: "text-orange-600 bg-orange-100",
    green: "text-emerald-600 bg-emerald-100",
    purple: "text-violet-600 bg-violet-100"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-2xl border ${colorClasses[color]} transition-all hover:shadow-lg hover:shadow-slate-200/50`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 tracking-wide uppercase">{title}</p>
          <p className="text-3xl font-semibold text-slate-800 mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${iconColors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </motion.div>
  );
}