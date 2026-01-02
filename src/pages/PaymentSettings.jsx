import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CreditCard, DollarSign, TrendingUp, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PaymentHistory from "@/components/payments/PaymentHistory";
import { motion } from "framer-motion";

export default function PaymentSettings() {
  const [selectedClient, setSelectedClient] = useState(null);

  const { data: payments = [] } = useQuery({
    queryKey: ["allPayments"],
    queryFn: () => base44.entities.Payment.list("-created_date")
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list()
  });

  const totalRevenue = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPayments = payments.filter(p => p.status === 'pending');
  const paidPayments = payments.filter(p => p.status === 'paid');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Payments</h1>
          <p className="text-slate-500 mt-1">Track client payments and revenue</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-100 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800 mb-1">
              ${totalRevenue.toLocaleString()}
            </p>
            <p className="text-sm text-slate-500">Total Revenue</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-slate-100 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800 mb-1">{paidPayments.length}</p>
            <p className="text-sm text-slate-500">Paid Invoices</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-slate-100 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800 mb-1">{pendingPayments.length}</p>
            <p className="text-sm text-slate-500">Pending Payments</p>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-white border border-slate-100 p-1">
            <TabsTrigger value="all">All Payments</TabsTrigger>
            <TabsTrigger value="by-client">By Client</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="bg-white rounded-xl border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Recent Payments</h3>
              {payments.length > 0 ? (
                <div className="space-y-3">
                  {payments.map((payment, index) => (
                    <motion.div
                      key={payment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{payment.client_name}</p>
                          <p className="text-sm text-slate-500">{payment.description}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {format(new Date(payment.created_date), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-800">${payment.amount.toFixed(2)}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          payment.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                          payment.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">No payments yet</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="by-client">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl border border-slate-100 p-4">
                  <h3 className="font-semibold text-slate-800 mb-4">Clients</h3>
                  <div className="space-y-2">
                    {clients.map((client) => {
                      const clientPayments = payments.filter(p => p.client_id === client.id);
                      if (clientPayments.length === 0) return null;
                      
                      return (
                        <button
                          key={client.id}
                          onClick={() => setSelectedClient(client.id)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedClient === client.id
                              ? 'bg-slate-100 text-slate-800'
                              : 'hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <p className="font-medium">{client.name}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {clientPayments.length} payment{clientPayments.length !== 1 ? 's' : ''}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3">
                {selectedClient ? (
                  <div className="bg-white rounded-xl border border-slate-100 p-6">
                    <h3 className="font-semibold text-slate-800 mb-4">Payment History</h3>
                    <PaymentHistory clientId={selectedClient} />
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
                    <CreditCard className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500">Select a client to view their payment history</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}