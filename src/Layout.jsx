import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, Users, Calendar, Target,
  Menu, X, ChevronRight, ClipboardCheck, BarChart3, CreditCard, Bell, BookOpen, FileText, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const navigation = [
  { name: "Dashboard", href: "Dashboard", icon: LayoutDashboard },
  { name: "Clients", href: "Clients", icon: Users },
  { name: "Sessions", href: "Sessions", icon: Calendar },
  { name: "History", href: "ClientHistory", icon: FileText },
  { name: "Onboarding", href: "Onboarding", icon: ClipboardCheck },
  { name: "Templates", href: "OnboardingTemplates", icon: FileText },
  { name: "Pipeline", href: "Pipeline", icon: Target },
  { name: "Resources", href: "Resources", icon: BookOpen },
  { name: "Team", href: "Team", icon: Users },
  { name: "Payments", href: "PaymentSettings", icon: CreditCard },
  { name: "Calendly", href: "CalendlySettings", icon: Calendar },
  { name: "Reminders", href: "ReminderSettings", icon: Bell },
  { name: "Reports", href: "Reports", icon: BarChart3 },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me()
  });

  useEffect(() => {
    if (!isLoading && user && user.role !== 'admin') {
      const allowedPages = ['ClientPortal', 'ClientIntake', 'CustomIntake'];
      if (!allowedPages.includes(currentPageName)) {
        navigate(createPageUrl('ClientPortal'), { replace: true });
      }
    }
  }, [user, isLoading, currentPageName, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user && user.role !== 'admin') {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-slate-900 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">KC</span>
            </div>
            <span className="font-semibold text-slate-900">
              Kovach Consulting Group
            </span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => base44.auth.logout()}
              className="hidden sm:flex"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md hover:bg-slate-100 transition-colors"
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
              className="lg:hidden fixed inset-0 z-40 bg-black/20"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed top-14 left-0 bottom-0 z-50 w-64 bg-white border-r border-slate-200 px-4 py-6"
            >
              <nav className="space-y-2">
                {navigation.map((item) => {
                  const isActive = currentPageName === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.href)}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-slate-100 text-slate-900"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  );
                })}
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    base44.auth.logout();
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 w-full"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 bg-white border-r border-slate-200">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-200">
            <div className="w-10 h-10 rounded-md bg-slate-900 flex items-center justify-center">
              <span className="text-white font-semibold">KC</span>
            </div>
            <div>
              <h1 className="font-semibold text-slate-900 text-sm">
                Kovach Consulting Group
              </h1>
              <p className="text-xs text-slate-500">
                Operational Dashboard
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = currentPageName === item.href;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.href)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                  {isActive && (
                    <ChevronRight className="w-4 h-4 ml-auto text-slate-500" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={() => base44.auth.logout()}
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="pt-14 lg:pt-0 px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}