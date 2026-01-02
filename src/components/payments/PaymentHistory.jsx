import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CreditCard, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function PaymentHistory({ clientId }) {
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments", clientId],
    queryFn: () => base44.entities.Payment.filter({ client_id: clientId }, "-created_date"),
    enabled: !!clientId
  });

  const statusConfig = {
    paid: { icon: CheckCircle, color: "bg-emerald-100 text-emerald-700", label: "Paid" },
    pending: { icon: Clock, color: "bg-amber-100 text-amber-700", label: "Pending" },
    failed: { icon: XCircle, color: "bg-red-100 text-red-700", label: "Failed" },
    refunded: { icon: RefreshCw, color: "bg-slate-100 text-slate-700", label: "Refunded" }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
        <CreditCard className="w-12 h-12 text-slate-200 mx-auto mb-3" />
        <p className="text-slate-500">No payment history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment, index) => {
        const config = statusConfig[payment.status];
        const Icon = config.icon;

        return (
          <motion.div
            key={payment.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl border border-slate-100 p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">{payment.description}</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {format(new Date(payment.created_date), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                  {payment.paid_date && (
                    <p className="text-xs text-slate-400 mt-1">
                      Paid on {format(new Date(payment.paid_date), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-slate-800 mb-1">
                  ${payment.amount.toFixed(2)}
                </p>
                <Badge className={config.color}>
                  <Icon className="w-3 h-3 mr-1" />
                  {config.label}
                </Badge>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}