import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  LayoutDashboard, Users, Calendar, Target, 
  Menu, X, ChevronRight, ClipboardCheck, BarChart3, CreditCard, Bell, BookOpen
} from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navigation = [
  { name: "Dashboard", href: "Dashboard", icon: LayoutDashboard },
  { name: "Clients", href: "Clients", icon: Users },
  { name: "Sessions", href: "Sessions", icon: Calendar },
  { name: "Onboarding", href: "Onboarding", icon: ClipboardCheck },
  { name: "Pipeline", href: "Pipeline", icon: Target },
  { name: "Resources", href: "Resources", icon: BookOpen },
  { name: "Payments", href: "PaymentSettings", icon: CreditCard },
  { name: "Reminders", href: "ReminderSettings", icon: Bell },
  { name: "Reports", href: "Reports", icon: BarChart3 },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">EC</span>
            </div>
            <span className="font-semibold text-slate-800">CoachCRM</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-slate-600" />
              ) : (
                <Menu className="w-5 h-5 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed top-14 left-0 bottom-0 z-50 w-64 bg-white border-r border-slate-100 p-4"
            >
              <nav className="space-y-1">
                {navigation.map((item) => {
                  const isActive = currentPageName === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.href)}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? "bg-slate-100 text-slate-800"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 bg-white border-r border-slate-100">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center shadow-lg shadow-slate-200">
              <span className="text-white font-bold">EC</span>
            </div>
            <div>
              <h1 className="font-bold text-slate-800">CoachCRM</h1>
              <p className="text-xs text-slate-400">Executive Coaching</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = currentPageName === item.href;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.href)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? "bg-slate-800 text-white shadow-lg shadow-slate-200"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "text-white" : ""}`} />
                  {item.name}
                  {isActive && (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <NotificationBell />
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
              <p className="text-xs text-slate-500 mb-2">Pro Tip</p>
              <p className="text-sm text-slate-600">Track client goals to measure coaching impact over time.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="pt-14 lg:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}