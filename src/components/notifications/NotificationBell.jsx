import { useState } from "react";
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Bell, CheckCircle, Clock, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const allNotifications = await base44.entities.Notification.list("-sent_date");
      // Get recent notifications (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return allNotifications.filter(n => {
        if (!n.sent_date) return false;
        return new Date(n.sent_date) > sevenDaysAgo;
      });
    },
    refetchInterval: 60000 // Refetch every minute
  });

  const unreadCount = notifications.filter(n => n.status === 'pending').length;

  const getIcon = (type) => {
    switch (type) {
      case 'session_reminder':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'session_followup':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'questionnaire_reminder':
        return <FileText className="w-4 h-4 text-violet-600" />;
      case 'progress_review':
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  const getTypeLabel = (type) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-600 text-white text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="border-b border-slate-100 p-4">
          <h3 className="font-semibold text-slate-800">Notifications</h3>
          <p className="text-xs text-slate-500 mt-0.5">Recent activity and reminders</p>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => (
                <div key={notification.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 mb-1">
                        {getTypeLabel(notification.type)}
                      </p>
                      <p className="text-xs text-slate-600 mb-1">
                        {notification.subject || 'No subject'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {notification.recipient_name} • {format(new Date(notification.sent_date), "MMM d, h:mm a")}
                      </p>
                    </div>
                    {notification.status === 'sent' && (
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No recent notifications</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}