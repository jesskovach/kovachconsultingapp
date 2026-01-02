import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Bell, Mail, Calendar, Clock, CheckCircle2, AlertTriangle, 
  MessageSquare, X, Trash2, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function NotificationCenter({ open, onClose }) {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => base44.entities.Notification.list("-created_date", 50),
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { status: "sent" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notification deleted");
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const pendingNotifs = notifications.filter(n => n.status === "pending");
      await Promise.all(
        pendingNotifs.map(n => base44.entities.Notification.update(n.id, { status: "sent" }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    }
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case "session_reminder": return Calendar;
      case "email_received": return Mail;
      case "task_overdue": return AlertTriangle;
      case "client_activity": return MessageSquare;
      case "session_followup": return Clock;
      case "new_message": return MessageSquare;
      default: return Bell;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "session_reminder": return "blue";
      case "email_received": return "emerald";
      case "task_overdue": return "red";
      case "client_activity": return "violet";
      case "session_followup": return "amber";
      case "new_message": return "violet";
      default: return "slate";
    }
  };

  const unreadCount = notifications.filter(n => n.status === "pending").length;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />

          {/* Notification Panel */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-slate-700" />
                  <h2 className="text-lg font-semibold text-slate-800">Notifications</h2>
                  {unreadCount > 0 && (
                    <Badge className="bg-blue-600">{unreadCount}</Badge>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                  className="w-full"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark all as read
                </Button>
              )}
            </div>

            {/* Notifications List */}
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <Bell className="w-12 h-12 text-slate-200 mb-3" />
                  <p className="text-slate-500 text-center">No notifications yet</p>
                  <p className="text-slate-400 text-sm text-center mt-1">
                    You'll see important updates here
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((notification, index) => {
                    const Icon = getNotificationIcon(notification.type);
                    const color = getNotificationColor(notification.type);
                    const isUnread = notification.status === "pending";

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={cn(
                          "p-4 hover:bg-slate-50 transition-colors cursor-pointer group relative",
                          isUnread && "bg-blue-50/50"
                        )}
                        onClick={async () => {
                          if (isUnread) {
                            markAsReadMutation.mutate(notification.id);
                            // Also mark the actual messages as read if this is a message notification
                            if (notification.type === "new_message" && notification.client_id) {
                              const messages = await base44.entities.Message.filter({ 
                                client_id: notification.client_id,
                                read: false 
                              });
                              for (const msg of messages) {
                                if (msg.sender_email !== notification.recipient_email) {
                                  await base44.entities.Message.update(msg.id, { read: true });
                                }
                              }
                              queryClient.invalidateQueries({ queryKey: ["messages"] });
                            }
                          }
                        }}
                      >
                        <div className="flex gap-3">
                          <div className={`p-2 rounded-lg bg-${color}-50 flex-shrink-0 h-fit`}>
                            <Icon className={`w-4 h-4 text-${color}-600`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className={cn(
                                "text-sm font-medium",
                                isUnread ? "text-slate-900" : "text-slate-700"
                              )}>
                                {notification.subject || notification.type.replace(/_/g, " ")}
                              </h3>
                              {isUnread && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                              )}
                            </div>

                            {notification.message && (
                              <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                                {notification.message}
                              </p>
                            )}

                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-400">
                                {format(new Date(notification.created_date), "MMM d 'at' h:mm a")}
                              </span>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotificationMutation.mutate(notification.id);
                                }}
                              >
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}